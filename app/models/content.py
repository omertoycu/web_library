from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.database import Base


class ContentType(str, Enum):
    """İçerik türü enum"""
    MOVIE = "movie"
    BOOK = "book"


class Content(Base):
    """İçerik base modeli (Film ve Kitap için ortak)"""
    __tablename__ = "contents"
    
    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(SQLEnum(ContentType, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    
    # Temel bilgiler
    title = Column(String(255), nullable=False, index=True)
    original_title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    
    # Harici API ID'leri
    tmdb_id = Column(Integer, nullable=True, index=True)  # TMDb için
    google_books_id = Column(String(50), nullable=True, index=True)  # Google Books için
    
    # İstatistikler
    average_rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)
    
    # Zaman damgaları
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Polymorphic identity
    __mapper_args__ = {
        "polymorphic_identity": "content",
        "polymorphic_on": content_type,
        "with_polymorphic": "*"
    }
    
    # İlişkiler
    ratings = relationship("Rating", back_populates="content", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="content", cascade="all, delete-orphan")
    library_items = relationship("UserLibrary", back_populates="content", cascade="all, delete-orphan")
    list_items = relationship("CustomListItem", back_populates="content", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="content", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Content(id={self.id}, title='{self.title}', type='{self.content_type}')>"

