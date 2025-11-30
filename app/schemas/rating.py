from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.schemas.user import UserResponse


class RatingCreate(BaseModel):
    """Puanlama oluşturma şeması"""
    content_id: int
    score: float = Field(..., ge=1.0, le=10.0)


class RatingUpdate(BaseModel):
    """Puanlama güncelleme şeması"""
    score: float = Field(..., ge=1.0, le=10.0)


class RatingResponse(BaseModel):
    """Puanlama yanıt şeması"""
    id: int
    user_id: int
    content_id: int
    score: float
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

