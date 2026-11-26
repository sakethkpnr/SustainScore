from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Float, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    settings = relationship("UserSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    analyses = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner: Mapped[str] = mapped_column(String(150), nullable=False)
    repo_name: Mapped[str] = mapped_column(String(150), nullable=False)
    github_url: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(100))
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    open_issues: Mapped[int] = mapped_column(Integer, default=0)
    last_pushed_at: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"), nullable=False)
    maturity_score: Mapped[float] = mapped_column(Float, nullable=False)
    maturity_level: Mapped[str] = mapped_column(String(40), nullable=False)
    contributor_score: Mapped[float] = mapped_column(Float, default=0)
    release_score: Mapped[float] = mapped_column(Float, default=0)
    commit_score: Mapped[float] = mapped_column(Float, default=0)
    issue_score: Mapped[float] = mapped_column(Float, default=0)
    maintainer_score: Mapped[float] = mapped_column(Float, default=0)
    metrics_json: Mapped[str | None] = mapped_column(Text)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="analyses")
    repository = relationship("Repository")

class SavedRepository(Base):
    __tablename__ = "saved_repositories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id"), nullable=False)
    saved_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    repository = relationship("Repository")
    __table_args__ = (UniqueConstraint("user_id", "repository_id"),)

class UserSetting(Base):
    __tablename__ = "user_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    contributor_weight: Mapped[float] = mapped_column(Float, default=25)
    release_weight: Mapped[float] = mapped_column(Float, default=25)
    commit_weight: Mapped[float] = mapped_column(Float, default=20)
    issue_weight: Mapped[float] = mapped_column(Float, default=15)
    maintainer_weight: Mapped[float] = mapped_column(Float, default=15)
    user = relationship("User", back_populates="settings")
