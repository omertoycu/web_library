from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.content import Content
from app.models.rating import Rating
from app.models.activity import Activity, ActivityType
from app.schemas.rating import RatingCreate, RatingUpdate, RatingResponse
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def create_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yeni puanlama oluştur"""
    
    # İçeriği kontrol et
    content = db.query(Content).filter(Content.id == rating_data.content_id).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İçerik bulunamadı"
        )
    
    # Daha önce puanlama yapılmış mı?
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.content_id == rating_data.content_id
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu içeriği zaten puanladınız. Güncellemek için PUT isteği kullanın."
        )
    
    # Yeni puanlama oluştur
    new_rating = Rating(
        user_id=current_user.id,
        content_id=rating_data.content_id,
        score=rating_data.score
    )
    
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    
    # İçeriğin ortalama puanını güncelle
    update_content_rating_stats(rating_data.content_id, db)
    
    # Aktivite oluştur
    activity = Activity(
        user_id=current_user.id,
        activity_type=ActivityType.RATING,
        content_id=rating_data.content_id,
        rating_id=new_rating.id
    )
    db.add(activity)
    db.commit()
    
    return RatingResponse.model_validate(new_rating)


@router.put("/{rating_id}", response_model=RatingResponse)
def update_rating(
    rating_id: int,
    rating_update: RatingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Puanlamayı güncelle"""
    
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puanlama bulunamadı"
        )
    
    # Yetki kontrolü
    if rating.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu puanlamayı güncelleme yetkiniz yok"
        )
    
    rating.score = rating_update.score
    db.commit()
    db.refresh(rating)
    
    # İçeriğin ortalama puanını güncelle
    update_content_rating_stats(rating.content_id, db)
    
    return RatingResponse.model_validate(rating)


@router.delete("/{rating_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Puanlamayı sil"""
    
    rating = db.query(Rating).filter(Rating.id == rating_id).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Puanlama bulunamadı"
        )
    
    # Yetki kontrolü
    if rating.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu puanlamayı silme yetkiniz yok"
        )
    
    content_id = rating.content_id
    db.delete(rating)
    db.commit()
    
    # İçeriğin ortalama puanını güncelle
    update_content_rating_stats(content_id, db)
    
    return None


@router.get("/content/{content_id}", response_model=List[RatingResponse])
def get_content_ratings(
    content_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """İçeriğin puanlamalarını listele"""
    
    ratings = db.query(Rating).filter(Rating.content_id == content_id)\
        .order_by(Rating.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [RatingResponse.model_validate(rating) for rating in ratings]


@router.get("/user/{user_id}", response_model=List[RatingResponse])
def get_user_ratings(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Kullanıcının puanlamalarını listele"""
    
    ratings = db.query(Rating).filter(Rating.user_id == user_id)\
        .order_by(Rating.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [RatingResponse.model_validate(rating) for rating in ratings]


@router.get("/me/content/{content_id}", response_model=RatingResponse)
def get_my_rating_for_content(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Belirli bir içerik için kullanıcının puanlamasını getir"""
    
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.content_id == content_id
    ).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu içerik için henüz puanlama yapmadınız"
        )
    
    return RatingResponse.model_validate(rating)


def update_content_rating_stats(content_id: int, db: Session):
    """İçeriğin puanlama istatistiklerini güncelle"""
    
    stats = db.query(
        func.avg(Rating.score).label('avg_score'),
        func.count(Rating.id).label('total_ratings')
    ).filter(Rating.content_id == content_id).first()
    
    content = db.query(Content).filter(Content.id == content_id).first()
    
    if content:
        content.average_rating = round(stats.avg_score, 2) if stats.avg_score else 0.0
        content.total_ratings = stats.total_ratings
        db.commit()

