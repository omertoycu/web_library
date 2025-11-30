from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Review(Base):
    """Yorum modeli"""
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    
    # Yorum metni
    text = Column(Text, nullable=False)
    
    # İstatistikler
    likes_count = Column(Integer, default=0)
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User", back_populates="reviews")
    content = relationship("Content", back_populates="reviews")
    likes = relationship("Like", back_populates="review", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Review(id={self.id}, user_id={self.user_id}, content_id={self.content_id})>"

