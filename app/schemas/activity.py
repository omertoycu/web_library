from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Dict, Any
from app.schemas.user import UserResponse


class ActivityResponse(BaseModel):
    """Aktivite yanıt şeması"""
    id: int
    user_id: int
    activity_type: str
    content_id: Optional[int] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    content: Optional[Dict[str, Any]] = None
    extra_data: Optional[str] = None
    
    # Review ve rating detayları
    review_text: Optional[str] = None
    review_likes_count: Optional[int] = None
    rating_score: Optional[float] = None
    
    # Aktivite beğeni sayısı ve durumu
    likes_count: Optional[int] = 0
    is_liked_by_me: Optional[bool] = False
    
    # Liste bilgisi (list_create veya list_add için)
    list: Optional[Dict[str, Any]] = None
    
    @field_validator('content', mode='before')
    @classmethod
    def serialize_content(cls, v):
        if v is None:
            return None
        # SQLAlchemy nesnesini dict'e çevir
        if hasattr(v, '__dict__'):
            return {
                'id': getattr(v, 'id', None),
                'title': getattr(v, 'title', None),
                'content_type': getattr(v, 'content_type', None).value if hasattr(getattr(v, 'content_type', None), 'value') else str(getattr(v, 'content_type', None)),
                'cover_image_url': getattr(v, 'cover_image_url', None),
            }
        return v
    
    class Config:
        from_attributes = True

