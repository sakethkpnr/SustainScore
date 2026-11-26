from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserSetting
from ..schemas import RegisterIn, LoginIn, TokenOut, UserOut
from ..auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists.")
    user = User(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()
    db.add(UserSetting(user_id=user.id))
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user.id), "user": user}

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password.")
    return {"access_token": create_access_token(user.id), "user": user}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
