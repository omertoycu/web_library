from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.content import Content
from app.models.custom_list import CustomList, CustomListItem
from app.models.activity import Activity, ActivityType
from app.schemas.custom_list import CustomListCreate, CustomListUpdate, CustomListResponse, CustomListItemCreate
from app.core.deps import get_current_active_user

router = APIRouter(prefix="/lists", tags=["Custom Lists"])


@router.post("/", response_model=CustomListResponse, status_code=status.HTTP_201_CREATED)
def create_custom_list(
    list_data: CustomListCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Yeni özel liste oluştur"""
    
    new_list = CustomList(
        user_id=current_user.id,
        name=list_data.name,
        description=list_data.description,
        is_public=list_data.is_public
    )
    
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    
    # Aktivite oluştur
    activity = Activity(
        user_id=current_user.id,
        activity_type=ActivityType.LIST_CREATE,
        list_id=new_list.id
    )
    db.add(activity)
    db.commit()
    
    return CustomListResponse.model_validate(new_list)


@router.put("/{list_id}", response_model=CustomListResponse)
def update_custom_list(
    list_id: int,
    list_update: CustomListUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Özel listeyi güncelle"""
    
    custom_list = db.query(CustomList).filter(CustomList.id == list_id).first()
    
    if not custom_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liste bulunamadı"
        )
    
    # Yetki kontrolü
    if custom_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu listeyi güncelleme yetkiniz yok"
        )
    
    # Alanları güncelle
    if list_update.name is not None:
        custom_list.name = list_update.name
    if list_update.description is not None:
        custom_list.description = list_update.description
    if list_update.is_public is not None:
        custom_list.is_public = list_update.is_public
    
    db.commit()
    db.refresh(custom_list)
    
    return CustomListResponse.model_validate(custom_list)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_list(
    list_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Özel listeyi sil"""
    
    custom_list = db.query(CustomList).filter(CustomList.id == list_id).first()
    
    if not custom_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liste bulunamadı"
        )
    
    # Yetki kontrolü
    if custom_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu listeyi silme yetkiniz yok"
        )
    
    # İlgili aktiviteleri de sil
    db.query(Activity).filter(
        Activity.activity_type.in_([ActivityType.LIST_CREATE, ActivityType.LIST_ADD]),
        Activity.list_id == list_id
    ).delete(synchronize_session=False)
    
    db.delete(custom_list)
    db.commit()
    
    return None


@router.get("/me", response_model=List[CustomListResponse])
def get_my_lists(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kendi listelerimi getir"""
    
    lists = db.query(CustomList).filter(CustomList.user_id == current_user.id)\
        .order_by(CustomList.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [CustomListResponse.model_validate(custom_list) for custom_list in lists]


@router.get("/user/{user_id}", response_model=List[CustomListResponse])
def get_user_lists(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Kullanıcının listelerini getir (sadece public olanlar)"""
    
    lists = db.query(CustomList).filter(
        CustomList.user_id == user_id,
        CustomList.is_public == True
    ).order_by(CustomList.created_at.desc())\
        .offset(skip).limit(limit).all()
    
    return [CustomListResponse.model_validate(custom_list) for custom_list in lists]


@router.get("/{list_id}", response_model=CustomListResponse)
def get_list_details(list_id: int, db: Session = Depends(get_db)):
    """Liste detaylarını getir"""
    
    custom_list = db.query(CustomList).filter(CustomList.id == list_id).first()
    
    if not custom_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liste bulunamadı"
        )
    
    # Liste yanıtını oluştur
    list_dict = {
        "id": custom_list.id,
        "user_id": custom_list.user_id,
        "name": custom_list.name,
        "description": custom_list.description,
        "is_public": custom_list.is_public,
        "created_at": custom_list.created_at,
        "items": []
    }
    
    # Her item için içerik detaylarını ekle
    for item in custom_list.items:
        content = db.query(Content).filter(Content.id == item.content_id).first()
        if content:
            item_dict = {
                "id": item.id,
                "content_id": item.content_id,
                "order": item.order,
                "added_at": item.added_at,
                "title": content.title,
                "poster_url": content.cover_image_url,  # Doğru alan adı
                "content_type": content.content_type.value
            }
            list_dict["items"].append(item_dict)
    
    return list_dict


@router.post("/{list_id}/items", status_code=status.HTTP_201_CREATED)
def add_item_to_list(
    list_id: int,
    item_data: CustomListItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Listeye içerik ekle"""
    
    custom_list = db.query(CustomList).filter(CustomList.id == list_id).first()
    
    if not custom_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liste bulunamadı"
        )
    
    # Yetki kontrolü
    if custom_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu listeye ekleme yetkiniz yok"
        )
    
    # İçeriği kontrol et
    content = db.query(Content).filter(Content.id == item_data.content_id).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İçerik bulunamadı"
        )
    
    # Zaten listede mi?
    existing_item = db.query(CustomListItem).filter(
        CustomListItem.list_id == list_id,
        CustomListItem.content_id == item_data.content_id
    ).first()
    
    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu içerik zaten listede"
        )
    
    # Sıralama için son order değerini al
    last_order = db.query(CustomListItem).filter(
        CustomListItem.list_id == list_id
    ).count()
    
    new_item = CustomListItem(
        list_id=list_id,
        content_id=item_data.content_id,
        order=last_order
    )
    
    db.add(new_item)
    db.commit()
    
    # Aktivite oluştur
    activity = Activity(
        user_id=current_user.id,
        activity_type=ActivityType.LIST_ADD,
        content_id=item_data.content_id,
        list_id=list_id
    )
    db.add(activity)
    db.commit()
    
    return {"message": "İçerik listeye eklendi"}


@router.delete("/{list_id}/items/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item_from_list(
    list_id: int,
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Listeden içerik çıkar"""
    
    custom_list = db.query(CustomList).filter(CustomList.id == list_id).first()
    
    if not custom_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Liste bulunamadı"
        )
    
    # Yetki kontrolü
    if custom_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu listeden çıkarma yetkiniz yok"
        )
    
    list_item = db.query(CustomListItem).filter(
        CustomListItem.list_id == list_id,
        CustomListItem.content_id == content_id
    ).first()
    
    if not list_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İçerik listede bulunamadı"
        )
    
    db.delete(list_item)
    db.commit()
    
    return None

