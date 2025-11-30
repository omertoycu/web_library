from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.follow import Follow
from app.models.rating import Rating
from app.models.review import Review
from app.schemas.user import UserResponse, UserUpdate
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Mevcut kullanıcının profilini getir"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mevcut kullanıcının profilini güncelle"""
    
    # Kullanıcı adı değişiyorsa, benzersizlik kontrolü yap
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu kullanıcı adı zaten kullanımda"
            )
        current_user.username = user_update.username
    
    # Diğer alanları güncelle
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.get("/{username}", response_model=dict)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    """Belirli bir kullanıcının profilini getir"""
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # İstatistikleri hesapla
    stats = {
        "total_ratings": db.query(func.count(Rating.id)).filter(Rating.user_id == user.id).scalar(),
        "total_reviews": db.query(func.count(Review.id)).filter(Review.user_id == user.id).scalar(),
        "followers_count": db.query(func.count(Follow.id)).filter(Follow.followed_id == user.id).scalar(),
        "following_count": db.query(func.count(Follow.id)).filter(Follow.follower_id == user.id).scalar(),
    }
    
    return {
        "user": UserResponse.model_validate(user),
        "stats": stats
    }


@router.get("/{username}/followers", response_model=List[UserResponse])
def get_user_followers(username: str, db: Session = Depends(get_db)):
    """Kullanıcının takipçilerini listele"""
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    followers = db.query(User).join(Follow, Follow.follower_id == User.id)\
        .filter(Follow.followed_id == user.id).all()
    
    return [UserResponse.model_validate(follower) for follower in followers]


@router.get("/{username}/following", response_model=List[UserResponse])
def get_user_following(username: str, db: Session = Depends(get_db)):
    """Kullanıcının takip ettiklerini listele"""
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    following = db.query(User).join(Follow, Follow.followed_id == User.id)\
        .filter(Follow.follower_id == user.id).all()
    
    return [UserResponse.model_validate(followed) for followed in following]


@router.post("/{username}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(
    username: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcıyı takip et"""
    
    user_to_follow = db.query(User).filter(User.username == username).first()
    
    if not user_to_follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Kendini takip edemez
    if user_to_follow.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendinizi takip edemezsiniz"
        )
    
    # Zaten takip ediliyor mu?
    existing_follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_to_follow.id
    ).first()
    
    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcıyı zaten takip ediyorsunuz"
        )
    
    # Takip ilişkisi oluştur
    new_follow = Follow(
        follower_id=current_user.id,
        followed_id=user_to_follow.id
    )
    
    db.add(new_follow)
    db.commit()
    
    return {"message": f"{username} takip edildi"}


@router.delete("/{username}/unfollow", status_code=status.HTTP_200_OK)
def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcıyı takipten çık"""
    
    user_to_unfollow = db.query(User).filter(User.username == username).first()
    
    if not user_to_unfollow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Takip ilişkisini bul
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_to_unfollow.id
    ).first()
    
    if not follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcıyı takip etmiyorsunuz"
        )
    
    db.delete(follow)
    db.commit()
    
    return {"message": f"{username} takipten çıkarıldı"}

