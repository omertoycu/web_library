# 📚 Web Tabanlı Sosyal Kütüphane Platformu

Modern, kullanıcı dostu ve sosyal özelliklerle donatılmış bir kütüphane platformu. Kullanıcılar kendi film ve kitap koleksiyonlarını oluşturabilir, içerikleri puanlayıp yorumlayabilir ve takip ettikleri kullanıcıların aktivitelerini görebilirler.


https://github.com/user-attachments/assets/7063814a-2489-4040-8c2c-6d90b4496587


## 🎯 Özellikler

### 👤 Kullanıcı Yönetimi
- Kayıt ve giriş sistemi (JWT tabanlı)
- Profil yönetimi (avatar, biyografi)
- Şifre sıfırlama
- Kullanıcı takip sistemi

### 🎬 Film Yönetimi
- TMDb API entegrasyonu
- Gelişmiş film arama
- Film detayları (yönetmen, oyuncular, türler)
- Popüler ve en yüksek puanlı filmler

### 📚 Kitap Yönetimi
- Google Books API entegrasyonu
- Kitap arama
- Kitap detayları (yazar, yayıncı, sayfa sayısı)
- ISBN ile arama

### ⭐ Puanlama & Yorum
- İçerikleri 1-10 arası puanlama
- Detaylı yorum yazma
- Yorumları beğenme
- Platform geneli ortalama puanlar

### 📖 Kişisel Kütüphane
- İzledim / İzlenecek listeleri
- Okudum / Okunacak listeleri
- Durum değiştirme
- Kütüphane istatistikleri

### 📝 Özel Listeler
- Kullanıcı tanımlı koleksiyonlar
- Liste paylaşımı (public/private)
- Listeye içerik ekleme/çıkarma
- Sıralama desteği

### 🌐 Sosyal Feed
- Takip edilen kullanıcıların aktiviteleri
- Puanlama aktiviteleri
- Yorum aktiviteleri
- Kütüphane aktiviteleri
- Liste aktiviteleri
- Infinite scroll desteği

## 🛠️ Teknolojiler

- **Backend Framework**: FastAPI 0.104
- **ORM**: SQLAlchemy 2.0
- **Veritabanı**: MySQL
- **Authentication**: JWT (python-jose)
- **Password Hashing**: Bcrypt
- **Harici API'ler**: TMDb API, Google Books API
- **Async HTTP Client**: httpx

## 📋 Gereksinimler

- Python 3.9+
- MySQL 8.0+
- TMDb API Key
- (Opsiyonel) Google Books API Key

## 🚀 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd web_library
```

### 2. Virtual Environment Oluşturun

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Bağımlılıkları Yükleyin

```bash
pip install -r requirements.txt
```

### 4. MySQL Veritabanı Oluşturun

```sql
CREATE DATABASE web_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Çevre Değişkenlerini Ayarlayın

`.env` dosyası oluşturun (`.env.example` dosyasını referans alabilirsiniz):

```env
# Veritabanı
DATABASE_URL=mysql+pymysql://kullanici_adi:sifre@localhost:3306/web_library
DB_HOST=localhost
DB_PORT=3306
DB_USER=kullanici_adi
DB_PASSWORD=sifre
DB_NAME=web_library

# JWT
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys
TMDB_API_KEY=your-tmdb-api-key-here
GOOGLE_BOOKS_API_KEY=your-google-books-api-key-here

# Email (Opsiyonel - Şifre sıfırlama için)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@weblibrary.com

# Uygulama
APP_NAME=Web Library Platform
DEBUG=True
```

### 6. TMDb API Key Alın

1. [TMDb](https://www.themoviedb.org/) sitesine kaydolun
2. [API Settings](https://www.themoviedb.org/settings/api) sayfasından API key alın
3. `.env` dosyasına ekleyin

### 7. Veritabanı Tablolarını Oluşturun

```bash
python create_db.py
```

### 8. Uygulamayı Başlatın

```bash
# Geliştirme modu (auto-reload)
python app/main.py

# veya
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Uygulama `http://localhost:8000` adresinde çalışacaktır.

## 📚 API Dokümantasyonu

Uygulama başlatıldıktan sonra:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔗 API Endpoint'leri

### Authentication
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/password-reset-request` - Şifre sıfırlama isteği
- `POST /api/auth/password-reset` - Şifre sıfırlama

### Kullanıcılar
- `GET /api/users/me` - Mevcut kullanıcı profili
- `PUT /api/users/me` - Profil güncelleme
- `GET /api/users/{username}` - Kullanıcı profili
- `POST /api/users/{username}/follow` - Kullanıcı takip et
- `DELETE /api/users/{username}/unfollow` - Takipten çık
- `GET /api/users/{username}/followers` - Takipçiler
- `GET /api/users/{username}/following` - Takip edilenler

### İçerik (Film & Kitap)
- `GET /api/contents/movies/search` - Film ara
- `GET /api/contents/movies/popular` - Popüler filmler
- `GET /api/contents/movies/top-rated` - En yüksek puanlı filmler
- `GET /api/contents/movies/tmdb/{tmdb_id}` - TMDb ID ile film getir
- `GET /api/contents/books/search` - Kitap ara
- `GET /api/contents/books/google/{google_books_id}` - Google Books ID ile kitap getir
- `GET /api/contents/{content_id}` - İçerik detayları
- `GET /api/contents/discover/top-rated` - Platform'daki en yüksek puanlılar
- `GET /api/contents/discover/most-popular` - Platform'daki en popülerler

### Puanlama
- `POST /api/ratings/` - Puanlama oluştur
- `PUT /api/ratings/{rating_id}` - Puanlama güncelle
- `DELETE /api/ratings/{rating_id}` - Puanlama sil
- `GET /api/ratings/content/{content_id}` - İçeriğin puanlamaları
- `GET /api/ratings/user/{user_id}` - Kullanıcının puanlamaları
- `GET /api/ratings/me/content/{content_id}` - Benim puanlamam

### Yorumlar
- `POST /api/reviews/` - Yorum oluştur
- `PUT /api/reviews/{review_id}` - Yorum güncelle
- `DELETE /api/reviews/{review_id}` - Yorum sil
- `GET /api/reviews/content/{content_id}` - İçeriğin yorumları
- `GET /api/reviews/user/{user_id}` - Kullanıcının yorumları
- `POST /api/reviews/{review_id}/like` - Yorumu beğen
- `DELETE /api/reviews/{review_id}/unlike` - Beğeniyi geri al

### Kütüphane
- `POST /api/library/` - Kütüphaneye ekle
- `DELETE /api/library/{content_id}` - Kütüphaneden çıkar
- `GET /api/library/me` - Kendi kütüphanem
- `GET /api/library/user/{user_id}` - Kullanıcının kütüphanesi
- `GET /api/library/me/content/{content_id}` - İçerik durumu kontrolü

### Özel Listeler
- `POST /api/lists/` - Liste oluştur
- `PUT /api/lists/{list_id}` - Liste güncelle
- `DELETE /api/lists/{list_id}` - Liste sil
- `GET /api/lists/me` - Kendi listelerim
- `GET /api/lists/user/{user_id}` - Kullanıcının listeleri
- `GET /api/lists/{list_id}` - Liste detayları
- `POST /api/lists/{list_id}/items` - Listeye içerik ekle
- `DELETE /api/lists/{list_id}/items/{content_id}` - Listeden içerik çıkar

### Feed (Sosyal Akış)
- `GET /api/feed/` - Takip edilen kullanıcıların aktiviteleri
- `GET /api/feed/global` - Global akış (tüm aktiviteler)
- `GET /api/feed/user/{user_id}` - Kullanıcının aktiviteleri
- `GET /api/feed/me` - Kendi aktivitelerim

## 🗄️ Veritabanı Şeması

### Temel Tablolar
- `users` - Kullanıcılar
- `contents` - İçerikler (base tablo)
- `movies` - Filmler
- `books` - Kitaplar
- `ratings` - Puanlamalar
- `reviews` - Yorumlar
- `user_libraries` - Kullanıcı kütüphaneleri
- `custom_lists` - Özel listeler
- `custom_list_items` - Liste öğeleri
- `follows` - Takip ilişkileri
- `activities` - Aktiviteler
- `likes` - Beğeniler

## 🔒 Güvenlik

- JWT tabanlı authentication
- Bcrypt ile şifre hashleme
- CORS koruması
- SQL injection koruması (SQLAlchemy ORM)
- Rate limiting (üretim ortamı için önerilir)

## 🧪 Test

```bash
# Test dosyaları oluşturulduktan sonra
pytest
```

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 👥 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

## 🙏 Teşekkürler

- [TMDb](https://www.themoviedb.org/) - Film veritabanı API'si
- [Google Books](https://books.google.com/) - Kitap veritabanı API'si
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python ORM

---

**Not**: Bu proje bir Web Tabanlı Sosyal Kütüphane Platformu proje ödevi kapsamında geliştirilmiştir.

