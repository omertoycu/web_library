from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Like(Base):
    """Beğeni modeli (Yorumlar ve Aktiviteler için)"""
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # İsteğe bağlı: Ya review ya da activity beğenilir
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=True)
    
    # Zaman damgası
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Bir kullanıcı bir review veya activity'yi sadece bir kez beğenebilir
    __table_args__ = (
        UniqueConstraint('user_id', 'review_id', name='unique_user_review_like'),
        UniqueConstraint('user_id', 'activity_id', name='unique_user_activity_like'),
    )
    
    # İlişkiler
    user = relationship("User", back_populates="likes")
    review = relationship("Review", back_populates="likes")
    
    def __repr__(self):
        return f"<Like(user_id={self.user_id}, review_id={self.review_id}, activity_id={self.activity_id})>"

