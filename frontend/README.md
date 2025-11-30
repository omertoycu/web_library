# Web Library - Frontend

Modern, responsive ve kullanıcı dostu sosyal kütüphane platformu frontend uygulaması.

## 🚀 Özellikler

### 📱 Sayfalar

1. **Login/Register Sayfası**
   - Kullanıcı girişi
   - Yeni kullanıcı kaydı
   - Modern gradient tasarım

2. **Ana Sayfa (Social Feed)**
   - Global aktivite akışı
   - Kullanıcı aktivitelerini görüntüleme
   - Gerçek zamanlı güncelleme

3. **Keşfet Sayfası**
   - Film arama (TMDb API)
   - Kitap arama (Google Books API)
   - Popüler filmler
   - Kategori filtreleme

4. **İçerik Detay Modal**
   - Film/Kitap detaylı bilgileri
   - Puanlama sistemi (1-10)
   - Yorum yapma
   - Kütüphaneye ekleme (İzledim, İzlenecek, Okudum, Okunacak)

5. **Kütüphanem**
   - Kişisel içerik koleksiyonu
   - Durum filtreleme
   - Hızlı erişim

6. **Profil Sayfası**
   - Kullanıcı bilgileri
   - İstatistikler
   - Son aktiviteler

## 🎨 Tasarım Özellikleri

- ✅ Modern dark theme
- ✅ Gradient renkler
- ✅ Responsive tasarım (mobile-first)
- ✅ Smooth animasyonlar
- ✅ Toast bildirimleri
- ✅ Loading states
- ✅ Modal popups

## 🔧 Teknolojiler

- **HTML5** - Semantik yapı
- **CSS3** - Modern styling, flexbox, grid
- **Vanilla JavaScript** - API entegrasyonu, DOM manipülasyonu
- **LocalStorage** - Token ve kullanıcı bilgisi saklama
- **Fetch API** - Backend iletişimi

## 📦 Kurulum

### Gereksinimler

- Web browser (Chrome, Firefox, Safari, Edge)
- Backend API çalışır durumda olmalı (http://127.0.0.1:8000)

### Çalıştırma

1. **Basit HTTP Server (Python 3)**
   ```bash
   cd frontend
   python -m http.server 3000
   ```

2. **Live Server (VS Code Extension)**
   - Live Server extension'ı yükleyin
   - `index.html` üzerinde sağ tıklayın
   - "Open with Live Server" seçin

3. **Node.js HTTP Server**
   ```bash
   npx http-server -p 3000
   ```

4. **Doğrudan Tarayıcıda**
   - `index.html` dosyasını tarayıcıda açın
   - (Not: CORS nedeniyle bazı özellikler çalışmayabilir)

## 🌐 Kullanım

1. **Backend'i Başlatın**
   ```bash
   cd ..
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Frontend'i Açın**
   ```
   http://localhost:3000
   ```

3. **Kayıt Olun veya Giriş Yapın**
   - Yeni kullanıcı: Kayıt Ol
   - Mevcut kullanıcı: Giriş Yap

4. **Keşfetmeye Başlayın!**
   - Film/Kitap arayın
   - Puanlayın, yorum yapın
   - Kütüphanize ekleyin
   - Sosyal akışı takip edin

## 🎯 API Endpoints

Frontend şu backend endpoint'lerini kullanır:

### Authentication
- `POST /api/auth/register` - Kayıt
- `POST /api/auth/login` - Giriş

### Users
- `GET /api/users/me` - Profil bilgisi

### Contents
- `GET /api/contents/movies/search` - Film arama
- `GET /api/contents/books/search` - Kitap arama
- `GET /api/contents/movies/popular` - Popüler filmler
- `GET /api/contents/movies/tmdb/{id}` - Film detay
- `GET /api/contents/books/google/{id}` - Kitap detay

### Library
- `POST /api/library/` - Kütüphaneye ekle
- `GET /api/library/me` - Kütüphane listesi

### Ratings
- `POST /api/ratings/` - Puanlama yap

### Reviews
- `POST /api/reviews/` - Yorum yap

### Feed
- `GET /api/feed/global` - Global akış
- `GET /api/feed/me` - Kendi aktivitelerim

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🎨 Renk Paleti

```css
--primary-color: #6366f1  /* İndigo */
--secondary-color: #8b5cf6 /* Purple */
--success-color: #10b981  /* Green */
--danger-color: #ef4444   /* Red */
--warning-color: #f59e0b  /* Amber */
```

## 🔐 Güvenlik

- JWT token LocalStorage'da saklanır
- Her API isteğinde Authorization header eklenir
- Logout'ta token temizlenir
- XSS koruması için input sanitization

## 📝 Geliştirme Notları

### API Base URL Değiştirme

`app.js` dosyasındaki `API_BASE_URL` değişkenini düzenleyin:

```javascript
const API_BASE_URL = 'http://your-backend-url:8000/api';
```

### Toast Bildirimleri

```javascript
showToast('Mesaj', 'success');  // Başarılı
showToast('Mesaj', 'error');    // Hata
```

### Sayfa Değiştirme

```javascript
showPage('home');     // Ana sayfa
showPage('explore');  // Keşfet
showPage('library');  // Kütüphane
showPage('profile');  // Profil
```

## 🐛 Bilinen Sorunlar

- [ ] Infinite scroll henüz eklenmedi
- [ ] Profile edit fonksiyonu eksik
- [ ] Follow/Unfollow özelliği eksik
- [ ] Özel liste oluşturma eksik

## 🚧 Gelecek Özellikler

- [ ] Dark/Light theme switcher
- [ ] Gelişmiş filtreleme
- [ ] İçerik önerileri
- [ ] Kullanıcı araması
- [ ] Bildirim sistemi
- [ ] Profil fotoğrafı upload
- [ ] Favori içerikler
- [ ] İçerik paylaşımı

## 📄 Lisans

Bu proje eğitim amaçlıdır.

## 👤 İletişim

Sorularınız için issue açabilirsiniz.

---

**Hazırlayan:** Web Library Team  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 8 Kasım 2025

