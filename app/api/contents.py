from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.content import Content, ContentType
from app.models.movie import Movie
from app.models.book import Book
from app.models.rating import Rating
from app.models.review import Review
from app.schemas.content import MovieResponse, BookResponse, ContentSearchResponse
from app.services.tmdb_service import tmdb_service
from app.services.books_service import google_books_service

router = APIRouter(prefix="/contents", tags=["Contents"])


@router.get("/movies/search", response_model=ContentSearchResponse)
async def search_movies(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    """Film ara (TMDb API)"""
    
    results = await tmdb_service.search_movies(query, page)
    total = results.get("total_results", 0)
    page_size = 20
    total_pages = results.get("total_pages", (total + page_size - 1) // page_size if total > 0 else 1)
    
    return ContentSearchResponse(
        results=results.get("results", []),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/movies/popular", response_model=ContentSearchResponse)
async def get_popular_movies(page: int = Query(1, ge=1)):
    """Popüler filmleri getir (TMDb API)"""
    
    results = await tmdb_service.get_popular_movies(page)
    total = results.get("total_results", 0)
    page_size = 20
    total_pages = results.get("total_pages", (total + page_size - 1) // page_size if total > 0 else 1)
    
    return ContentSearchResponse(
        results=results.get("results", []),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/movies/top-rated", response_model=ContentSearchResponse)
async def get_top_rated_movies(page: int = Query(1, ge=1)):
    """En yüksek puanlı filmleri getir (TMDb API)"""
    
    results = await tmdb_service.get_top_rated_movies(page)
    total = results.get("total_results", 0)
    page_size = 20
    total_pages = results.get("total_pages", (total + page_size - 1) // page_size if total > 0 else 1)
    
    return ContentSearchResponse(
        results=results.get("results", []),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/movies/tmdb/{tmdb_id}", response_model=MovieResponse)
async def get_movie_by_tmdb_id(tmdb_id: int, db: Session = Depends(get_db)):
    """TMDb ID ile film getir ve veritabanına kaydet"""
    
    # Önce veritabanında var mı kontrol et
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    
    if movie:
        return MovieResponse.model_validate(movie)
    
    # TMDb'den çek
    movie_data = await tmdb_service.get_movie_details(tmdb_id)
    
    if not movie_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Film bulunamadı"
        )
    
    # Veritabanına kaydet
    # Tarih parse et (güvenli)
    release_date = None
    if movie_data.get("release_date"):
        try:
            release_date = datetime.strptime(movie_data["release_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            release_date = None
    
    new_movie = Movie(
        title=movie_data.get("title"),
        original_title=movie_data.get("original_title"),
        description=movie_data.get("overview"),
        cover_image_url=movie_data.get("poster_url"),
        tmdb_id=tmdb_id,
        release_date=release_date,
        runtime=movie_data.get("runtime"),
        director=movie_data.get("director"),
        cast=movie_data.get("cast"),
        genres=movie_data.get("genres_text"),
        original_language=movie_data.get("original_language")
    )
    
    db.add(new_movie)
    db.commit()
    db.refresh(new_movie)
    
    return MovieResponse.model_validate(new_movie)


@router.get("/books/search", response_model=ContentSearchResponse)
async def search_books(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    """Kitap ara (Google Books API)"""
    
    results = await google_books_service.search_books(query, page)
    total = results.get("total_results", 0)
    page_size = 20
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    
    return ContentSearchResponse(
        results=results.get("results", []),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/books/google/{google_books_id}", response_model=BookResponse)
async def get_book_by_google_id(google_books_id: str, db: Session = Depends(get_db)):
    """Google Books ID ile kitap getir ve veritabanına kaydet"""
    
    # Önce veritabanında var mı kontrol et
    book = db.query(Book).filter(Book.google_books_id == google_books_id).first()
    
    if book:
        return BookResponse.model_validate(book)
    
    # Google Books'tan çek
    book_data = await google_books_service.get_book_details(google_books_id)
    
    if not book_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kitap bulunamadı"
        )
    
    # Veritabanına kaydet
    # Tarih parse et (güvenli)
    published_date = None
    if book_data.get("published_date"):
        try:
            date_str = book_data["published_date"][:10] if len(book_data["published_date"]) >= 10 else book_data["published_date"]
            published_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            published_date = None
    
    new_book = Book(
        title=book_data.get("title"),
        original_title=book_data.get("subtitle"),
        description=book_data.get("description"),
        cover_image_url=book_data.get("image_url"),
        google_books_id=google_books_id,
        authors=book_data.get("authors"),
        publisher=book_data.get("publisher"),
        published_date=published_date,
        page_count=book_data.get("page_count"),
        isbn_10=book_data.get("isbn_10"),
        isbn_13=book_data.get("isbn_13"),
        categories=book_data.get("categories"),
        language=book_data.get("language")
    )
    
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    
    return BookResponse.model_validate(new_book)


@router.get("/{content_id}", response_model=dict)
def get_content_details(content_id: int, db: Session = Depends(get_db)):
    """İçerik detaylarını getir"""
    
    content = db.query(Content).filter(Content.id == content_id).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İçerik bulunamadı"
        )
    
    # İstatistikleri hesapla
    stats = {
        "average_rating": content.average_rating,
        "total_ratings": content.total_ratings,
        "total_reviews": content.total_reviews
    }
    
    # İçerik tipine göre yanıt döndür
    if content.content_type == ContentType.MOVIE:
        movie = db.query(Movie).filter(Movie.id == content_id).first()
        return {
            "content": MovieResponse.model_validate(movie),
            "stats": stats
        }
    else:
        book = db.query(Book).filter(Book.id == content_id).first()
        return {
            "content": BookResponse.model_validate(book),
            "stats": stats
        }


@router.get("/", response_model=List[dict])
def get_all_contents(
    content_type: Optional[ContentType] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Tüm içerikleri listele"""
    
    query = db.query(Content)
    
    if content_type:
        query = query.filter(Content.content_type == content_type)
    
    contents = query.offset(skip).limit(limit).all()
    
    result = []
    for content in contents:
        if content.content_type == ContentType.MOVIE:
            movie = db.query(Movie).filter(Movie.id == content.id).first()
            result.append(MovieResponse.model_validate(movie))
        else:
            book = db.query(Book).filter(Book.id == content.id).first()
            result.append(BookResponse.model_validate(book))
    
    return result


@router.get("/discover/top-rated")
def get_platform_top_rated(
    content_type: Optional[ContentType] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Platform'daki en yüksek puanlı içerikler"""
    
    query = db.query(Content).filter(Content.total_ratings > 0)
    
    if content_type:
        query = query.filter(Content.content_type == content_type)
    
    contents = query.order_by(Content.average_rating.desc()).limit(limit).all()
    
    result = []
    for content in contents:
        if content.content_type == ContentType.MOVIE:
            movie = db.query(Movie).filter(Movie.id == content.id).first()
            result.append(MovieResponse.model_validate(movie))
        else:
            book = db.query(Book).filter(Book.id == content.id).first()
            result.append(BookResponse.model_validate(book))
    
    return result


@router.get("/discover/most-popular")
def get_platform_most_popular(
    content_type: Optional[ContentType] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Platform'daki en popüler içerikler (en çok yorum alan)"""
    
    query = db.query(Content).filter(Content.total_reviews > 0)
    
    if content_type:
        query = query.filter(Content.content_type == content_type)
    
    contents = query.order_by(Content.total_reviews.desc()).limit(limit).all()
    
    result = []
    for content in contents:
        if content.content_type == ContentType.MOVIE:
            movie = db.query(Movie).filter(Movie.id == content.id).first()
            result.append(MovieResponse.model_validate(movie))
        else:
            book = db.query(Book).filter(Book.id == content.id).first()
            result.append(BookResponse.model_validate(book))
    
    return result

