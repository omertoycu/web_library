from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, PasswordResetRequest, PasswordReset
from app.core.security import verify_password, get_password_hash, create_access_token
from app.utils.email import send_password_reset_email, generate_reset_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yeni kullanıcı kaydı"""
    
    # Şifrelerin eşleşmesi kontrolü
    if user_data.password != user_data.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Şifreler eşleşmiyor"
        )
    
    # Email kontrolü
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanımda"
        )
    
    # Kullanıcı adı kontrolü
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kullanıcı adı zaten kullanımda"
        )
    
    # Yeni kullanıcı oluştur
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Token oluştur
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Kullanıcı girişi"""
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı"
        )
    
    password_correct = verify_password(user_data.password, user.hashed_password)
    
    if not password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hesabınız aktif değil"
        )
    
    # Token oluştur
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login/token", response_model=TokenResponse)
def login_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 uyumlu token login (Swagger UI için)"""
    
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/password-reset-request", status_code=status.HTTP_200_OK)
def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Şifre sıfırlama isteği"""
    
    user = db.query(User).filter(User.email == request.email).first()
    
    # Güvenlik için, kullanıcı bulunamasa bile başarılı mesajı döndür
    if not user:
        return {"message": "Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderildi"}
    
    # Reset token oluştur
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    db.commit()
    
    # Email gönder
    try:
        email_sent = send_password_reset_email(user.email, reset_token)
        if email_sent:
            print(f"[OK] Email basariyla gonderildi: {user.email}")
        else:
            print(f"[UYARI] Email gonderilemedi: {user.email}")
    except Exception as e:
        print(f"[HATA] Email gonderme hatasi: {e}")
    
    return {"message": "Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderildi"}


@router.post("/password-reset", status_code=status.HTTP_200_OK)
def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Şifre sıfırlama"""
    
    # Şifrelerin eşleşmesi kontrolü
    if reset_data.new_password != reset_data.new_password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Şifreler eşleşmiyor"
        )
    
    # Token'ı kontrol et
    user = db.query(User).filter(
        User.reset_token == reset_data.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz veya süresi dolmuş token"
        )
    
    # Şifreyi güncelle
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    
    return {"message": "Şifreniz başarıyla güncellendi"}

