from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.schemas.user import UserResponse


class ReviewCreate(BaseModel):
    """Yorum oluşturma şeması"""
    content_id: int
    text: str = Field(..., min_length=1, max_length=5000)


class ReviewUpdate(BaseModel):
    """Yorum güncelleme şeması"""
    text: str = Field(..., min_length=1, max_length=5000)


class ReviewResponse(BaseModel):
    """Yorum yanıt şeması"""
    id: int
    user_id: int
    content_id: int
    text: str
    likes_count: int
    created_at: datetime
    updated_at: datetime
    username: Optional[str] = None
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

