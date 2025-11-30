-- ================================================
-- WEB TABANLII SOSYAL KÜTÜPHANE PLATFORMU
-- Veritabanı Şeması - MySQL
-- ================================================

-- Veritabanını oluştur (eğer yoksa)
CREATE DATABASE IF NOT EXISTS web_library 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE web_library;

-- ================================================
-- 1. USERS TABLOSU (Kullanıcılar)
-- ================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    
    -- Profil bilgileri
    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    
    -- Hesap durumu
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Şifre sıfırlama
    reset_token VARCHAR(100) NULL,
    reset_token_expires DATETIME NULL,
    
    -- Zaman damgaları
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- İndeksler
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 2. CONTENTS TABLOSU (İçerikler - Base)
-- ================================================
CREATE TABLE contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type ENUM('movie', 'book') NOT NULL,
    
    -- Temel bilgiler
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NULL,
    description TEXT NULL,
    cover_image_url VARCHAR(500) NULL,
    
    -- Harici API ID'leri
    tmdb_id INT NULL,
    google_books_id VARCHAR(50) NULL,
    
    -- İstatistikler
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    
    -- Zaman damgaları
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- İndeksler
    INDEX idx_content_type (content_type),
    INDEX idx_title (title),
    INDEX idx_tmdb_id (tmdb_id),
    INDEX idx_google_books_id (google_books_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 3. MOVIES TABLOSU (Filmler)
-- ================================================
CREATE TABLE movies (
    id INT PRIMARY KEY,
    
    -- Film özel alanları
    release_date DATE NULL,
    runtime INT NULL COMMENT 'Dakika cinsinden',
    director VARCHAR(255) NULL,
    cast VARCHAR(1000) NULL COMMENT 'Virgülle ayrılmış oyuncu isimleri',
    genres VARCHAR(500) NULL COMMENT 'Virgülle ayrılmış türler',
    original_language VARCHAR(10) NULL,
    imdb_id VARCHAR(20) NULL,
    
    -- Foreign Key
    FOREIGN KEY (id) REFERENCES contents(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_release_date (release_date),
    INDEX idx_genres (genres(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 4. BOOKS TABLOSU (Kitaplar)
-- ================================================
CREATE TABLE books (
    id INT PRIMARY KEY,
    
    -- Kitap özel alanları
    authors VARCHAR(500) NULL COMMENT 'Virgülle ayrılmış yazar isimleri',
    publisher VARCHAR(255) NULL,
    published_date DATE NULL,
    page_count INT NULL,
    isbn_10 VARCHAR(13) NULL,
    isbn_13 VARCHAR(17) NULL,
    categories VARCHAR(500) NULL COMMENT 'Virgülle ayrılmış kategoriler',
    language VARCHAR(10) NULL,
    
    -- Foreign Key
    FOREIGN KEY (id) REFERENCES contents(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_authors (authors(100)),
    INDEX idx_published_date (published_date),
    INDEX idx_isbn_10 (isbn_10),
    INDEX idx_isbn_13 (isbn_13)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5. RATINGS TABLOSU (Puanlamalar)
-- ================================================
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    
    -- Puan (1-10 arası)
    score DECIMAL(3, 1) NOT NULL CHECK (score >= 1.0 AND score <= 10.0),
    
    -- Zaman damgaları
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    
    -- Bir kullanıcı bir içeriğe sadece bir kez puan verebilir
    UNIQUE KEY unique_user_content_rating (user_id, content_id),
    
    -- İndeksler
    INDEX idx_user_id (user_id),
    INDEX idx_content_id (content_id),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 6. REVIEWS TABLOSU (Yorumlar)
-- ================================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    
    -- Yorum metni
    text TEXT NOT NULL,
    
    -- İstatistikler
    likes_count INT DEFAULT 0,
    
    -- Zaman damgaları
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_user_id (user_id),
    INDEX idx_content_id (content_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 7. USER_LIBRARIES TABLOSU (Kullanıcı Kütüphaneleri)
-- ================================================
CREATE TABLE user_libraries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    
    -- Durum
    status ENUM('watched', 'to_watch', 'read', 'to_read') NOT NULL,
    
    -- Zaman damgaları
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    
    -- Bir kullanıcı bir içeriği kütüphanesinde sadece bir durumda tutabilir
    UNIQUE KEY unique_user_content_library (user_id, content_id),
    
    -- İndeksler
    INDEX idx_user_id (user_id),
    INDEX idx_content_id (content_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 8. CUSTOM_LISTS TABLOSU (Özel Listeler)
-- ================================================
CREATE TABLE custom_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Liste bilgileri
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Zaman damgaları
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_user_id (user_id),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 9. CUSTOM_LIST_ITEMS TABLOSU (Özel Liste Öğeleri)
-- ================================================
CREATE TABLE custom_list_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    list_id INT NOT NULL,
    content_id INT NOT NULL,
    
    -- Sıralama için
    `order` INT DEFAULT 0,
    
    -- Zaman damgası
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_list_id (list_id),
    INDEX idx_content_id (content_id),
    INDEX idx_order (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 10. FOLLOWS TABLOSU (Takip İlişkileri)
-- ================================================
CREATE TABLE follows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL COMMENT 'Takip eden kullanıcı',
    followed_id INT NOT NULL COMMENT 'Takip edilen kullanıcı',
    
    -- Zaman damgası
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Bir kullanıcı başka bir kullanıcıyı sadece bir kez takip edebilir
    UNIQUE KEY unique_follow (follower_id, followed_id),
    
    -- İndeksler
    INDEX idx_follower_id (follower_id),
    INDEX idx_followed_id (followed_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 11. ACTIVITIES TABLOSU (Aktiviteler - Sosyal Feed)
-- ================================================
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type ENUM('rating', 'review', 'library_add', 'list_create', 'list_add') NOT NULL,
    
    -- İlişkili içerik (varsa)
    content_id INT NULL,
    
    -- İlişkili kayıt ID'leri (detaylar için)
    rating_id INT NULL,
    review_id INT NULL,
    list_id INT NULL,
    
    -- Ek bilgi (JSON formatında ekstra veri saklanabilir)
    extra_data VARCHAR(1000) NULL,
    
    -- Zaman damgası
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
    
    -- İndeksler
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    INDEX idx_content_id (content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 12. LIKES TABLOSU (Beğeniler - Yorumlar için)
-- ================================================
CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    review_id INT NOT NULL,
    
    -- Zaman damgası
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    
    -- Bir kullanıcı bir yorumu sadece bir kez beğenebilir
    UNIQUE KEY unique_user_review_like (user_id, review_id),
    
    -- İndeksler
    INDEX idx_user_id (user_id),
    INDEX idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


