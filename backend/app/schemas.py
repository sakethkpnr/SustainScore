from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional

class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class AnalyzeIn(BaseModel):
    github_url: str

class BulkAnalyzeIn(BaseModel):
    github_urls: list[str] = Field(min_length=1, max_length=10)

class CompareIn(BaseModel):
    repository_ids: list[int] = Field(min_length=2, max_length=5)

class WeightsIn(BaseModel):
    contributor_weight: float = Field(ge=0, le=100)
    release_weight: float = Field(ge=0, le=100)
    commit_weight: float = Field(ge=0, le=100)
    issue_weight: float = Field(ge=0, le=100)
    maintainer_weight: float = Field(ge=0, le=100)
