from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api import auth, users, contents, ratings, reviews, library, custom_lists, feed, likes

# Veritabanı tablolarını oluştur
Base.metadata.create_all(bind=engine)

# FastAPI uygulaması
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Web Tabanlı Sosyal Kütüphane Platformu API
    
    Bu API, kullanıcıların kendi kişisel kitap ve film kütüphanelerini oluşturabildiği,
    içerikleri puanlayıp yorumlayabileceği ve sosyal akış üzerinden paylaşım yapabildiği
    bir platformun backend servisidir.
    
    ### Özellikler:
    
    * 🔐 **Authentication**: JWT tabanlı güvenli kimlik doğrulama
    * 👤 **Kullanıcı Yönetimi**: Profil, takip sistemi, şifre sıfırlama
    * 🎬 **Film Yönetimi**: TMDb API entegrasyonu ile zengin film veritabanı
    * 📚 **Kitap Yönetimi**: Google Books API entegrasyonu
    * ⭐ **Puanlama & Yorum**: İçerikleri puanlama ve yorumlama
    * 📖 **Kişisel Kütüphane**: İzledim, izlenecek, okudum, okunacak listeleri
    * 📝 **Özel Listeler**: Kullanıcı tanımlı koleksiyonlar
    * 🌐 **Sosyal Feed**: Takip edilen kullanıcıların aktiviteleri
    * 🔍 **Keşfet**: Popüler ve en yüksek puanlı içerikler
    
    ### Teknolojiler:
    
    * FastAPI
    * SQLAlchemy
    * MySQL
    * JWT Authentication
    * TMDb API
    * Google Books API
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Üretimde spesifik origin'ler belirtilmeli
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları dahil et
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(contents.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(library.router, prefix="/api")
app.include_router(custom_lists.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(likes.router, prefix="/api")


@app.get("/")
def root():
    """API Ana Sayfası"""
    return {
        "message": "Web Library Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Sağlık kontrolü"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

