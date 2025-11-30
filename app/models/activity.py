from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class ActivityType(str, Enum):
    """Aktivite türü enum"""
    RATING = "rating"  # Puanlama
    REVIEW = "review"  # Yorum
    LIBRARY_ADD = "library_add"  # Kütüphaneye ekleme
    LIST_CREATE = "list_create"  # Liste oluşturma
    LIST_ADD = "list_add"  # Listeye ekleme


class Activity(Base):
    """Aktivite modeli (Sosyal feed için)"""
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(SQLEnum(ActivityType, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    
    # İlişkili içerik (varsa)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=True)
    
    # İlişkili kayıt ID'leri (detaylar için)
    rating_id = Column(Integer, ForeignKey("ratings.id", ondelete="CASCADE"), nullable=True)
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True)
    list_id = Column(Integer, ForeignKey("custom_lists.id", ondelete="CASCADE"), nullable=True)
    
    # Ek bilgi (JSON formatında ekstra veri saklanabilir)
    extra_data = Column(String(1000), nullable=True)
    
    # Zaman damgası
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # İlişkiler
    user = relationship("User", back_populates="activities")
    content = relationship("Content", back_populates="activities")
    custom_list = relationship("CustomList", foreign_keys=[list_id])
    
    def __repr__(self):
        return f"<Activity(id={self.id}, user_id={self.user_id}, type='{self.activity_type}')>"

