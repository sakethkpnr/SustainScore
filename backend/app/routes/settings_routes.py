from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserSetting
from ..schemas import WeightsIn
from ..auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/weights")
def get_weights(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    settings = db.query(UserSetting).filter_by(user_id=user.id).first()
    if not settings:
        settings = UserSetting(user_id=user.id)
        db.add(settings); db.commit(); db.refresh(settings)
    return {k: getattr(settings, k) for k in [
        "contributor_weight", "release_weight", "commit_weight", "issue_weight", "maintainer_weight"
    ]}

@router.put("/weights")
def update_weights(payload: WeightsIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    values = payload.model_dump()
    if round(sum(values.values()), 2) != 100:
        raise HTTPException(400, "Scoring weights must add up to exactly 100%.")
    settings = db.query(UserSetting).filter_by(user_id=user.id).first()
    if not settings:
        settings = UserSetting(user_id=user.id); db.add(settings)
    for key, value in values.items():
        setattr(settings, key, value)
    db.commit()
    return {"message": "Scoring weights saved.", **values}
