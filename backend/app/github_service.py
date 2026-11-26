import os, re, requests
from datetime import datetime, timezone

GITHUB_API = "https://api.github.com"

def parse_github_url(url: str):
    """Accept owner/repo and common GitHub clone, web and API URL formats."""
    value = str(url or "").strip()
    value = re.sub(r"^(?:git\s+clone|gh\s+repo\s+clone)\s+", "", value, flags=re.I)
    value = re.split(r"[?#\s]", value, maxsplit=1)[0]
    match = re.match(r"^(?:ssh://)?git@github\.com[:/]([^/\s]+)/([^/\s]+)", value, re.I)
    if match:
        owner, repo = match.group(1), match.group(2)
    elif re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", value):
        owner, repo = value.split("/", 1)
    else:
        cleaned = re.sub(r"^[a-z][a-z0-9+.-]*://", "", value, flags=re.I)
        cleaned = re.sub(r"^www\.", "", cleaned, flags=re.I)
        parts = [part for part in cleaned.strip("/").split("/") if part]
        if not parts:
            raise ValueError("Enter owner/repo or a GitHub repository URL.")
        host = parts[0].lower()
        if host == "github.com":
            parts = parts[1:]
        elif host == "api.github.com" and len(parts) >= 2 and parts[1] == "repos":
            parts = parts[2:]
        else:
            raise ValueError("Enter a valid github.com repository URL.")
        if len(parts) < 2:
            raise ValueError("Enter a repository in owner/repo format.")
        owner, repo = parts[0], parts[1]
    repo = repo.removesuffix(".git")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", owner) or not re.fullmatch(r"[A-Za-z0-9._-]+", repo):
        raise ValueError("Invalid GitHub repository owner or name.")
    return owner, repo

def github_get(path: str):
    headers = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.get(f"{GITHUB_API}{path}", headers=headers, timeout=20)
    if response.status_code == 404:
        raise ValueError("Repository not found or not publicly accessible.")
    if response.status_code == 403:
        raise ValueError("GitHub API rate limit reached. Add a GitHub token to backend/.env.")
    response.raise_for_status()
    return response.json()

def analyze_repository(url: str, weights=None):
    owner, repo = parse_github_url(url)
    base = f"/repos/{owner}/{repo}"
    meta = github_get(base)
    contributors = github_get(base + "/contributors?per_page=100")
    releases = github_get(base + "/releases?per_page=20")
    commits = github_get(base + "/commits?per_page=100")
    issues = github_get(base + "/issues?state=all&per_page=100")

    contributor_count = len(contributors)
    contribution_values = [c.get("contributions", 0) for c in contributors]
    total_contributions = sum(contribution_values)
    top_share = (max(contribution_values) / total_contributions * 100) if total_contributions else 100
    # Transparent initial indicators; these are heuristic proxies, not validated labels.
    contributor_score = min(100, contributor_count * 5)
    maintainer_score = max(0, min(100, 100 - top_share))
    commit_score = min(100, len(commits))
    release_score = min(100, len(releases) * 10)
    closed = sum(1 for i in issues if i.get("pull_request") is None and i.get("state") == "closed")
    issue_total = sum(1 for i in issues if i.get("pull_request") is None)
    issue_score = (closed / issue_total * 100) if issue_total else 50

    configured = weights or {"contributor": 25, "release": 25, "commit": 20, "issue": 15, "maintainer": 15}
    total_weight = sum(float(v) for v in configured.values()) or 100
    normalized = {k: float(v) / total_weight for k, v in configured.items()}
    score = (
        contributor_score * normalized.get("contributor", 0)
        + release_score * normalized.get("release", 0)
        + commit_score * normalized.get("commit", 0)
        + issue_score * normalized.get("issue", 0)
        + maintainer_score * normalized.get("maintainer", 0)
    )
    level = "High" if score >= 80 else "Moderate" if score >= 60 else "Developing" if score >= 40 else "Low"

    # Detailed report data for CSV/PDF exports. These are sampled public GitHub API
    # records; missing optional endpoints do not prevent the core assessment.
    def optional_get(path):
        try:
            return github_get(path)
        except Exception:
            return []

    languages_raw = optional_get(base + "/languages")
    releases_raw = releases if isinstance(releases, list) else []
    contributors_detail = [
        {
            "login": c.get("login", "unknown"),
            "contributions": c.get("contributions", 0),
            "profile_url": c.get("html_url", ""),
            "avatar_url": c.get("avatar_url", "")
        }
        for c in contributors[:100]
    ]
    recent_authors_map = {}
    for commit in commits:
        author = commit.get("author") or {}
        login = author.get("login") or ((commit.get("commit") or {}).get("author") or {}).get("name") or "unknown"
        entry = recent_authors_map.setdefault(login, {"login": login, "commits": 0})
        entry["commits"] += 1
    recent_authors = sorted(recent_authors_map.values(), key=lambda x: x["commits"], reverse=True)
    release_details = [
        {
            "tag": r.get("tag_name", ""),
            "name": r.get("name") or r.get("tag_name", ""),
            "published_at": r.get("published_at") or r.get("created_at"),
            "prerelease": bool(r.get("prerelease", False)),
            "url": r.get("html_url", "")
        }
        for r in releases_raw[:100]
    ]
    language_details = [
        {"language": name, "bytes": size}
        for name, size in sorted((languages_raw or {}).items(), key=lambda item: item[1], reverse=True)
    ] if isinstance(languages_raw, dict) else []

    return {
        "owner": owner, "repo_name": repo, "github_url": meta["html_url"],
        "description": meta.get("description"), "language": meta.get("language"),
        "stars": meta.get("stargazers_count", 0), "forks": meta.get("forks_count", 0),
        "open_issues": meta.get("open_issues_count", 0), "last_pushed_at": meta.get("pushed_at"),
        "default_branch": meta.get("default_branch"), "created_at": meta.get("created_at"),
        "watchers": meta.get("subscribers_count", meta.get("watchers_count", 0)),
        "size_kb": meta.get("size", 0), "homepage": meta.get("homepage") or "",
        "topics": meta.get("topics", []), "archived": bool(meta.get("archived", False)),
        "is_fork": bool(meta.get("fork", False)),
        "license_name": (meta.get("license") or {}).get("spdx_id") or ((meta.get("license") or {}).get("name") or ""),
        "contributors_count": contributor_count, "contributors_sampled": len(contributors),
        "top_contributor_share": round(top_share, 2), "commits_sampled": len(commits),
        "releases_sampled": len(releases), "closed_issues_sampled": closed,
        "issues_sampled": issue_total, "scores": {
            "contributor_score": round(contributor_score, 2),
            "release_score": round(release_score, 2),
            "commit_score": round(commit_score, 2),
            "issue_score": round(issue_score, 2),
            "maintainer_score": round(maintainer_score, 2),
        },
        "maturity_score": round(score, 2), "maturity_level": level,
        "contributors": contributors_detail,
        "recent_authors": recent_authors,
        "releases": release_details,
        "languages": language_details,
        "scoring_note": "Prototype heuristic based on sampled public GitHub API data and your configured indicator weights; not yet scientifically validated.",
        "weights_used": {k: round(float(v), 2) for k, v in configured.items()}
    }
