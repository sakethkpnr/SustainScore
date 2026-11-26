import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import User, Repository, AnalysisHistory, SavedRepository, UserSetting
from ..schemas import AnalyzeIn, BulkAnalyzeIn, CompareIn
from ..auth import get_current_user
from ..github_service import analyze_repository

router = APIRouter(prefix="/api/repositories", tags=["Repositories"])


def analyze_and_store(url: str, db: Session, user: User, save: bool = False):
    """Analyze one repository and persist the latest snapshot for this user."""
    settings = db.query(UserSetting).filter_by(user_id=user.id).first()
    if not settings:
        settings = UserSetting(user_id=user.id)
        db.add(settings)
        db.flush()
    weights = {
        "contributor": settings.contributor_weight,
        "release": settings.release_weight,
        "commit": settings.commit_weight,
        "issue": settings.issue_weight,
        "maintainer": settings.maintainer_weight,
    }
    result = analyze_repository(url, weights)
    repo = db.query(Repository).filter(Repository.github_url == result["github_url"]).first()
    if not repo:
        repo = Repository(
            owner=result["owner"], repo_name=result["repo_name"],
            github_url=result["github_url"], description=result["description"],
            language=result["language"], stars=result["stars"], forks=result["forks"],
            open_issues=result["open_issues"], last_pushed_at=result["last_pushed_at"]
        )
        db.add(repo)
        db.flush()
    else:
        repo.description = result["description"]
        repo.language = result["language"]
        repo.stars = result["stars"]
        repo.forks = result["forks"]
        repo.open_issues = result["open_issues"]
        repo.last_pushed_at = result["last_pushed_at"]

    scores = result["scores"]
    history = AnalysisHistory(
        user_id=user.id, repository_id=repo.id,
        maturity_score=result["maturity_score"], maturity_level=result["maturity_level"],
        contributor_score=scores["contributor_score"],
        release_score=scores["release_score"], commit_score=scores["commit_score"],
        issue_score=scores["issue_score"], maintainer_score=scores["maintainer_score"],
        metrics_json=json.dumps(result)
    )
    db.add(history)
    db.flush()

    if save:
        exists = db.query(SavedRepository).filter_by(
            user_id=user.id, repository_id=repo.id
        ).first()
        if not exists:
            db.add(SavedRepository(user_id=user.id, repository_id=repo.id))

    result["repository_id"] = repo.id
    result["analysis_id"] = history.id
    db.commit()
    return result


@router.post("/analyze")
def analyze(payload: AnalyzeIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return analyze_and_store(payload.github_url, db, user)
    except ValueError as e:
        db.rollback()
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(502, f"GitHub analysis failed: {str(e)}")


@router.post("/bulk-analyze")
def bulk_analyze(payload: BulkAnalyzeIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Normalize whitespace and remove duplicate URLs while preserving input order.
    urls = list(dict.fromkeys(url.strip() for url in payload.github_urls if url.strip()))
    if not urls:
        raise HTTPException(400, "Enter at least one GitHub repository URL.")

    results = []
    for url in urls:
        try:
            result = analyze_and_store(url, db, user, save=True)
            results.append({
                "github_url": result["github_url"],
                "repository": f"{result['owner']}/{result['repo_name']}",
                "repository_id": result["repository_id"],
                "maturity_score": result["maturity_score"],
                "status": "success",
                "message": "Analyzed and saved"
            })
        except Exception as e:
            db.rollback()
            results.append({
                "github_url": url,
                "repository": url,
                "status": "failed",
                "message": str(e) if isinstance(e, ValueError) else f"Analysis failed: {str(e)}"
            })
    successful = sum(1 for item in results if item["status"] == "success")
    return {
        "total": len(results), "successful": successful,
        "failed": len(results) - successful, "results": results
    }


@router.post("/compare")
def compare_repositories(payload: CompareIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ids = list(dict.fromkeys(payload.repository_ids))
    if len(ids) < 2:
        raise HTTPException(400, "Select at least two different repositories to compare.")
    if len(ids) > 5:
        raise HTTPException(400, "You can compare up to five repositories at a time.")

    saved_ids = {
        row.repository_id for row in db.query(SavedRepository).filter(
            SavedRepository.user_id == user.id,
            SavedRepository.repository_id.in_(ids)
        ).all()
    }
    if saved_ids != set(ids):
        raise HTTPException(403, "You can compare only repositories saved to your account.")

    comparisons = []
    for repo_id in ids:
        repo = db.query(Repository).filter(Repository.id == repo_id).first()
        latest = db.query(AnalysisHistory).filter_by(
            user_id=user.id, repository_id=repo_id
        ).order_by(desc(AnalysisHistory.analyzed_at), desc(AnalysisHistory.id)).first()
        if not repo or not latest:
            comparisons.append({
                "repository_id": repo_id,
                "repository": f"{repo.owner}/{repo.repo_name}" if repo else "Unknown repository",
                "github_url": repo.github_url if repo else "",
                "has_analysis": False,
                "message": "Analyze this repository before comparing it."
            })
            continue
        metrics = json.loads(latest.metrics_json) if latest.metrics_json else {}
        scores = metrics.get("scores", {})
        comparisons.append({
            "repository_id": repo.id,
            "repository": f"{repo.owner}/{repo.repo_name}",
            "github_url": repo.github_url,
            "description": repo.description,
            "language": repo.language,
            "stars": repo.stars,
            "forks": repo.forks,
            "open_issues": repo.open_issues,
            "last_pushed_at": repo.last_pushed_at,
            "maturity_score": latest.maturity_score,
            "maturity_level": latest.maturity_level,
            "analyzed_at": latest.analyzed_at.isoformat(),
            "contributors_sampled": metrics.get("contributors_sampled", 0),
            "commits_sampled": metrics.get("commits_sampled", 0),
            "releases_sampled": metrics.get("releases_sampled", 0),
            "closed_issues_sampled": metrics.get("closed_issues_sampled", 0),
            "issues_sampled": metrics.get("issues_sampled", 0),
            "top_contributor_share": metrics.get("top_contributor_share", 0),
            "scores": scores,
            "has_analysis": True
        })
    return {"repositories": comparisons, "count": len(comparisons)}


@router.post("/save/{repository_id}")
def save_repository(repository_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        raise HTTPException(404, "Repository not found.")
    exists = db.query(SavedRepository).filter_by(user_id=user.id, repository_id=repository_id).first()
    if not exists:
        db.add(SavedRepository(user_id=user.id, repository_id=repository_id))
        db.commit()
    return {"message": "Repository saved."}


@router.get("/saved")
def saved_repositories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(SavedRepository).filter_by(user_id=user.id).all()
    output = []
    for row in rows:
        repo = row.repository
        latest = db.query(AnalysisHistory).filter_by(
            user_id=user.id, repository_id=repo.id
        ).order_by(desc(AnalysisHistory.analyzed_at), desc(AnalysisHistory.id)).first()
        output.append({
            "id": repo.id, "owner": repo.owner, "repo_name": repo.repo_name,
            "github_url": repo.github_url, "stars": repo.stars,
            "language": repo.language,
            "maturity_score": latest.maturity_score if latest else None,
            "maturity_level": latest.maturity_level if latest else None
        })
    return output
