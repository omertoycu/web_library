-- ================================================
-- ÖRNEK VERİ EKLEME (TEST İÇİN)
-- ================================================

USE web_library;

-- ================================================
-- 1. ÖRNEK KULLANICILAR
-- ================================================
-- Not: Şifreler bcrypt ile hashlenmiş olmalı
-- Örnek şifre: "test123456"
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS4HWBe4u

INSERT INTO users (username, email, hashed_password, bio, is_active) VALUES
('ahmet_yilmaz', 'ahmet@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS4HWBe4u', 'Film ve kitap tutkunu', TRUE),
('ayse_demir', 'ayse@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS4HWBe4u', 'Bilim kurgu hayranı', TRUE),
('mehmet_kaya', 'mehmet@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS4HWBe4u', 'Sinema ve edebiyat severim', TRUE);

-- ================================================
-- 2. ÖRNEK İÇERİKLER - FİLMLER
-- ================================================
INSERT INTO contents (content_type, title, original_title, description, cover_image_url, tmdb_id, average_rating, total_ratings) VALUES
('movie', 'The Shawshank Redemption', 'The Shawshank Redemption', 'İki hapis mahkumu yıllar içinde bağ kurar, teselli ve nihai kurtuluş bulur.', 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 278, 9.3, 2),
('movie', 'The Dark Knight', 'The Dark Knight', 'Batman, Joker adlı bir suçluyu durdurmak için en büyük psikolojik ve fiziksel testlerden birini kabul etmelidir.', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 155, 9.0, 1),
('movie', 'Inception', 'Inception', 'Bir hırsız, kurumsal sırları çalmak için rüya paylaşım teknolojisini kullanan bir uzmandır.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 27205, 8.8, 1);

-- Film detaylarını ekle
INSERT INTO movies (id, release_date, runtime, director, cast, genres, original_language) VALUES
(1, '1994-09-23', 142, 'Frank Darabont', 'Tim Robbins, Morgan Freeman, Bob Gunton', 'Dram, Suç', 'en'),
(2, '2008-07-18', 152, 'Christopher Nolan', 'Christian Bale, Heath Ledger, Aaron Eckhart', 'Aksiyon, Suç, Dram', 'en'),
(3, '2010-07-16', 148, 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page', 'Aksiyon, Bilim Kurgu, Macera', 'en');

-- ================================================
-- 3. ÖRNEK İÇERİKLER - KİTAPLAR
-- ================================================
INSERT INTO contents (content_type, title, description, cover_image_url, google_books_id, average_rating, total_ratings) VALUES
('book', '1984', 'George Orwell\'in distopik başyapıtı. Totaliter bir rejimin kontrolündeki toplumu anlatır.', 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1', 'kotPYEqx7kMC', 9.1, 1),
('book', 'Suç ve Ceza', 'Dostoyevski\'nin ahlak, suç ve ceza üzerine derin bir eseri.', 'https://books.google.com/books/content?id=example1&printsec=frontcover&img=1&zoom=1', 'example1', 8.9, 1);

-- Kitap detaylarını ekle
INSERT INTO books (id, authors, publisher, published_date, page_count, categories, language) VALUES
(4, 'George Orwell', 'Secker & Warburg', '1949-06-08', 328, 'Bilim Kurgu, Distopya', 'tr'),
(5, 'Fyodor Dostoyevski', 'İş Bankası Kültür Yayınları', '1866-01-01', 671, 'Klasik, Roman', 'tr');

-- ================================================
-- 4. ÖRNEK PUANLAMALAR
-- ================================================
INSERT INTO ratings (user_id, content_id, score) VALUES
(1, 1, 9.5),  -- Ahmet, Shawshank Redemption'a 9.5
(1, 2, 9.0),  -- Ahmet, Dark Knight'a 9.0
(2, 1, 9.0),  -- Ayşe, Shawshank Redemption'a 9.0
(2, 4, 9.0),  -- Ayşe, 1984'e 9.0
(3, 3, 8.8),  -- Mehmet, Inception'a 8.8
(3, 5, 9.0);  -- Mehmet, Suç ve Ceza'ya 9.0

-- ================================================
-- 5. ÖRNEK YORUMLAR
-- ================================================
INSERT INTO reviews (user_id, content_id, text, likes_count) VALUES
(1, 1, 'Tüm zamanların en iyi filmi! Muhteşem bir hikaye ve etkileyici oyunculuklar. Herkesin izlemesi gereken bir başyapıt.', 2),
(2, 4, 'George Orwell\'in vizyonunun bugün bile ne kadar geçerli olduğu inanılmaz. Okumadan geçmeyin!', 1),
(3, 3, 'Christopher Nolan\'ın en iyi filmlerinden biri. Akıl almaz bir senaryo ve görsel efektler.', 1);

-- ================================================
-- 6. ÖRNEK KÜTÜPHANE KAYITLARI
-- ================================================
INSERT INTO user_libraries (user_id, content_id, status) VALUES
(1, 1, 'watched'),      -- Ahmet, Shawshank'i izledi
(1, 2, 'watched'),      -- Ahmet, Dark Knight'ı izledi
(1, 3, 'to_watch'),     -- Ahmet, Inception'ı izleyecek
(2, 1, 'watched'),      -- Ayşe, Shawshank'i izledi
(2, 4, 'read'),         -- Ayşe, 1984'ü okudu
(2, 5, 'to_read'),      -- Ayşe, Suç ve Ceza'yı okuyacak
(3, 3, 'watched'),      -- Mehmet, Inception'ı izledi
(3, 5, 'read');         -- Mehmet, Suç ve Ceza'yı okudu

-- ================================================
-- 7. ÖRNEK TAKİP İLİŞKİLERİ
-- ================================================
INSERT INTO follows (follower_id, followed_id) VALUES
(1, 2),  -- Ahmet, Ayşe'yi takip ediyor
(1, 3),  -- Ahmet, Mehmet'i takip ediyor
(2, 1),  -- Ayşe, Ahmet'i takip ediyor
(2, 3),  -- Ayşe, Mehmet'i takip ediyor
(3, 1);  -- Mehmet, Ahmet'i takip ediyor

-- ================================================
-- 8. ÖRNEK ÖZEL LİSTELER
-- ================================================
INSERT INTO custom_lists (user_id, name, description, is_public) VALUES
(1, 'En Sevdiğim Filmler', 'Favori filmlerim', TRUE),
(2, 'Okuduğum Klasikler', 'Bitirdiğim klasik kitaplar', TRUE),
(3, 'Christopher Nolan Filmleri', 'Nolan\'ın en iyi işleri', TRUE);

-- Liste öğelerini ekle
INSERT INTO custom_list_items (list_id, content_id, `order`) VALUES
(1, 1, 0),  -- Ahmet'in listesinde Shawshank
(1, 2, 1),  -- Ahmet'in listesinde Dark Knight
(2, 4, 0),  -- Ayşe'nin listesinde 1984
(2, 5, 1),  -- Ayşe'nin listesinde Suç ve Ceza
(3, 2, 0),  -- Mehmet'in listesinde Dark Knight
(3, 3, 1);  -- Mehmet'in listesinde Inception

-- ================================================
-- 9. ÖRNEK AKTİVİTELER
-- ================================================
INSERT INTO activities (user_id, activity_type, content_id, rating_id, review_id) VALUES
(1, 'rating', 1, 1, NULL),
(1, 'review', 1, NULL, 1),
(2, 'rating', 4, 4, NULL),
(2, 'review', 4, NULL, 2),
(3, 'rating', 3, 5, NULL),
(3, 'review', 3, NULL, 3);

-- ================================================
-- 10. ÖRNEK BEĞENİLER
-- ================================================
INSERT INTO likes (user_id, review_id) VALUES
(2, 1),  -- Ayşe, Ahmet'in yorumunu beğendi
(3, 1),  -- Mehmet, Ahmet'in yorumunu beğendi
(1, 2),  -- Ahmet, Ayşe'nin yorumunu beğendi
(2, 3);  -- Ayşe, Mehmet'in yorumunu beğendi

-- ================================================
-- VERİLERİ KONTROL ET
-- ================================================

SELECT '=== KULLANICILAR ===' AS '';
SELECT id, username, email, bio FROM users;

SELECT '=== İÇERİKLER ===' AS '';
SELECT id, content_type, title, average_rating, total_ratings FROM contents;

SELECT '=== PUANLAMALAR ===' AS '';
SELECT r.id, u.username, c.title, r.score 
FROM ratings r
JOIN users u ON r.user_id = u.id
JOIN contents c ON r.content_id = c.id;

SELECT '=== YORUMLAR ===' AS '';
SELECT r.id, u.username, c.title, LEFT(r.text, 50) AS preview, r.likes_count
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN contents c ON r.content_id = c.id;

SELECT '=== KÜTÜPHANE ===' AS '';
SELECT ul.id, u.username, c.title, ul.status
FROM user_libraries ul
JOIN users u ON ul.user_id = u.id
JOIN contents c ON ul.content_id = c.id;

SELECT '=== TAKİP İLİŞKİLERİ ===' AS '';
SELECT f.id, u1.username AS follower, u2.username AS followed
FROM follows f
JOIN users u1 ON f.follower_id = u1.id
JOIN users u2 ON f.followed_id = u2.id;

SELECT '=== TAMAMLANDI! ===' AS '';

