from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class LibraryStatus(str, Enum):
    """Kütüphane durumu enum"""
    # Film için
    WATCHED = "watched"  # İzledim
    TO_WATCH = "to_watch"  # İzlenecek
    
    # Kitap için
    READ = "read"  # Okudum
    TO_READ = "to_read"  # Okunacak


class UserLibrary(Base):
    """Kullanıcı kütüphanesi modeli"""
    __tablename__ = "user_libraries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    
    # Durum
    status = Column(SQLEnum(LibraryStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Bir kullanıcı bir içeriği kütüphanesinde sadece bir durumda tutabilir
    __table_args__ = (
        UniqueConstraint('user_id', 'content_id', name='unique_user_content_library'),
    )
    
    # İlişkiler
    user = relationship("User", back_populates="library_items")
    content = relationship("Content", back_populates="library_items")
    
    def __repr__(self):
        return f"<UserLibrary(user_id={self.user_id}, content_id={self.content_id}, status='{self.status}')>"

