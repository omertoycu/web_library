from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Rating(Base):
    """Puanlama modeli"""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    
    # Puan (1-10 arası)
    score = Column(Float, nullable=False)
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Bir kullanıcı bir içeriğe sadece bir kez puan verebilir
    __table_args__ = (
        UniqueConstraint('user_id', 'content_id', name='unique_user_content_rating'),
    )
    
    # İlişkiler
    user = relationship("User", back_populates="ratings")
    content = relationship("Content", back_populates="ratings")
    
    def __repr__(self):
        return f"<Rating(user_id={self.user_id}, content_id={self.content_id}, score={self.score})>"

