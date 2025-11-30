from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.activity import Activity
from app.models.follow import Follow
from app.models.review import Review
from app.models.rating import Rating
from app.models.like import Like
from app.models.custom_list import CustomList, CustomListItem
from app.schemas.activity import ActivityResponse
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/feed", tags=["Feed"])


def enrich_activity(activity: Activity, db: Session, current_user: User = None) -> dict:
    """Aktiviteyi review, rating ve likes detaylarıyla zenginleştir"""
    
    # Aktivitenin beğeni sayısını say
    likes_count = db.query(Like).filter(Like.activity_id == activity.id).count()
    
    # Kullanıcı bu aktiviteyi beğenmiş mi?
    is_liked = False
    if current_user:
        like = db.query(Like).filter(
            Like.activity_id == activity.id,
            Like.user_id == current_user.id
        ).first()
        is_liked = like is not None
    
    activity_dict = {
        "id": activity.id,
        "user_id": activity.user_id,
        "activity_type": activity.activity_type,
        "content_id": activity.content_id,
        "created_at": activity.created_at,
        "user": activity.user,
        "content": activity.content,
        "extra_data": activity.extra_data,
        "review_text": None,
        "review_likes_count": None,
        "rating_score": None,
        "likes_count": likes_count,  # Aktivite beğeni sayısı
        "is_liked_by_me": is_liked,  # Kullanıcı beğenmiş mi?
    }
    
    # Review detaylarını ekle
    if activity.review_id:
        review = db.query(Review).filter(Review.id == activity.review_id).first()
        if review:
            activity_dict["review_text"] = review.text
            activity_dict["review_likes_count"] = review.likes_count
    
    # Rating detaylarını ekle
    if activity.rating_id:
        rating = db.query(Rating).filter(Rating.id == activity.rating_id).first()
        if rating:
            activity_dict["rating_score"] = rating.score
    
    # Liste detaylarını ekle (list_create veya list_add için)
    if activity.list_id:
        # Önce relationship'ten kontrol et (daha hızlı)
        custom_list = activity.custom_list
        if not custom_list:
            # Fallback: Query ile çek
            custom_list = db.query(CustomList).filter(CustomList.id == activity.list_id).first()
        
        if custom_list:
            # Liste içerik sayısını hesapla
            if hasattr(custom_list, 'items') and custom_list.items:
                items_count = len(custom_list.items)
            else:
                items_count = db.query(CustomListItem).filter(CustomListItem.list_id == custom_list.id).count()
            
            activity_dict["list"] = {
                "id": custom_list.id,
                "name": custom_list.name,
                "description": custom_list.description,
                "is_public": custom_list.is_public,
                "items_count": items_count
            }
    
    return activity_dict


@router.get("/", response_model=List[ActivityResponse])
def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Sosyal akış - Takip edilen kullanıcıların aktiviteleri
    
    Bu endpoint, kullanıcının takip ettiği kişilerin son aktivitelerini
    en yeniden en eskiye doğru sıralayarak döndürür.
    """
    
    # Takip edilen kullanıcıların ID'lerini al
    followed_user_ids = db.query(Follow.followed_id)\
        .filter(Follow.follower_id == current_user.id)\
        .all()
    
    followed_ids = [f[0] for f in followed_user_ids]
    
    # Eğer kimseyi takip etmiyorsa, boş liste döndür
    if not followed_ids:
        return []
    
    # Takip edilen kullanıcıların aktivitelerini getir
    activities = db.query(Activity)\
        .options(
            joinedload(Activity.user),
            joinedload(Activity.content),
            joinedload(Activity.custom_list)
        )\
        .filter(Activity.user_id.in_(followed_ids))\
        .order_by(Activity.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    # Her aktiviteyi zenginleştir
    enriched_activities = [enrich_activity(activity, db, current_user) for activity in activities]
    
    return [ActivityResponse.model_validate(act) for act in enriched_activities]


@router.get("/global", response_model=List[ActivityResponse])
def get_global_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Global akış - Tüm kullanıcıların aktiviteleri
    
    Platform'daki tüm kullanıcıların son aktivitelerini döndürür.
    """
    
    activities = db.query(Activity)\
        .options(
            joinedload(Activity.user),
            joinedload(Activity.content),
            joinedload(Activity.custom_list)
        )\
        .order_by(Activity.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    # Her aktiviteyi zenginleştir
    enriched_activities = [enrich_activity(activity, db, current_user) for activity in activities]
    
    return [ActivityResponse.model_validate(act) for act in enriched_activities]


@router.get("/user/{user_id}", response_model=List[ActivityResponse])
def get_user_feed(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcı akışı - Belirli bir kullanıcının aktiviteleri
    
    Belirtilen kullanıcının son aktivitelerini döndürür.
    """
    
    activities = db.query(Activity)\
        .options(
            joinedload(Activity.user),
            joinedload(Activity.content),
            joinedload(Activity.custom_list)
        )\
        .filter(Activity.user_id == user_id)\
        .order_by(Activity.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    # Her aktiviteyi zenginleştir
    enriched_activities = [enrich_activity(activity, db, current_user) for activity in activities]
    
    return [ActivityResponse.model_validate(act) for act in enriched_activities]


@router.get("/me", response_model=List[ActivityResponse])
def get_my_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Kendi aktivitelerim - Mevcut kullanıcının aktiviteleri
    """
    
    activities = db.query(Activity)\
        .options(
            joinedload(Activity.user),
            joinedload(Activity.content),
            joinedload(Activity.custom_list)
        )\
        .filter(Activity.user_id == current_user.id)\
        .order_by(Activity.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    # Her aktiviteyi zenginleştir
    enriched_activities = [enrich_activity(activity, db, current_user) for activity in activities]
    
    return [ActivityResponse.model_validate(act) for act in enriched_activities]

