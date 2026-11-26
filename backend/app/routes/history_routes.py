import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnalysisHistory, User
from ..auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["Analysis history"])

@router.get("")
def history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(AnalysisHistory).filter_by(user_id=user.id).order_by(AnalysisHistory.analyzed_at.desc()).all()
    return [{
        "id": row.id, "repository": f"{row.repository.owner}/{row.repository.repo_name}",
        "github_url": row.repository.github_url, "maturity_score": row.maturity_score,
        "maturity_level": row.maturity_level, "analyzed_at": row.analyzed_at.isoformat(),
        "metrics": json.loads(row.metrics_json) if row.metrics_json else {}
    } for row in rows]

@router.get("/{analysis_id}")
def history_detail(analysis_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.query(AnalysisHistory).filter_by(id=analysis_id, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "Analysis not found.")
    return json.loads(row.metrics_json) if row.metrics_json else {}

@router.delete("/{analysis_id}")
def delete_history(analysis_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.query(AnalysisHistory).filter_by(id=analysis_id, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "Analysis not found.")
    db.delete(row)
    db.commit()
    return {"message": "History entry deleted."}
