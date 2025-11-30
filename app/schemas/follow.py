from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.user import UserResponse


class FollowResponse(BaseModel):
    """Takip yanıt şeması"""
    id: int
    follower_id: int
    followed_id: int
    created_at: datetime
    follower: Optional[UserResponse] = None
    followed: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

