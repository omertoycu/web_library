from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models.user import User
from app.models.activity import Activity
from app.models.like import Like
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/likes", tags=["Likes"])


@router.post("/activities/{activity_id}", status_code=status.HTTP_201_CREATED)
def like_activity(
    activity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Aktiviteyi beğen"""
    
    # Aktivite var mı kontrol et
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aktivite bulunamadı"
        )
    
    # Daha önce beğenmiş mi?
    existing_like = db.query(Like).filter(
        and_(
            Like.user_id == current_user.id,
            Like.activity_id == activity_id
        )
    ).first()
    
    if existing_like:
        return {"message": "Zaten beğenilmiş", "liked": True}
    
    # Beğeni oluştur
    new_like = Like(
        user_id=current_user.id,
        activity_id=activity_id
    )
    
    db.add(new_like)
    db.commit()
    
    # Beğeni sayısını say
    likes_count = db.query(Like).filter(Like.activity_id == activity_id).count()
    
    return {
        "message": "Beğenildi",
        "liked": True,
        "likes_count": likes_count
    }


@router.delete("/activities/{activity_id}", status_code=status.HTTP_200_OK)
def unlike_activity(
    activity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Aktivite beğenisini kaldır"""
    
    # Beğeni var mı?
    like = db.query(Like).filter(
        and_(
            Like.user_id == current_user.id,
            Like.activity_id == activity_id
        )
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beğeni bulunamadı"
        )
    
    db.delete(like)
    db.commit()
    
    # Beğeni sayısını say
    likes_count = db.query(Like).filter(Like.activity_id == activity_id).count()
    
    return {
        "message": "Beğeni kaldırıldı",
        "liked": False,
        "likes_count": likes_count
    }


@router.get("/activities/{activity_id}/count")
def get_activity_likes_count(
    activity_id: int,
    db: Session = Depends(get_db)
):
    """Aktivitenin beğeni sayısını getir"""
    
    likes_count = db.query(Like).filter(Like.activity_id == activity_id).count()
    
    return {
        "activity_id": activity_id,
        "likes_count": likes_count
    }


@router.get("/activities/{activity_id}/status")
def check_if_liked(
    activity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcı bu aktiviteyi beğenmiş mi?"""
    
    like = db.query(Like).filter(
        and_(
            Like.user_id == current_user.id,
            Like.activity_id == activity_id
        )
    ).first()
    
    likes_count = db.query(Like).filter(Like.activity_id == activity_id).count()
    
    return {
        "activity_id": activity_id,
        "liked": like is not None,
        "likes_count": likes_count
    }


@router.get("/activities/{activity_id}/users")
def get_activity_likers(
    activity_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Aktiviteyi beğenen kullanıcıları getir"""
    
    # Likes ile User'ları join et
    likes = db.query(Like, User)\
        .join(User, Like.user_id == User.id)\
        .filter(Like.activity_id == activity_id)\
        .order_by(Like.created_at.desc())\
        .limit(limit)\
        .all()
    
    users = []
    for like, user in likes:
        users.append({
            "id": user.id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "liked_at": like.created_at
        })
    
    return {
        "activity_id": activity_id,
        "total_count": len(users),
        "users": users
    }

