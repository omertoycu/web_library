from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class CustomListCreate(BaseModel):
    """Özel liste oluşturma şeması"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: bool = True


class CustomListUpdate(BaseModel):
    """Özel liste güncelleme şeması"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class CustomListItemCreate(BaseModel):
    """Özel liste öğesi ekleme şeması"""
    content_id: int


class CustomListItemResponse(BaseModel):
    """Özel liste öğesi yanıt şeması"""
    id: int
    content_id: int
    order: int
    added_at: datetime
    title: Optional[str] = None
    poster_url: Optional[str] = None
    content_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class CustomListResponse(BaseModel):
    """Özel liste yanıt şeması"""
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime
    items: Optional[List[CustomListItemResponse]] = []
    
    class Config:
        from_attributes = True

