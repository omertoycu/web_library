from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.content import Content
from app.models.review import Review
from app.models.like import Like
from app.models.activity import Activity, ActivityType
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yeni yorum oluştur"""
    
    # İçeriği kontrol et
    content = db.query(Content).filter(Content.id == review_data.content_id).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İçerik bulunamadı"
        )
    
    # Yeni yorum oluştur
    new_review = Review(
        user_id=current_user.id,
        content_id=review_data.content_id,
        text=review_data.text
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    # İçeriğin yorum sayısını güncelle
    update_content_review_count(review_data.content_id, db)
    
    # Aktivite oluştur
    activity = Activity(
        user_id=current_user.id,
        activity_type=ActivityType.REVIEW,
        content_id=review_data.content_id,
        review_id=new_review.id
    )
    db.add(activity)
    db.commit()
    
    # Username ile birlikte döndür
    review_dict = {
        "id": new_review.id,
        "user_id": new_review.user_id,
        "content_id": new_review.content_id,
        "text": new_review.text,
        "likes_count": new_review.likes_count,
        "created_at": new_review.created_at,
        "updated_at": new_review.updated_at,
        "username": current_user.username
    }
    
    return review_dict


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yorumu güncelle"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Yorum bulunamadı"
        )
    
    # Yetki kontrolü
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu yorumu güncelleme yetkiniz yok"
        )
    
    review.text = review_update.text
    db.commit()
    db.refresh(review)
    
    # Username ile birlikte döndür
    review_dict = {
        "id": review.id,
        "user_id": review.user_id,
        "content_id": review.content_id,
        "text": review.text,
        "likes_count": review.likes_count,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        "username": current_user.username
    }
    
    return review_dict


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yorumu sil"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Yorum bulunamadı"
        )
    
    # Yetki kontrolü
    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu yorumu silme yetkiniz yok"
        )
    
    content_id = review.content_id
    db.delete(review)
    db.commit()
    
    # İçeriğin yorum sayısını güncelle
    update_content_review_count(content_id, db)
    
    return None


@router.get("/content/{content_id}", response_model=List[ReviewResponse])
def get_content_reviews(
    content_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """İçeriğin yorumlarını listele"""
    
    reviews = db.query(Review).filter(Review.content_id == content_id)\
        .order_by(Review.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    # Her yorum için kullanıcı adını ekle
    result = []
    for review in reviews:
        review_dict = {
            "id": review.id,
            "user_id": review.user_id,
            "content_id": review.content_id,
            "text": review.text,
            "likes_count": review.likes_count,
            "created_at": review.created_at,
            "updated_at": review.updated_at,
            "username": review.user.username if review.user else "Bilinmeyen"
        }
        result.append(review_dict)
    
    return result


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Kullanıcının yorumlarını listele"""
    
    reviews = db.query(Review).filter(Review.user_id == user_id)\
        .order_by(Review.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [ReviewResponse.model_validate(review) for review in reviews]


@router.post("/{review_id}/like", status_code=status.HTTP_201_CREATED)
def like_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yorumu beğen"""
    
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Yorum bulunamadı"
        )
    
    # Daha önce beğenilmiş mi?
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.review_id == review_id
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu yorumu zaten beğendiniz"
        )
    
    # Beğeni oluştur
    new_like = Like(
        user_id=current_user.id,
        review_id=review_id
    )
    
    db.add(new_like)
    
    # Beğeni sayısını artır
    review.likes_count += 1
    
    db.commit()
    
    return {"message": "Yorum beğenildi"}


@router.delete("/{review_id}/unlike", status_code=status.HTTP_200_OK)
def unlike_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yorumun beğenisini geri al"""
    
    like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.review_id == review_id
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu yorumu beğenmemişsiniz"
        )
    
    review = db.query(Review).filter(Review.id == review_id).first()
    
    db.delete(like)
    
    # Beğeni sayısını azalt
    if review and review.likes_count > 0:
        review.likes_count -= 1
    
    db.commit()
    
    return {"message": "Beğeni geri alındı"}


def update_content_review_count(content_id: int, db: Session):
    """İçeriğin yorum sayısını güncelle"""
    
    count = db.query(func.count(Review.id)).filter(Review.content_id == content_id).scalar()
    
    content = db.query(Content).filter(Content.id == content_id).first()
    
    if content:
        content.total_reviews = count
        db.commit()

