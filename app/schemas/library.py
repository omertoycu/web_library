from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.library import LibraryStatus


class LibraryItemCreate(BaseModel):
    """Kütüphane öğesi oluşturma şeması"""
    content_id: int
    status: LibraryStatus


class LibraryItemResponse(BaseModel):
    """Kütüphane öğesi yanıt şeması"""
    id: int
    user_id: int
    content_id: int
    status: str
    created_at: datetime
    content: Optional[Dict[str, Any]] = None
    
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
                'release_date': getattr(v, 'release_date', None),
                'published_date': getattr(v, 'published_date', None),
            }
        return v
    
    class Config:
        from_attributes = True

