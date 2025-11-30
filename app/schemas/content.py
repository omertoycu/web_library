from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ContentBase(BaseModel):
    """İçerik base şeması"""
    id: int
    content_type: str
    title: str
    original_title: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    average_rating: float
    total_ratings: int
    total_reviews: int
    
    class Config:
        from_attributes = True


class MovieResponse(ContentBase):
    """Film yanıt şeması"""
    release_date: Optional[date] = None
    runtime: Optional[int] = None
    director: Optional[str] = None
    cast: Optional[str] = None
    genres: Optional[str] = None
    original_language: Optional[str] = None
    tmdb_id: Optional[int] = None


class BookResponse(ContentBase):
    """Kitap yanıt şeması"""
    authors: Optional[str] = None
    publisher: Optional[str] = None
    published_date: Optional[date] = None
    page_count: Optional[int] = None
    isbn_10: Optional[str] = None
    isbn_13: Optional[str] = None
    categories: Optional[str] = None
    language: Optional[str] = None
    google_books_id: Optional[str] = None


class ContentSearchResponse(BaseModel):
    """İçerik arama yanıt şeması"""
    results: list
    total: int
    page: int
    page_size: int
    total_pages: int

