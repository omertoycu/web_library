from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class CustomList(Base):
    """Özel liste modeli"""
    __tablename__ = "custom_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Liste bilgileri
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True)
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # İlişkiler
    user = relationship("User", back_populates="custom_lists")
    items = relationship("CustomListItem", back_populates="custom_list", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CustomList(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class CustomListItem(Base):
    """Özel liste içeriği modeli"""
    __tablename__ = "custom_list_items"
    
    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("custom_lists.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    
    # Sıralama için
    order = Column(Integer, default=0)
    
    # Zaman damgası
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # İlişkiler
    custom_list = relationship("CustomList", back_populates="items")
    content = relationship("Content", back_populates="list_items")
    
    def __repr__(self):
        return f"<CustomListItem(list_id={self.list_id}, content_id={self.content_id})>"

