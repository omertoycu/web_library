from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.content import Content
from app.models.library import UserLibrary, LibraryStatus
from app.models.activity import Activity, ActivityType
from app.schemas.library import LibraryItemCreate, LibraryItemResponse
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/library", tags=["Library"])


@router.post("/", response_model=LibraryItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_library(
    library_item: LibraryItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kütüphaneye içerik ekle"""
    
    # İçeriği kontrol et
    content = db.query(Content).filter(Content.id == library_item.content_id).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İçerik bulunamadı"
        )
    
    # Daha önce eklenmiş mi?
    existing_item = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.content_id == library_item.content_id
    ).first()
    
    if existing_item:
        # Varsa durumu güncelle
        existing_item.status = library_item.status
        db.commit()
        db.refresh(existing_item)
        # Content'i yükle
        db.refresh(existing_item, ['content'])
        return LibraryItemResponse.model_validate(existing_item)
    
    # Yeni ekle
    new_item = UserLibrary(
        user_id=current_user.id,
        content_id=library_item.content_id,
        status=library_item.status
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    # Content'i yükle
    db.refresh(new_item, ['content'])
    
    # Aktivite oluştur
    activity = Activity(
        user_id=current_user.id,
        activity_type=ActivityType.LIBRARY_ADD,
        content_id=library_item.content_id,
        extra_data=f'{{"status": "{library_item.status.value}"}}'
    )
    db.add(activity)
    db.commit()
    
    return LibraryItemResponse.model_validate(new_item)


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_library(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kütüphaneden içerik çıkar"""
    
    library_item = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.content_id == content_id
    ).first()
    
    if not library_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu içerik kütüphanenizde bulunamadı"
        )
    
    db.delete(library_item)
    db.commit()
    
    return None


@router.get("/me", response_model=List[LibraryItemResponse])
def get_my_library(
    status: Optional[LibraryStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kendi kütüphanemi getir"""
    
    query = db.query(UserLibrary)\
        .options(joinedload(UserLibrary.content))\
        .filter(UserLibrary.user_id == current_user.id)
    
    if status:
        query = query.filter(UserLibrary.status == status)
    
    library_items = query.order_by(UserLibrary.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [LibraryItemResponse.model_validate(item) for item in library_items]


@router.get("/user/{user_id}", response_model=List[LibraryItemResponse])
def get_user_library(
    user_id: int,
    status: Optional[LibraryStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Kullanıcının kütüphanesini getir"""
    
    query = db.query(UserLibrary)\
        .options(joinedload(UserLibrary.content))\
        .filter(UserLibrary.user_id == user_id)
    
    if status:
        query = query.filter(UserLibrary.status == status)
    
    library_items = query.order_by(UserLibrary.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [LibraryItemResponse.model_validate(item) for item in library_items]


@router.get("/me/content/{content_id}", response_model=LibraryItemResponse)
def check_content_in_library(
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Bir içeriğin kütüphanede olup olmadığını kontrol et"""
    
    library_item = db.query(UserLibrary)\
        .options(joinedload(UserLibrary.content))\
        .filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.content_id == content_id
        ).first()
    
    if not library_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu içerik kütüphanenizde bulunamadı"
        )
    
    return LibraryItemResponse.model_validate(library_item)

