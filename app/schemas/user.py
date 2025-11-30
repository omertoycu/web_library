from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Kullanıcı kayıt şeması"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    password_confirm: str


class UserLogin(BaseModel):
    """Kullanıcı giriş şeması"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Kullanıcı profil güncelleme şeması"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    """Kullanıcı yanıt şeması"""
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token yanıt şeması"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    """Şifre sıfırlama isteği şeması"""
    email: EmailStr


class PasswordReset(BaseModel):
    """Şifre sıfırlama şeması"""
    token: str
    new_password: str = Field(..., min_length=6)
    new_password_confirm: str

