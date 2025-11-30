// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';
let currentUser = null;
let authToken = null;

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(element) {
    element.innerHTML = '<div class="loading">Yükleniyor...</div>';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
}

// Daha detaylı zaman formatı (Feed için)
function getDetailedTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    if (weeks < 4) return `${weeks} hafta önce`;
    if (months < 12) return `${months} ay önce`;
    return `${years} yıl önce`;
}

// API Functions
async function apiCall(endpoint, method = 'GET', body = null, useAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (useAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // 401 Unauthorized - Token geçersiz veya süresi dolmuş
        if (response.status === 401) {
            console.error('Kimlik doğrulanamadı - Token geçersiz');
            // Token'ı temizle ve login sayfasına yönlendir
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            showToast('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'error');
            setTimeout(() => showPage('auth'), 2000);
            throw new Error('Kimlik doğrulanamadı');
        }
        
        // 204 No Content durumunda JSON parse etme
        if (response.status === 204) {
            return null;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Bir hata oluştu');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth Functions
async function register(username, email, password, passwordConfirm) {
    // Şifre validasyonu
    if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
    }
    
    if (password !== passwordConfirm) {
        throw new Error('Şifreler eşleşmiyor');
    }
    
    const data = await apiCall('/auth/register', 'POST', {
        username,
        email,
        password,
        password_confirm: passwordConfirm
    }, false);
    
    authToken = data.access_token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return data;
}

async function login(email, password) {
    // Basic validasyon
    if (!email || !password) {
        throw new Error('E-posta ve şifre gereklidir');
    }
    
    if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
    }
    
    const data = await apiCall('/auth/login', 'POST', {
        email,
        password
    }, false);
    
    authToken = data.access_token;
    currentUser = data.user;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    return data;
}

async function forgotPassword(email) {
    if (!email) {
        throw new Error('E-posta adresi gereklidir');
    }
    
    const data = await apiCall('/auth/password-reset-request', 'POST', {
        email
    }, false);
    
    return data;
}

async function resetPassword(token, newPassword, newPasswordConfirm) {
    if (!token) {
        throw new Error('Şifre sıfırlama token\'ı geçersiz');
    }
    
    if (newPassword.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
    }
    
    if (newPassword !== newPasswordConfirm) {
        throw new Error('Şifreler eşleşmiyor');
    }
    
    const data = await apiCall('/auth/password-reset', 'POST', {
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
    }, false);
    
    return data;
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showPage('auth');
}

async function loadProfile() {
    const data = await apiCall('/users/me');
    currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    return data;
}

// Content Functions
async function searchMovies(query, page = 1) {
    return await apiCall(`/contents/movies/search?query=${encodeURIComponent(query)}&page=${page}`, 'GET', null, false);
}

async function searchBooks(query, page = 1) {
    return await apiCall(`/contents/books/search?query=${encodeURIComponent(query)}&page=${page}`, 'GET', null, false);
}

async function getPopularMovies(page = 1) {
    return await apiCall(`/contents/movies/popular?page=${page}`, 'GET', null, false);
}

async function getMovieDetails(tmdbId) {
    return await apiCall(`/contents/movies/tmdb/${tmdbId}`, 'GET', null, false);
}

async function getBookDetails(googleBooksId) {
    return await apiCall(`/contents/books/google/${googleBooksId}`, 'GET', null, false);
}

// Library Functions
async function addToLibrary(contentId, status) {
    return await apiCall('/library/', 'POST', {
        content_id: contentId,
        status
    });
}

async function getMyLibrary(status = null) {
    let url = '/library/me';
    if (status && status !== 'all') {
        url += `?status=${status}`;
    }
    return await apiCall(url);
}

// Rating Functions
async function addRating(contentId, score) {
    return await apiCall('/ratings/', 'POST', {
        content_id: contentId,
        score: parseFloat(score)
    });
}

// Review Functions
async function addReview(contentId, text) {
    return await apiCall('/reviews/', 'POST', {
        content_id: contentId,
        text
    });
}

async function getContentReviews(contentId) {
    return await apiCall(`/reviews/content/${contentId}`);
}

async function deleteReview(reviewId) {
    return await apiCall(`/reviews/${reviewId}`, 'DELETE');
}

async function updateReview(reviewId, text) {
    return await apiCall(`/reviews/${reviewId}`, 'PUT', {
        text
    });
}

// Feed Functions
async function getGlobalFeed(skip = 0, limit = 15) {
    return await apiCall(`/feed/global?skip=${skip}&limit=${limit}`);
}

async function getMyActivities(skip = 0, limit = 15) {
    return await apiCall(`/feed/me?skip=${skip}&limit=${limit}`);
}

// Page Navigation
function showPage(pageName) {
    // Varolan modal'ları temizle
    closeLikersModal();
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const page = document.getElementById(`${pageName}-page`);
    if (page) {
        page.classList.add('active');
    }
    
    // Show/hide navbar
    const navbar = document.getElementById('navbar');
    if (pageName === 'auth') {
        navbar.style.display = 'none';
    } else {
        navbar.style.display = 'block';
    }
    
    // Load page content
    switch(pageName) {
        case 'home':
            loadHomeFeed();
            break;
        case 'explore':
            loadExploreContent();
            loadShowcaseModules();
            break;
        case 'library':
            loadLibraryContent();
            break;
        case 'profile':
            loadProfileContent();
            break;
    }
}

// Kullanıcı profiline git (Feed kartlarından)
function openUserProfile(userId) {
    // Şu anki kullanıcı bilgisini al
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser && currentUser.id === userId) {
        // Kendi profilimize git
        showPage('profile');
    } else {
        // Başka kullanıcının profiline git (şimdilik kendi profilimiz)
        // İleride bu özellik eklenebilir
        showPage('profile');
        showToast('Diğer kullanıcı profilleri yakında eklenecek!', 'info');
    }
}

// Home Feed
let currentFeedSkip = 0;
const feedLimit = 15;
let isLoadingFeed = false;
let hasMoreFeed = true;

async function loadHomeFeed(append = false) {
    // Varolan modal'ları temizle
    closeLikersModal();
    const feedList = document.getElementById('feed-list');
    
    // Zaten yükleniyor mu kontrol et
    if (isLoadingFeed) return;
    
    if (!append) {
        showLoading(feedList);
        currentFeedSkip = 0;
        hasMoreFeed = true;
    }
    
    isLoadingFeed = true;
    
    try {
        const activities = await getGlobalFeed(currentFeedSkip, feedLimit);
        
        if (activities.length === 0) {
            if (!append) {
                feedList.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-muted);">📭 Henüz aktivite yok. İçerik ekleyin veya diğer kullanıcıları takip edin!</p>';
            } else {
                // Daha fazla aktivite yok
                hasMoreFeed = false;
                addNoMoreMessage();
            }
            isLoadingFeed = false;
            return;
        }
        
        const activitiesHTML = activities.map(activity => createFeedPost(activity)).join('');
        
        if (append) {
            // Mevcut "Daha Fazla Yükle" butonunu veya loading'i kaldır
            const loadMoreBtn = feedList.querySelector('.load-more-container');
            if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            const loadingElem = feedList.querySelector('.feed-loading');
            if (loadingElem) {
                loadingElem.remove();
            }
            feedList.insertAdjacentHTML('beforeend', activitiesHTML);
        } else {
            feedList.innerHTML = activitiesHTML;
        }
        
        currentFeedSkip += activities.length;
        
        // Eğer tam sayfa geldi ise, daha fazla var demektir
        if (activities.length === feedLimit) {
            addFeedLoadMoreButton();
            hasMoreFeed = true;
        } else {
            // Tam sayfa gelmedi, bu son sayfa
            hasMoreFeed = false;
            if (activities.length > 0) {
                addNoMoreMessage();
            }
        }
        
    } catch (error) {
        if (!append) {
            feedList.innerHTML = '<p class="text-center error-message">⚠️ Aktiviteler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>';
        } else {
            showToast('Aktiviteler yüklenemedi', 'error');
        }
        console.error('Feed Error:', error);
    } finally {
        isLoadingFeed = false;
    }
}

function addFeedLoadMoreButton() {
    const feedList = document.getElementById('feed-list');
    const loadMoreHTML = `
        <div class="load-more-container">
            <button class="btn btn-secondary" onclick="loadMoreFeed()" id="load-more-btn">
                <span class="load-more-text">📰 Daha Fazla Aktivite Yükle</span>
                <span class="load-more-loading" style="display: none;">⏳ Yükleniyor...</span>
            </button>
        </div>
    `;
    feedList.insertAdjacentHTML('beforeend', loadMoreHTML);
}

function addNoMoreMessage() {
    const feedList = document.getElementById('feed-list');
    const noMoreHTML = `
        <div class="load-more-container" style="border-top: none; padding-top: 1rem;">
            <p style="color: var(--text-muted); font-size: 0.95rem; text-align: center;">
                ✨ Tüm aktiviteler yüklendi
            </p>
        </div>
    `;
    feedList.insertAdjacentHTML('beforeend', noMoreHTML);
}

async function loadMoreFeed() {
    if (isLoadingFeed || !hasMoreFeed) return;
    
    // Butonu loading durumuna getir
    const btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.disabled = true;
        btn.querySelector('.load-more-text').style.display = 'none';
        btn.querySelector('.load-more-loading').style.display = 'inline';
    }
    
    await loadHomeFeed(true);
}

// Infinite Scroll - Opsiyonel otomatik yükleme
function setupInfiniteScroll() {
    let throttleTimer;
    
    window.addEventListener('scroll', () => {
        if (throttleTimer) return;
        
        throttleTimer = setTimeout(() => {
            throttleTimer = null;
            
            // Sayfa sonuna yaklaştık mı kontrol et (200px kala)
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.scrollHeight;
            
            if (scrollPosition >= pageHeight - 200) {
                // Feed sayfasında mıyız?
                const homePage = document.getElementById('home-page');
                if (homePage && homePage.classList.contains('active')) {
                    if (!isLoadingFeed && hasMoreFeed) {
                        loadMoreFeed();
                    }
                }
            }
        }, 200); // 200ms throttle
    });
}

// Infinite scroll'u başlat (sayfa yüklendiğinde)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setupInfiniteScroll();
    });
}

function createFeedPost(activity) {
    // Poster/Kapak görseli
    const posterUrl = activity.content?.cover_image_url || 'https://via.placeholder.com/500x750?text=No+Image';
    
    // Kullanıcı avatarı - Gerçek avatar veya baş harfi (PROFİL LİNKLİ!)
    const userAvatar = activity.user?.avatar_url || null;
    const username = activity.user?.username || 'Anonim';
    const userId = activity.user?.id || null;
    
    // Avatar HTML - Profil sayfasına link ekle
    const avatarHTML = userId 
        ? `<a href="#" onclick="openUserProfile(${userId}); return false;" class="post-user-avatar-link">
            ${userAvatar 
                ? `<img src="${userAvatar}" alt="${username}" class="post-user-avatar-img">` 
                : `<div class="post-user-avatar-default">${username[0].toUpperCase()}</div>`
            }
           </a>`
        : (userAvatar 
            ? `<img src="${userAvatar}" alt="${username}" class="post-user-avatar-img">` 
            : `<div class="post-user-avatar-default">${username[0].toUpperCase()}</div>`);
    
    // Aktivite türüne göre ikon ve metin (DAHA DETAYLI!)
    const contentTitle = activity.content?.title || 'bir içerik';
    const contentType = activity.content?.content_type || 'movie';
    const contentTypeText = contentType === 'movie' ? 'film' : 'kitap';
    
    const activityTypeConfig = {
        'rating': { 
            icon: '⭐', 
            text: `<strong>"${contentTitle}"</strong> ${contentTypeText}ini puanladı`, 
            color: '#f59e0b' 
        },
        'review': { 
            icon: '💬', 
            text: `<strong>"${contentTitle}"</strong> ${contentTypeText}i hakkında yorum yaptı`, 
            color: '#10b981' 
        },
        'library_add': { 
            icon: '📚', 
            text: `<strong>"${contentTitle}"</strong> ${contentTypeText}ini kütüphanesine ekledi`, 
            color: '#6366f1' 
        },
        'list_create': { 
            icon: '📝', 
            text: activity.list ? `<strong>"${activity.list.name}"</strong> adlı yeni bir liste oluşturdu` : 'yeni bir liste oluşturdu', 
            color: '#8b5cf6' 
        },
        'list_add': { 
            icon: '➕', 
            text: activity.list ? `<strong>"${contentTitle}"</strong> içeriğini <strong>"${activity.list.name}"</strong> listesine ekledi` : `<strong>"${contentTitle}"</strong> bir listeye ekledi`, 
            color: '#ec4899' 
        }
    };
    
    const config = activityTypeConfig[activity.activity_type] || { 
        icon: '📌', 
        text: activity.activity_type, 
        color: '#6b7280' 
    };
    
    // Rating varsa yıldız göster (GÖRSELLEŞTİRİLMİŞ)
    let ratingHTML = '';
    if (activity.rating_score) {
        const fullStars = Math.floor(activity.rating_score / 2);
        const halfStar = (activity.rating_score % 2) >= 1;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        const starsHTML = '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
        
        ratingHTML = `
            <div class="post-rating">
                <span class="rating-stars" style="color: #fbbf24; font-size: 1.5rem;">${starsHTML}</span>
                <span class="rating-score" style="font-size: 1.2rem; font-weight: 600; color: #fbbf24;">${activity.rating_score}/10</span>
            </div>
        `;
    }
    
    // Review varsa göster - İLK 200 KARAKTER + DAHA FAZLA
    let reviewHTML = '';
    if (activity.review_text) {
        const maxLength = 200;
        const isLong = activity.review_text.length > maxLength;
        const displayText = isLong 
            ? activity.review_text.substring(0, maxLength) + '...' 
            : activity.review_text;
        
        reviewHTML = `
            <div class="post-review">
                <p class="review-text">"${displayText}"</p>
                ${isLong ? `<a href="#" class="review-read-more" onclick="openContentModal(${activity.content_id}, '${contentType}'); return false;">Devamını oku →</a>` : ''}
            </div>
        `;
    }
    
    // Beğeni ve yorum sayıları
    const likesCount = activity.likes_count || 0;
    const commentsCount = activity.review_text ? 1 : 0;
    
    // TAM BAĞLAM: Tarih detayını hesapla
    const timeAgo = getDetailedTimeAgo(activity.created_at);
    
    // Liste aktivitesi için özel media
    let mediaHTML = '';
    if (activity.activity_type === 'list_create' && activity.list) {
        // Liste kartı göster
        const list = activity.list;
        mediaHTML = `
            <div class="post-media-list" onclick="openListModal(${list.id})">
                <div class="list-card-preview">
                    <div class="list-card-icon">📝</div>
                    <div class="list-card-info">
                        <h3 class="list-card-name">${list.name}</h3>
                        ${list.description ? `<p class="list-card-description">${list.description.length > 100 ? list.description.substring(0, 100) + '...' : list.description}</p>` : ''}
                        <div class="list-card-meta">
                            <span>${list.items_count || 0} içerik</span>
                            <span>${list.is_public ? '🌍 Herkese Açık' : '🔒 Özel'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (activity.content_id) {
        // Normal içerik poster
        mediaHTML = `
            <div class="post-media" onclick="openContentModal(${activity.content_id}, '${contentType}')">
                <img src="${posterUrl}" alt="${activity.content?.title || 'İçerik'}" class="post-image">
                <div class="post-content-overlay">
                    <span class="content-type-badge">${contentType === 'movie' ? '🎬 Film' : '📚 Kitap'}</span>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="feed-post" data-activity-id="${activity.id}" data-content-id="${activity.content_id || ''}" data-content-type="${contentType}" ${activity.list ? `data-list-id="${activity.list.id}"` : ''}>
            <!-- Post Header: KİM, NE, NE ZAMAN -->
            <div class="post-header">
                ${avatarHTML}
                <div class="post-user-info">
                    <div class="post-username-line">
                        ${userId 
                            ? `<a href="#" onclick="openUserProfile(${userId}); return false;" class="post-username-link"><strong>${username}</strong></a>` 
                            : `<strong>${username}</strong>`
                        }
                        <span class="action-text">${config.icon} ${config.text}</span>
                    </div>
                    <div class="post-time" title="${new Date(activity.created_at).toLocaleString('tr-TR')}">
                        🕐 ${timeAgo}
                    </div>
                </div>
            </div>
            
            <!-- Post Content: HANGİ İÇERİK (Poster veya Liste Kartı) -->
            ${mediaHTML}
            
            <!-- Post Actions: ETKİLEŞİM -->
            <div class="post-actions">
                <button class="post-action-btn ${activity.is_liked_by_me ? 'liked' : ''}" onclick="toggleLikePost(${activity.id}, event)">
                    <span class="action-icon">${activity.is_liked_by_me ? '❤️' : '🤍'}</span>
                    <span>${activity.is_liked_by_me ? 'Beğenildi' : 'Beğen'}</span>
                </button>
                <button class="post-action-btn" onclick="commentOnPost(${activity.id})">
                    <span class="action-icon">💬</span>
                    <span>Yorum</span>
                </button>
                <button class="post-action-btn" onclick="sharePost(${activity.id})">
                    <span class="action-icon">📤</span>
                    <span>Paylaş</span>
                </button>
            </div>
            
            <!-- Post Stats -->
            <div class="post-stats" data-activity-id="${activity.id}">
                ${likesCount > 0 ? `<span class="stat-item likes" style="cursor: pointer;" onclick="loadAndShowLikers(${activity.id})"><strong>${likesCount}</strong> beğeni</span>` : ''}
                ${commentsCount > 0 ? `<span class="stat-item"><strong>${commentsCount}</strong> yorum</span>` : ''}
            </div>
            
            <!-- Post Info: İÇERİK DETAYLARI -->
            <div class="post-info">
                ${activity.activity_type === 'list_create' && activity.list ? `
                    <!-- Liste Bilgisi (Liste Oluşturma) -->
                    <div class="post-title">
                        <a href="#" onclick="openListModal(${activity.list.id}); return false;" class="content-title-link">
                            <strong style="font-size: 1.1rem;">📝 ${activity.list.name}</strong>
                        </a>
                    </div>
                    ${activity.list.description ? `
                        <div class="post-review">
                            <p class="review-text">${activity.list.description.length > 150 ? activity.list.description.substring(0, 150) + '...' : activity.list.description}</p>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
                        <span>📦 ${activity.list.items_count || 0} içerik</span>
                        <span>${activity.list.is_public ? '🌍 Herkese Açık' : '🔒 Özel Liste'}</span>
                    </div>
                ` : activity.activity_type === 'list_add' && activity.list ? `
                    <!-- İçerik ve Liste Bilgisi (Listeye Ekleme) -->
                    <div class="post-title">
                        <a href="#" onclick="openContentModal(${activity.content_id}, '${contentType}'); return false;" class="content-title-link">
                            <strong style="font-size: 1.1rem;">${activity.content?.title || 'İçerik'}</strong>
                        </a>
                        ${activity.content?.release_date ? `<span style="color: var(--text-muted); font-size: 0.9rem;"> (${new Date(activity.content.release_date).getFullYear()})</span>` : ''}
                    </div>
                    <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border-radius: 0.5rem; border-left: 3px solid rgba(139, 92, 246, 0.5);">
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem;">Listeye eklendi:</div>
                        <a href="#" onclick="openListModal(${activity.list.id}); return false;" class="content-title-link" style="font-size: 1rem; font-weight: 600;">
                            📝 ${activity.list.name}
                        </a>
                    </div>
                ` : `
                    <!-- Content Title (Tıklanabilir) -->
                    <div class="post-title">
                        <a href="#" onclick="openContentModal(${activity.content_id}, '${contentType}'); return false;" class="content-title-link">
                            <strong style="font-size: 1.1rem;">${activity.content?.title || 'İçerik'}</strong>
                        </a>
                        ${activity.content?.release_date ? `<span style="color: var(--text-muted); font-size: 0.9rem;"> (${new Date(activity.content.release_date).getFullYear()})</span>` : ''}
                    </div>
                    
                    <!-- Rating -->
                    ${ratingHTML}
                    
                    <!-- Review -->
                    ${reviewHTML}
                `}
            </div>
        </div>
    `;
}

// Etkileşim fonksiyonları
let currentCommentContentId = null;
let currentShareContentId = null;

async function toggleLikePost(activityId, event) {
    const button = event.currentTarget;
    const isLiked = button.classList.contains('liked');
    
    // Butonu devre dışı bırak (çift tıklama engeli)
    button.disabled = true;
    
    try {
        let response;
        
        if (isLiked) {
            // Beğeniyi kaldır
            response = await apiCall(`/likes/activities/${activityId}`, 'DELETE');
            button.classList.remove('liked');
            
            // İkon ve metni güncelle
            const icon = button.querySelector('.action-icon');
            const text = button.querySelector('span:last-child');
            if (icon) icon.textContent = '🤍';
            if (text) text.textContent = 'Beğen';
            
            showToast('Beğeni kaldırıldı', 'info');
        } else {
            // Beğen
            response = await apiCall(`/likes/activities/${activityId}`, 'POST');
            button.classList.add('liked');
            
            // İkon ve metni güncelle
            const icon = button.querySelector('.action-icon');
            const text = button.querySelector('span:last-child');
            if (icon) icon.textContent = '❤️';
            if (text) text.textContent = 'Beğenildi';
            
            showToast('Beğenildi! ❤️', 'success');
        }
        
        // Beğeni sayısını güncelle
        if (response && response.likes_count !== undefined) {
            updateLikesCount(activityId, response.likes_count);
        }
        
    } catch (error) {
        console.error('Like error:', error);
        showToast('Bir hata oluştu', 'error');
        // Hata durumunda butonu eski haline döndür
        if (isLiked) {
            button.classList.add('liked');
        } else {
            button.classList.remove('liked');
        }
    } finally {
        button.disabled = false;
    }
}

async function updateLikesCount(activityId, count) {
    const postElement = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (!postElement) return;
    
    const statsContainer = postElement.querySelector('.post-stats');
    if (!statsContainer) return;
    
    // Mevcut beğeni span'ini bul veya oluştur
    let likeSpan = statsContainer.querySelector('.stat-item.likes');
    
    if (count > 0) {
        // Beğenenleri getir
        try {
            const response = await apiCall(`/likes/activities/${activityId}/users`);
            const likers = response.users || [];
            
            let likeText = '';
            if (likers.length === 1) {
                likeText = `<strong>${likers[0].username}</strong> beğendi`;
            } else if (likers.length === 2) {
                likeText = `<strong>${likers[0].username}</strong> ve <strong>${likers[1].username}</strong> beğendi`;
            } else if (likers.length > 2) {
                const others = likers.length - 2;
                likeText = `<strong>${likers[0].username}</strong>, <strong>${likers[1].username}</strong> ve <strong>${others} kişi daha</strong> beğendi`;
            }
            
            if (likeSpan) {
                likeSpan.innerHTML = likeText;
                likeSpan.style.cursor = 'pointer';
                likeSpan.onclick = () => showLikersModal(activityId, likers);
            } else {
                const newSpan = document.createElement('span');
                newSpan.className = 'stat-item likes';
                newSpan.innerHTML = likeText;
                newSpan.style.cursor = 'pointer';
                newSpan.onclick = () => showLikersModal(activityId, likers);
                statsContainer.insertBefore(newSpan, statsContainer.firstChild);
            }
        } catch (error) {
            // Hata durumunda basit gösterim
            const simpleText = `<strong>${count}</strong> beğeni`;
            if (likeSpan) {
                likeSpan.innerHTML = simpleText;
            } else {
                const newSpan = document.createElement('span');
                newSpan.className = 'stat-item likes';
                newSpan.innerHTML = simpleText;
                statsContainer.insertBefore(newSpan, statsContainer.firstChild);
            }
        }
    } else {
        // 0 beğeni varsa kaldır
        if (likeSpan) {
            likeSpan.remove();
        }
    }
}

function showLikersModal(activityId, likers) {
    if (!likers || likers.length === 0) return;
    
    // ÖNCEKİ MODAL'I KALDIR!
    closeLikersModal();
    
    const modalHTML = `
        <div class="modal-overlay" id="likers-modal" onclick="closeLikersModal()">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Beğenenler</h3>
                    <button class="modal-close" onclick="closeLikersModal()">×</button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                    <div class="likers-list">
                        ${likers.map(liker => `
                            <div class="liker-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                                ${liker.avatar_url 
                                    ? `<img src="${liker.avatar_url}" alt="${liker.username}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
                                    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${liker.username[0].toUpperCase()}</div>`
                                }
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary);">${liker.username}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted);">${formatDate(liker.liked_at)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ESC tuşuyla kapatma
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeLikersModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeLikersModal() {
    // TÜM MODAL'LARI KALDIR (birden fazla varsa)
    const modals = document.querySelectorAll('#likers-modal');
    modals.forEach(modal => modal.remove());
}

async function loadAndShowLikers(activityId) {
    try {
        const response = await apiCall(`/likes/activities/${activityId}/users`);
        const likers = response.users || [];
        
        if (likers.length > 0) {
            showLikersModal(activityId, likers);
        } else {
            showToast('Henüz kimse beğenmemiş', 'info');
        }
    } catch (error) {
        console.error('Likers loading error:', error);
        showToast('Beğenenler yüklenemedi', 'error');
    }
}

function commentOnPost(activityId) {
    // Activity'den content_id'yi al
    const postElement = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (postElement) {
        const contentId = postElement.getAttribute('data-content-id');
        if (contentId) {
            currentCommentContentId = parseInt(contentId);
            openCommentModal();
        }
    }
}

function openCommentModal() {
    const modal = document.getElementById('comment-modal');
    document.getElementById('comment-text').value = '';
    modal.classList.add('active');
}

function closeCommentModal() {
    const modal = document.getElementById('comment-modal');
    modal.classList.remove('active');
    currentCommentContentId = null;
}

async function submitComment(event) {
    event.preventDefault();
    
    const text = document.getElementById('comment-text').value.trim();
    
    if (!currentCommentContentId) {
        showToast('İçerik bulunamadı', 'error');
        return;
    }
    
    if (!text || text.length < 5) {
        showToast('Yorum en az 5 karakter olmalıdır', 'error');
        return;
    }
    
    try {
        await addReview(currentCommentContentId, text);
        closeCommentModal();
        showToast('Yorum başarıyla eklendi! 💬', 'success');
        
        // Feed'i yenile
        const homePage = document.getElementById('home-page');
        if (homePage.classList.contains('active')) {
            await loadHomeFeed();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function sharePost(activityId) {
    // Activity'den content bilgilerini al
    const postElement = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (postElement) {
        const contentId = postElement.getAttribute('data-content-id');
        if (contentId) {
            currentShareContentId = parseInt(contentId);
            openShareModal();
        }
    }
}

function openShareModal() {
    const modal = document.getElementById('share-modal');
    const shareLink = document.getElementById('share-link');
    
    // Paylaşım linkini oluştur
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?content=${currentShareContentId}`;
    shareLink.value = shareUrl;
    
    modal.classList.add('active');
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    modal.classList.remove('active');
    currentShareContentId = null;
}

function copyShareLink() {
    const shareLink = document.getElementById('share-link');
    shareLink.select();
    shareLink.setSelectionRange(0, 99999); // Mobil için
    
    try {
        document.execCommand('copy');
        showToast('Link kopyalandı! 🔗', 'success');
    } catch (err) {
        // Modern API dene
        navigator.clipboard.writeText(shareLink.value).then(() => {
            showToast('Link kopyalandı! 🔗', 'success');
        }).catch(() => {
            showToast('Link kopyalanamadı', 'error');
        });
    }
}

function shareToTwitter() {
    const shareLink = document.getElementById('share-link').value;
    const text = encodeURIComponent('Bu içeriğe göz atın! 🎬📚');
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToWhatsApp() {
    const shareLink = document.getElementById('share-link').value;
    const text = encodeURIComponent(`Bu içeriğe göz atın! 🎬📚 ${shareLink}`);
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
}

function shareToFacebook() {
    const shareLink = document.getElementById('share-link').value;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// Explore Page
let currentExploreTab = 'movies';
let currentExplorePage = 1;
let currentExploreQuery = null;
let exploreHasMore = true;
let currentFilters = {
    genre: '',
    yearMin: '',
    yearMax: '',
    rating: ''
};

async function loadExploreContent(query = null, page = 1, append = false) {
    const contentContainer = document.getElementById('explore-content');
    const showcaseSection = document.getElementById('showcase-section');
    
    if (!append) {
        showLoading(contentContainer);
        currentExplorePage = 1;
        exploreHasMore = true;
    }
    
    currentExploreQuery = query;
    
    // Eğer arama veya filtre varsa, vitrin modüllerini gizle
    if (query || currentFilters.genre || currentFilters.yearMin || currentFilters.yearMax || currentFilters.rating) {
        showcaseSection.style.display = 'none';
    } else {
        showcaseSection.style.display = 'block';
    }
    
    try {
        let results;
        
        if (query) {
            // Arama sonuçları
            results = currentExploreTab === 'movies' 
                ? await searchMovies(query, page)
                : await searchBooks(query, page);
        } else {
            // Popüler içerikler
            if (currentExploreTab === 'movies') {
                results = await getPopularMovies(page);
            } else {
                // Kitaplar için "bestseller" araması yap
                results = await searchBooks('bestseller', page);
            }
        }
        
        if (results.results && results.results.length === 0 && !append) {
            contentContainer.innerHTML = '<p class="text-center">Sonuç bulunamadı.</p>';
            return;
        }
        
        let items = results.results || results;
        
        // FİLTRELEME UYGULA (Client-side)
        if (currentFilters.genre || currentFilters.yearMin || currentFilters.yearMax || currentFilters.rating) {
            items = applyFilters(items);
        }
        
        // Eğer hiç sonuç yoksa, daha fazla yok demektir
        if (items.length === 0) {
            exploreHasMore = false;
            if (!append) {
                contentContainer.innerHTML = '<p class="text-center">Filtrelere uygun sonuç bulunamadı.</p>';
                return;
            }
        } else {
            // Daha fazla sayfa var mı kontrol et - total_pages varsa kullan, yoksa items sayısına bak
            if (results.total_pages) {
                exploreHasMore = results.page < results.total_pages;
            } else {
                // total_pages yoksa, items sayısına göre karar ver (tam sayfa = 20 item)
                exploreHasMore = items.length >= 20;
            }
        }
        
        const cardsHTML = items.map(item => {
            if (currentExploreTab === 'movies') {
                return createMovieCard(item);
            } else {
                return createBookCard(item);
            }
        }).join('');
        
        if (append) {
            // Mevcut load more butonunu kaldır
            const loadMoreBtn = contentContainer.querySelector('.load-more-container');
            if (loadMoreBtn) {
                loadMoreBtn.remove();
            }
            contentContainer.insertAdjacentHTML('beforeend', cardsHTML);
        } else {
            contentContainer.innerHTML = cardsHTML;
        }
        
        // Load More butonu ekle/güncelle - her durumda göster
        updateLoadMoreButton(contentContainer, exploreHasMore);
        
        console.log('Explore yüklendi:', {
            page: currentExplorePage,
            itemCount: items.length,
            hasMore: exploreHasMore,
            totalPages: results.total_pages || 'N/A',
            filters: currentFilters
        });
        
    } catch (error) {
        if (!append) {
            contentContainer.innerHTML = '<p class="text-center">İçerik yüklenirken bir hata oluştu.</p>';
        }
        showToast(error.message, 'error');
    }
}

// Filtre uygulama fonksiyonu
function applyFilters(items) {
    return items.filter(item => {
        // Tür filtresi (sadece filmler için)
        if (currentFilters.genre && item.genre_ids) {
            if (!item.genre_ids.includes(parseInt(currentFilters.genre))) {
                return false;
            }
        }
        
        // Yıl filtresi
        if (currentFilters.yearMin || currentFilters.yearMax) {
            const itemYear = item.release_date ? parseInt(item.release_date.substring(0, 4)) : 0;
            
            if (currentFilters.yearMin && itemYear < parseInt(currentFilters.yearMin)) {
                return false;
            }
            if (currentFilters.yearMax && itemYear > parseInt(currentFilters.yearMax)) {
                return false;
            }
        }
        
        // Puan filtresi
        if (currentFilters.rating) {
            const itemRating = item.vote_average || 0;
            if (itemRating < parseFloat(currentFilters.rating)) {
                return false;
            }
        }
        
        return true;
    });
}

// Vitrin modüllerini yükle
async function loadShowcaseModules() {
    // En Popüler Filmler
    try {
        const popularResults = await getPopularMovies(1);
        const popularContainer = document.getElementById('popular-movies-carousel');
        
        if (!popularResults || !popularResults.results || popularResults.results.length === 0) {
            popularContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Henüz popüler film yok.</p>';
            return;
        }
        
        const popularMovies = popularResults.results.slice(0, 10); // İlk 10 film
        popularContainer.innerHTML = popularMovies.map(movie => createMovieCard(movie)).join('');
    } catch (error) {
        console.error('Popüler filmler yüklenemedi:', error);
        const popularContainer = document.getElementById('popular-movies-carousel');
        if (popularContainer) {
            popularContainer.innerHTML = `<p style="text-align: center; color: var(--danger-color); padding: 2rem;">Yükleme hatası: ${error.message || 'Bilinmeyen hata'}</p>`;
        }
    }
    
    // En Yüksek Puanlı Filmler
    try {
        const topRatedResults = await getTopRatedMovies(1);
        const topRatedContainer = document.getElementById('top-rated-movies-carousel');
        
        if (!topRatedResults || !topRatedResults.results || topRatedResults.results.length === 0) {
            topRatedContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Henüz puanlanmış film yok.</p>';
            return;
        }
        
        const topRatedMovies = topRatedResults.results.slice(0, 10); // İlk 10 film
        topRatedContainer.innerHTML = topRatedMovies.map(movie => createMovieCard(movie)).join('');
    } catch (error) {
        console.error('En yüksek puanlı filmler yüklenemedi:', error);
        const topRatedContainer = document.getElementById('top-rated-movies-carousel');
        if (topRatedContainer) {
            topRatedContainer.innerHTML = `<p style="text-align: center; color: var(--danger-color); padding: 2rem;">Yükleme hatası: ${error.message || 'Bilinmeyen hata'}</p>`;
        }
    }
}

// Top rated movies API çağrısı
async function getTopRatedMovies(page = 1) {
    return await apiCall(`/contents/movies/top-rated?page=${page}`, 'GET', null, false);
}

function updateLoadMoreButton(container, hasMore) {
    // Mevcut butonu kaldır
    const existing = container.querySelector('.load-more-container');
    if (existing) {
        existing.remove();
    }
    
    console.log('updateLoadMoreButton çağrıldı:', { hasMore });
    
    if (hasMore) {
        const loadMoreHTML = `
            <div class="load-more-container">
                <button class="btn btn-secondary" onclick="loadMoreExplore()">
                    📚 Daha Fazla Göster
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', loadMoreHTML);
        console.log('Daha Fazla Göster butonu eklendi');
    } else {
        console.log('Daha fazla içerik yok, buton eklenmedi');
    }
}

async function loadMoreExplore() {
    currentExplorePage++;
    await loadExploreContent(currentExploreQuery, currentExplorePage, true);
}

function createMovieCard(movie) {
    const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/200x300?text=No+Image';
    
    const year = movie.release_date?.substring(0, 4) || '-';
    const rating = movie.vote_average?.toFixed(1) || 'N/A';
    
    return `
        <div class="content-card" onclick="openContentModalFromSearch(${movie.id}, 'movie', 'tmdb')">
            <img src="${posterUrl}" alt="${movie.title}" class="content-card-image">
            <div class="content-card-body">
                <div class="content-card-title">${movie.title}</div>
                <div class="content-card-meta">
                    <span>📅 ${year}</span>
                    <span class="content-rating">⭐ ${rating}</span>
                </div>
            </div>
        </div>
    `;
}

function createBookCard(book) {
    const volumeInfo = book.volumeInfo || {};
    const imageUrl = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/200x300?text=No+Image';
    const title = volumeInfo.title || 'Bilinmeyen';
    const author = volumeInfo.authors?.[0] || '-';
    const publishedDate = volumeInfo.publishedDate?.substring(0, 4) || '-';
    
    return `
        <div class="content-card" onclick="openContentModalFromSearch('${book.id}', 'book', 'google')">
            <img src="${imageUrl}" alt="${title}" class="content-card-image">
            <div class="content-card-body">
                <div class="content-card-title">${title}</div>
                <div class="content-card-meta">
                    <span>✍️ ${author}</span>
                    <span>📅 ${publishedDate}</span>
                </div>
            </div>
        </div>
    `;
}

// Library Page
let libraryCache = {};

async function loadLibraryContent(status = null) {
    const contentContainer = document.getElementById('library-content');
    showLoading(contentContainer);
    
    try {
        const items = await getMyLibrary(status);
        
        if (items.length === 0) {
            const statusText = {
                'watched': 'izlediğiniz',
                'to_watch': 'izleyeceğiniz',
                'read': 'okuduğunuz',
                'to_read': 'okuyacağınız'
            };
            const message = status && status !== 'all' 
                ? `${statusText[status] || ''} içerik yok.`
                : 'Kütüphanenizde henüz içerik yok.';
            contentContainer.innerHTML = `<p class="text-center">${message}</p>`;
            return;
        }
        
        // Her item için content detaylarını al
        const contentDetails = await Promise.all(items.map(async (item) => {
            try {
                // Cache kontrolü
                if (libraryCache[item.content_id]) {
                    return { item, content: libraryCache[item.content_id] };
                }
                
                const content = await apiCall(`/contents/${item.content_id}`);
                libraryCache[item.content_id] = content.content;
                return { item, content: content.content };
            } catch (error) {
                console.error('Content detay alınamadı:', error);
                return { item, content: null };
            }
        }));
        
        contentContainer.innerHTML = contentDetails.map(({ item, content }) => {
            if (!content) {
                return `
                    <div class="content-card">
                        <div class="content-card-body">
                            <div class="content-card-title">İçerik #${item.content_id}</div>
                            <div class="content-card-meta">
                                <span>${getStatusLabel(item.status)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            const posterUrl = content.cover_image_url || 'https://via.placeholder.com/200x300?text=No+Image';
            
            return `
                <div class="content-card" onclick="openContentModal(${content.id}, '${content.content_type}')">
                    <img src="${posterUrl}" alt="${content.title}" class="content-card-image">
                    <div class="content-card-body">
                        <div class="content-card-title">${content.title}</div>
                        <div class="content-card-meta">
                            <span class="status-badge status-${item.status}">${getStatusLabel(item.status)}</span>
                            ${content.average_rating > 0 ? `<span class="content-rating">⭐ ${content.average_rating.toFixed(1)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        contentContainer.innerHTML = '<p class="text-center">Kütüphane yüklenirken bir hata oluştu.</p>';
        showToast(error.message, 'error');
    }
}

function getStatusLabel(status) {
    const labels = {
        'watched': '✓ İzlendi',
        'to_watch': '⏱ İzlenecek',
        'read': '✓ Okundu',
        'to_read': '📚 Okunacak'
    };
    return labels[status] || status;
}

// Profile Page
async function loadProfileContent() {
    try {
        const profile = await loadProfile();
        
        // Global currentUser'ı güncelle
        currentUser = profile;
        localStorage.setItem('currentUser', JSON.stringify(profile));
        
        document.getElementById('profile-username').textContent = profile.username;
        document.getElementById('profile-email').textContent = profile.email;
        document.getElementById('profile-bio').textContent = profile.bio || 'Henüz biyografi eklenmemiş.';
        
        // Profil sahipliği kontrolü
        const loggedInUser = JSON.parse(localStorage.getItem('currentUser'));
        const isOwnProfile = loggedInUser && loggedInUser.id === profile.id;
        
        // Butonları göster/gizle
        if (isOwnProfile) {
            // Kendi profilimiz
            document.getElementById('edit-profile-btn').style.display = 'inline-block';
            document.getElementById('follow-btn').style.display = 'none';
            document.getElementById('unfollow-btn').style.display = 'none';
            document.getElementById('create-list-btn').style.display = 'inline-block';
        } else {
            // Başkasının profili
            document.getElementById('edit-profile-btn').style.display = 'none';
            document.getElementById('create-list-btn').style.display = 'none';
            
            // Takip durumunu kontrol et
            await checkFollowStatus(profile.username);
        }
        
        // İstatistikleri yükle
        await loadProfileStats();
        
        // Kütüphane içeriklerini yükle (profil sayfasındaki sekme için)
        await loadProfileLibraryContent();
        
        // Özel listeleri yükle
        await loadUserCustomLists();
        
        // Load activities
        const activitiesList = document.getElementById('profile-activities-list');
        const activities = await getMyActivities();
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<p class="text-center">Henüz aktivite yok.</p>';
        } else {
            activitiesList.innerHTML = activities.map(activity => {
                const activityTypeMap = {
                    'rating': '⭐ puanlama',
                    'review': '💬 yorum',
                    'library_add': '📚 kütüphane',
                    'list_create': '📝 liste',
                    'list_add': '➕ liste ekleme'
                };
                
                return `
                    <div class="feed-item">
                        <div class="feed-content">
                            ${activityTypeMap[activity.activity_type] || activity.activity_type} - ${formatDate(activity.created_at)}
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadProfileLibraryContent(status = null) {
    const container = document.getElementById('profile-library-content');
    
    try {
        showLoading(container);
        // getMyLibrary() kullan ve status parametresini geç
        const library = await getMyLibrary(status);
        
        if (!library || library.length === 0) {
            container.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Kütüphanede içerik yok.</p>';
            return;
        }
        
        container.innerHTML = library
            .filter(item => item.content) // content olmayanları filtrele
            .map(item => {
                const content = item.content;
                if (!content) return ''; // Güvenlik kontrolü
                
                const posterUrl = content.cover_image_url || 'https://via.placeholder.com/200x300?text=No+Image';
                const contentId = content.id || item.content_id;
                const contentType = content.content_type || 'movie';
                const title = content.title || 'İsimsiz İçerik';
                const year = content.release_date?.substring(0, 4) || content.published_date?.substring(0, 4) || '-';
                
                return `
                    <div class="content-card" onclick="openContentModal(${contentId}, '${contentType}')">
                        <img src="${posterUrl}" alt="${title}" class="content-card-image">
                        <div class="content-card-body">
                            <div class="content-card-title">${title}</div>
                            <div class="content-card-meta">
                                <span>${year}</span>
                                <span class="status-badge status-${item.status}">${getStatusLabel(item.status)}</span>
                            </div>
                        </div>
                    </div>
                `;
            })
            .filter(html => html !== '') // Boş HTML'leri filtrele
            .join('');
    } catch (error) {
        container.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Kütüphane yüklenirken hata oluştu.</p>';
        showToast(error.message, 'error');
    }
}

async function loadUserCustomLists() {
    const container = document.getElementById('profile-lists-container');
    
    try {
        const lists = await getUserCustomLists();
        
        if (lists.length === 0) {
            container.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">Henüz özel liste oluşturulmamış.</p>';
            return;
        }
        
        container.innerHTML = lists.map(list => `
            <div class="content-card" onclick="openListModal(${list.id})">
                <div class="content-card-image" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                    📝
                </div>
                <div class="content-card-body">
                    <div class="content-card-title">${list.name}</div>
                    <div class="content-card-meta">
                        <span>${list.items?.length || 0} içerik</span>
                        <span>${list.is_public ? '🌍 Herkese Açık' : '🔒 Özel'}</span>
                    </div>
                    ${list.description ? `<p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">${list.description}</p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: var(--danger-color);">Listeler yüklenirken hata oluştu.</p>';
    }
}

async function openListModal(listId) {
    const modal = document.getElementById('list-detail-modal');
    const modalBody = document.getElementById('list-detail-body');
    modal.classList.add('active');
    
    try {
        const list = await getCustomListDetails(listId);
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const isOwner = currentUser && list.user_id === currentUser.id;
        
        const ownerButtons = isOwner ? `
            <button class="btn btn-secondary" onclick="editListPrompt(${list.id}, '${list.name.replace(/'/g, "\\'")}', '${(list.description || '').replace(/'/g, "\\'")}', ${list.is_public})">
                ✏️ Düzenle
            </button>
            <button class="btn btn-secondary" style="background: var(--danger-color);" onclick="deleteListConfirm(${list.id})">
                🗑️ Sil
            </button>
        ` : '';
        
        modalBody.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h2 style="margin: 0 0 0.5rem 0;">📝 ${list.name}</h2>
                        ${list.description ? `<p style="color: var(--text-secondary);">${list.description}</p>` : ''}
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">
                            ${list.is_public ? '🌍 Herkese Açık' : '🔒 Özel'} • ${list.items?.length || 0} içerik
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        ${ownerButtons}
                    </div>
                </div>
            </div>
            
            <div id="list-items-container" class="content-grid">
                ${list.items && list.items.length > 0 
                    ? list.items.map(item => `
                        <div class="content-card">
                            <div class="content-card-image" style="background-image: url('${item.poster_url || '/placeholder.jpg'}');" onclick="openContentModal(${item.content_id}, '${item.content_type}')"></div>
                            <div class="content-card-body">
                                <div class="content-card-title">${item.title}</div>
                                ${isOwner ? `
                                    <button class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem; font-size: 0.85rem; padding: 0.4rem;" onclick="removeFromListConfirm(${list.id}, ${item.content_id})">
                                        ❌ Listeden Çıkar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')
                    : '<p class="text-center" style="grid-column: 1 / -1; color: var(--text-secondary);">Bu listede henüz içerik yok.</p>'
                }
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Liste detayları yüklenemedi.</p>';
        showToast(error.message, 'error');
    }
}

function closeListDetailModal() {
    const modal = document.getElementById('list-detail-modal');
    modal.classList.remove('active');
}

async function editListPrompt(listId, currentName, currentDescription, isPublic) {
    const newName = prompt('Liste adı:', currentName);
    if (newName === null) return;
    
    if (!newName || newName.trim().length < 1) {
        showToast('Liste adı boş olamaz', 'error');
        return;
    }
    
    const newDescription = prompt('Liste açıklaması (boş bırakabilirsiniz):', currentDescription);
    if (newDescription === null) return;
    
    try {
        await updateCustomList(listId, newName, newDescription, isPublic);
        showToast('Liste güncellendi!', 'success');
        openListModal(listId); // Modalı yenile
        
        // Profil sayfasını da yenile
        const currentPage = document.querySelector('.page.active').id;
        if (currentPage === 'profile-page') {
            await loadUserCustomLists();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteListConfirm(listId) {
    if (!confirm('Bu listeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        return;
    }
    
    try {
        await deleteCustomList(listId);
        showToast('Liste silindi!', 'success');
        closeListDetailModal();
        
        // Profil sayfasını yenile
        const currentPage = document.querySelector('.page.active').id;
        if (currentPage === 'profile-page') {
            await loadUserCustomLists();
        }
    } catch (error) {
        showToast(error.message || 'Liste silinirken hata oluştu', 'error');
    }
}

async function removeFromListConfirm(listId, contentId) {
    if (!confirm('Bu içeriği listeden çıkarmak istiyor musunuz?')) {
        return;
    }
    
    try {
        await removeContentFromList(listId, contentId);
        showToast('İçerik listeden çıkarıldı!', 'success');
        openListModal(listId); // Modalı yenile
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Takip Fonksiyonları
async function checkFollowStatus(username) {
    try {
        // Kullanıcının takipçilerini kontrol et
        const followers = await apiCall(`/users/${username}/followers`);
        const loggedInUser = JSON.parse(localStorage.getItem('currentUser'));
        const isFollowing = followers.some(f => f.id === loggedInUser?.id);
        
        if (isFollowing) {
            document.getElementById('unfollow-btn').style.display = 'inline-block';
            document.getElementById('follow-btn').style.display = 'none';
        } else {
            document.getElementById('follow-btn').style.display = 'inline-block';
            document.getElementById('unfollow-btn').style.display = 'none';
        }
    } catch (error) {
        console.error('Takip durumu kontrol edilemedi:', error);
        // Hata durumunda takip et butonunu göster
        document.getElementById('follow-btn').style.display = 'inline-block';
        document.getElementById('unfollow-btn').style.display = 'none';
    }
}

async function followUser(username) {
    try {
        await apiCall(`/users/${username}/follow`, 'POST');
        showToast(`${username} takip edildi!`, 'success');
        await checkFollowStatus(username);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function unfollowUser(username) {
    try {
        await apiCall(`/users/${username}/unfollow`, 'DELETE');
        showToast(`${username} takipten çıkarıldı`, 'info');
        await checkFollowStatus(username);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadProfileStats() {
    try {
        // Kullanıcı bilgisini güvenli şekilde al
        const user = currentUser || JSON.parse(localStorage.getItem('currentUser'));
        
        if (!user || !user.id) {
            console.error('Kullanıcı bilgisi bulunamadı');
            return;
        }
        
        // Puanlamalarımı al
        const ratingsResponse = await apiCall(`/ratings/user/${user.id}`);
        const ratingsCount = Array.isArray(ratingsResponse) ? ratingsResponse.length : 0;
        document.getElementById('stat-ratings').textContent = ratingsCount;
        
        // Yorumlarımı al
        const reviewsResponse = await apiCall(`/reviews/user/${user.id}`);
        const reviewsCount = Array.isArray(reviewsResponse) ? reviewsResponse.length : 0;
        document.getElementById('stat-reviews').textContent = reviewsCount;
        
        // Kütüphane öğelerini al
        const libraryResponse = await getMyLibrary();
        const libraryCount = Array.isArray(libraryResponse) ? libraryResponse.length : 0;
        document.getElementById('stat-library').textContent = libraryCount;
    } catch (error) {
        console.error('İstatistikler yüklenemedi:', error);
        // Hata durumunda varsayılan değerler
        document.getElementById('stat-ratings').textContent = '0';
        document.getElementById('stat-reviews').textContent = '0';
        document.getElementById('stat-library').textContent = '0';
    }
}

// Arama sonuçlarından içerik detay sayfasına git
async function openContentModalFromSearch(id, contentType, source) {
    try {
        let contentId;
        
        if (source === 'tmdb' && contentType === 'movie') {
            // TMDb ID ile içeriği getir ve veritabanına kaydet
            const response = await apiCall(`/contents/movies/tmdb/${id}`);
            contentId = response.id;
        } else if (source === 'google' && contentType === 'book') {
            // Google Books ID ile içeriği getir ve veritabanına kaydet
            const response = await apiCall(`/contents/books/google/${id}`);
            contentId = response.id;
        } else {
            contentId = id;
        }
        
        // İçerik detay modalını aç
        await openContentModal(contentId, contentType);
    } catch (error) {
        console.error('İçerik yüklenemedi:', error);
        showToast('İçerik detayları yüklenirken bir hata oluştu', 'error');
    }
}

// General Content Modal
async function openContentModal(contentId, contentType) {
    const modal = document.getElementById('content-modal');
    const modalBody = document.getElementById('modal-body');
    
    modal.classList.add('active');
    showLoading(modalBody);
    
    try {
        const response = await apiCall(`/contents/${contentId}`);
        const content = response.content;
        
        const posterUrl = content.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Image';
        
        // Film için özel alanlar
        const movieSpecific = content.content_type === 'movie' ? `
            <span>⏱️ ${content.runtime || '-'} dk</span>
            ${content.director ? `<p><strong>Yönetmen:</strong> ${content.director}</p>` : ''}
            ${content.cast ? `<p><strong>Oyuncular:</strong> ${content.cast}</p>` : ''}
            ${content.genres ? `<p><strong>Türler:</strong> ${content.genres}</p>` : ''}
        ` : '';
        
        // Kitap için özel alanlar
        const bookSpecific = content.content_type === 'book' ? `
            ${content.authors ? `<p><strong>Yazar:</strong> ${content.authors}</p>` : ''}
            ${content.publisher ? `<p><strong>Yayınevi:</strong> ${content.publisher}</p>` : ''}
            ${content.page_count ? `<p><strong>Sayfa:</strong> ${content.page_count}</p>` : ''}
        ` : '';
        
        // Durum butonları
        const statusButtons = content.content_type === 'movie' ? `
            <button class="btn btn-primary" onclick="addToLibraryFromModal(${content.id}, 'watched')">
                ✓ İzledim
            </button>
            <button class="btn btn-secondary" onclick="addToLibraryFromModal(${content.id}, 'to_watch')">
                + İzlenecekler
            </button>
            <button class="btn btn-secondary" onclick="openAddToListModal(${content.id})">
                📝 Özel Listeye Ekle
            </button>
        ` : `
            <button class="btn btn-primary" onclick="addToLibraryFromModal(${content.id}, 'read')">
                ✓ Okudum
            </button>
            <button class="btn btn-secondary" onclick="addToLibraryFromModal(${content.id}, 'to_read')">
                + Okunacaklar
            </button>
            <button class="btn btn-secondary" onclick="openAddToListModal(${content.id})">
                📝 Özel Listeye Ekle
            </button>
        `;
        
        // Platform Puanı - Belirgin gösterim
        const platformRating = content.average_rating ? content.average_rating.toFixed(1) : '0.0';
        const totalRatings = content.total_ratings || 0;
        const ratingStars = content.average_rating ? Math.round(content.average_rating / 2) : 0;
        const starsHTML = '★'.repeat(ratingStars) + '☆'.repeat(5 - ratingStars);
        
        modalBody.innerHTML = `
            <div class="modal-detail">
                <img src="${posterUrl}" alt="${content.title}" class="modal-poster">
                <div class="modal-info">
                    <h2>${content.title}</h2>
                    
                    <!-- Platform Puanı - Belirgin Bölüm -->
                    <div class="platform-rating-section">
                        <div class="platform-rating-main">
                            <span class="platform-rating-score">${platformRating}</span>
                            <span class="platform-rating-max">/10</span>
                        </div>
                        <div class="platform-rating-stars">${starsHTML}</div>
                        <div class="platform-rating-count">${totalRatings} kullanıcı oyladı</div>
                    </div>
                    
                    <!-- Meta Veriler -->
                    <div class="modal-meta">
                        <div class="meta-item">
                            <strong>📅 Yayın Tarihi:</strong>
                            <span>${content.release_date || content.published_date || 'Bilinmiyor'}</span>
                        </div>
                        ${movieSpecific}
                        ${bookSpecific}
                    </div>
                    
                    <!-- Açıklama -->
                    <div class="modal-description-section">
                        <h3>📖 Özet</h3>
                        <p class="modal-description">${content.description || 'Açıklama bulunmuyor.'}</p>
                    </div>
                    
                    <!-- Kullanıcı Eylem Butonları -->
                    <div class="modal-actions">
                        <h3>📚 Kütüphanem</h3>
                        <div class="action-buttons-group">
                            ${statusButtons}
                        </div>
                    </div>
                    
                    <!-- Puanlama Bölümü -->
                    <div class="rating-section">
                        <h3>⭐ Puanlama</h3>
                        <div class="rating-input">
                            <input type="number" id="rating-value" min="1" max="10" step="0.5" placeholder="1-10 arası puan verin">
                            <button class="btn btn-primary" onclick="submitRating(${content.id})">
                                Puanla
                            </button>
                        </div>
                    </div>
                    
                    <!-- Yorumlar Bölümü -->
                    <div class="review-section">
                        <h3>💬 Yorumlar</h3>
                        <div class="review-input">
                            <textarea id="review-text" placeholder="Bu içerik hakkında ne düşünüyorsunuz? Yorumunuzu yazın..."></textarea>
                            <button class="btn btn-primary" onclick="submitReview(${content.id})">
                                Yorum Yap
                            </button>
                        </div>
                        
                        <div id="reviews-list" class="review-list" style="margin-top: 2rem;">
                            <div class="loading">Yorumlar yükleniyor...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Yorumları yükle
        loadContentReviews(content.id);
    } catch (error) {
        modalBody.innerHTML = '<p class="text-center">İçerik detayları yüklenirken bir hata oluştu.</p>';
        showToast(error.message, 'error');
    }
}

async function loadContentReviews(contentId) {
    const reviewsList = document.getElementById('reviews-list');
    
    try {
        const reviews = await getContentReviews(contentId);
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Henüz yorum yok. İlk yorumu siz yapın!</p>';
            return;
        }
        
        reviewsList.innerHTML = reviews.map(review => {
            const isOwner = currentUser && review.user_id === currentUser.id;
            const editDeleteButtons = isOwner ? `
                <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;" onclick="editReviewPrompt(${review.id}, '${review.text.replace(/'/g, "\\'")}')">
                    ✏️ Düzenle
                </button>
                <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--danger-color);" onclick="deleteReviewConfirm(${review.id}, ${contentId})">
                    🗑️ Sil
                </button>
            ` : '';
            
            return `
                <div class="review-item">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <strong>${review.username}</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            ${editDeleteButtons}
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); margin: 0.5rem 0;">${review.text}</p>
                    <small style="color: var(--text-muted);">${formatDate(review.created_at)}</small>
                </div>
            `;
        }).join('');
    } catch (error) {
        reviewsList.innerHTML = '<p style="text-align: center; color: var(--danger-color);">Yorumlar yüklenemedi.</p>';
    }
}

async function editReviewPrompt(reviewId, currentText) {
    const newText = prompt('Yorumunuzu düzenleyin:', currentText);
    
    if (newText === null) return; // İptal
    
    if (!newText || newText.trim().length < 1) {
        showToast('Yorum boş olamaz', 'error');
        return;
    }
    
    try {
        await updateReview(reviewId, newText);
        showToast('Yorum güncellendi!', 'success');
        
        // Modal'ı yenile
        const contentModal = document.getElementById('content-modal');
        if (contentModal.classList.contains('active')) {
            const modalBody = document.getElementById('modal-body');
            const contentId = parseInt(modalBody.querySelector('[onclick*="loadContentReviews"]')?.getAttribute('onclick')?.match(/\d+/)?.[0] || 0);
            if (contentId) {
                loadContentReviews(contentId);
            }
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteReviewConfirm(reviewId, contentId) {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        await deleteReview(reviewId);
        showToast('Yorum silindi!', 'success');
        loadContentReviews(contentId);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Movie Modal (Keep for backward compatibility)
async function openMovieModal(tmdbId) {
    const modal = document.getElementById('content-modal');
    const modalBody = document.getElementById('modal-body');
    
    modal.classList.add('active');
    showLoading(modalBody);
    
    try {
        const movie = await getMovieDetails(tmdbId);
        
        const posterUrl = movie.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Image';
        
        modalBody.innerHTML = `
            <div class="modal-detail">
                <img src="${posterUrl}" alt="${movie.title}" class="modal-poster">
                <div class="modal-info">
                    <h2>${movie.title}</h2>
                    <div class="modal-meta">
                        <span>📅 ${movie.release_date || 'Bilinmiyor'}</span>
                        <span>⭐ ${movie.average_rating.toFixed(1)}/10</span>
                        <span>⏱️ ${movie.runtime || '-'} dk</span>
                    </div>
                    ${movie.director ? `<p><strong>Yönetmen:</strong> ${movie.director}</p>` : ''}
                    ${movie.cast ? `<p><strong>Oyuncular:</strong> ${movie.cast}</p>` : ''}
                    ${movie.genres ? `<p><strong>Türler:</strong> ${movie.genres}</p>` : ''}
                    <p class="modal-description">${movie.description || 'Açıklama bulunmuyor.'}</p>
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="addToLibraryFromModal(${movie.id}, 'watched')">
                            ✓ İzledim
                        </button>
                        <button class="btn btn-secondary" onclick="addToLibraryFromModal(${movie.id}, 'to_watch')">
                            + İzlenecekler
                        </button>
                    </div>
                    
                    <div class="rating-section">
                        <h3>Puanlama</h3>
                        <div class="rating-input">
                            <input type="number" id="rating-value" min="1" max="10" step="0.5" placeholder="1-10">
                            <button class="btn btn-primary" onclick="submitRating(${movie.id})">
                                Puanla
                            </button>
                        </div>
                    </div>
                    
                    <div class="review-section">
                        <h3>Yorum Yap</h3>
                        <div class="review-input">
                            <textarea id="review-text" placeholder="Yorumunuzu yazın..."></textarea>
                            <button class="btn btn-primary" onclick="submitReview(${movie.id})">
                                Yorum Yap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = '<p class="text-center">Film detayları yüklenirken bir hata oluştu.</p>';
        showToast(error.message, 'error');
    }
}

async function openBookModal(googleBooksId) {
    const modal = document.getElementById('content-modal');
    const modalBody = document.getElementById('modal-body');
    
    modal.classList.add('active');
    showLoading(modalBody);
    
    try {
        const book = await getBookDetails(googleBooksId);
        
        const posterUrl = book.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Image';
        
        modalBody.innerHTML = `
            <div class="modal-detail">
                <img src="${posterUrl}" alt="${book.title}" class="modal-poster">
                <div class="modal-info">
                    <h2>${book.title}</h2>
                    <div class="modal-meta">
                        <span>📅 ${book.published_date || 'Bilinmiyor'}</span>
                        <span>⭐ ${book.average_rating.toFixed(1)}/10</span>
                        ${book.page_count ? `<span>📄 ${book.page_count} sayfa</span>` : ''}
                    </div>
                    ${book.authors ? `<p><strong>Yazar:</strong> ${book.authors}</p>` : ''}
                    ${book.publisher ? `<p><strong>Yayınevi:</strong> ${book.publisher}</p>` : ''}
                    ${book.categories ? `<p><strong>Kategoriler:</strong> ${book.categories}</p>` : ''}
                    <p class="modal-description">${book.description || 'Açıklama bulunmuyor.'}</p>
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="addToLibraryFromModal(${book.id}, 'read')">
                            ✓ Okudum
                        </button>
                        <button class="btn btn-secondary" onclick="addToLibraryFromModal(${book.id}, 'to_read')">
                            + Okunacaklar
                        </button>
                    </div>
                    
                    <div class="rating-section">
                        <h3>Puanlama</h3>
                        <div class="rating-input">
                            <input type="number" id="rating-value" min="1" max="10" step="0.5" placeholder="1-10">
                            <button class="btn btn-primary" onclick="submitRating(${book.id})">
                                Puanla
                            </button>
                        </div>
                    </div>
                    
                    <div class="review-section">
                        <h3>Yorum Yap</h3>
                        <div class="review-input">
                            <textarea id="review-text" placeholder="Yorumunuzu yazın..."></textarea>
                            <button class="btn btn-primary" onclick="submitReview(${book.id})">
                                Yorum Yap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = '<p class="text-center">Kitap detayları yüklenirken bir hata oluştu.</p>';
        showToast(error.message, 'error');
    }
}

async function addToLibraryFromModal(contentId, status) {
    try {
        await addToLibrary(contentId, status);
        showToast('Kütüphaneye eklendi!', 'success');
        
        // Cache'i temizle
        libraryCache = {};
        
        // Kütüphane sayfası açıksa yenile
        const libraryPage = document.getElementById('library-page');
        if (libraryPage.classList.contains('active')) {
            // Aktif tab'ı bul
            const activeTab = document.querySelector('.library-tabs .tab-btn.active');
            const activeStatus = activeTab ? activeTab.dataset.status : 'all';
            await loadLibraryContent(activeStatus === 'all' ? null : activeStatus);
        }
        
        // Profil istatistiklerini yenile
        const profilePage = document.getElementById('profile-page');
        if (profilePage.classList.contains('active')) {
            await loadProfileStats();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function submitRating(contentId) {
    const ratingValue = document.getElementById('rating-value').value;
    
    if (!ratingValue || ratingValue < 1 || ratingValue > 10) {
        showToast('Lütfen 1-10 arası bir puan girin', 'error');
        return;
    }
    
    try {
        await addRating(contentId, ratingValue);
        showToast('Puanlama başarılı!', 'success');
        document.getElementById('rating-value').value = '';
        
        // Profil istatistiklerini yenile (eğer profil sayfasındaysak)
        const profilePage = document.getElementById('profile-page');
        if (profilePage.classList.contains('active')) {
            await loadProfileStats();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function submitReview(contentId) {
    const reviewText = document.getElementById('review-text').value;
    
    if (!reviewText || reviewText.trim().length < 1) {
        showToast('Lütfen bir yorum yazın', 'error');
        return;
    }
    
    try {
        await addReview(contentId, reviewText);
        showToast('Yorum eklendi!', 'success');
        document.getElementById('review-text').value = '';
        
        // Yorumları yenile
        loadContentReviews(contentId);
        
        // Profil istatistiklerini yenile (eğer profil sayfasındaysak)
        const profilePage = document.getElementById('profile-page');
        if (profilePage.classList.contains('active')) {
            await loadProfileStats();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Token ve kullanıcı bilgisini localStorage'dan yükle
    authToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            console.error('CurrentUser parse hatası:', e);
            currentUser = null;
        }
    }
    
    // URL'den token'ı kontrol et (şifre sıfırlama için)
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
        // Şifre sıfırlama sayfasını göster
        showPage('auth');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'block';
        
        // Token'ı form'a sakla
        const resetForm = document.getElementById('resetPasswordForm');
        resetForm.dataset.token = resetToken;
        
        // Event listener'ı hemen burada attach et
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = e.target.dataset.token;
            const newPassword = document.getElementById('reset-password').value;
            const newPasswordConfirm = document.getElementById('reset-password-confirm').value;
            
            // Token kontrolü
            if (!token) {
                showToast('Şifre sıfırlama token\'ı bulunamadı. Lütfen email\'deki linke tekrar tıklayın.', 'error');
                return;
            }
            
            // Frontend validasyonu
            if (newPassword.length < 6) {
                showToast('Şifre en az 6 karakter olmalıdır', 'error');
                return;
            }
            
            if (newPassword !== newPasswordConfirm) {
                showToast('Şifreler eşleşmiyor. Lütfen aynı şifreyi girin.', 'error');
                document.getElementById('reset-password-confirm').value = '';
                document.getElementById('reset-password-confirm').focus();
                return;
            }
            
            try {
                await resetPassword(token, newPassword, newPasswordConfirm);
                showToast('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.', 'success');
                
                // Form'u temizle ve login'e dön
                document.getElementById('reset-password').value = '';
                document.getElementById('reset-password-confirm').value = '';
                document.getElementById('reset-password-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                
                // URL'den token'ı temizle
                window.history.pushState({}, document.title, window.location.pathname);
            } catch (error) {
                let errorMessage = error.message;
                if (errorMessage.includes('Geçersiz') || errorMessage.includes('süresi dolmuş')) {
                    errorMessage = 'Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir link isteyin.';
                }
                showToast(errorMessage, 'error');
            }
        }, { once: true });
        
        return;
    }
    
    // Check if user is logged in (zaten yukledik yukarida)
    if (authToken && currentUser) {
        showPage('home');
    } else {
        showPage('auth');
    }
    
    // Auth form handlers
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Frontend validasyonu
        if (!email) {
            showToast('Lütfen e-posta adresinizi girin', 'error');
            return;
        }
        
        if (!password) {
            showToast('Lütfen şifrenizi girin', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır', 'error');
            return;
        }
        
        try {
            await login(email, password);
            showToast('Hoş geldiniz!', 'success');
            showPage('home');
        } catch (error) {
            // Daha kullanıcı dostu hata mesajları
            let errorMessage = error.message;
            if (errorMessage.includes('hatalı') || errorMessage.includes('incorrect')) {
                errorMessage = 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
            }
            showToast(errorMessage, 'error');
            
            // Şifre alanını temizle
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        }
    });
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        
        // Frontend validasyonu
        if (!username || username.length < 3) {
            showToast('Kullanıcı adı en az 3 karakter olmalıdır', 'error');
            return;
        }
        
        if (!email) {
            showToast('Lütfen e-posta adresinizi girin', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showToast('Şifreler eşleşmiyor. Lütfen aynı şifreyi girin.', 'error');
            document.getElementById('register-password-confirm').value = '';
            document.getElementById('register-password-confirm').focus();
            return;
        }
        
        try {
            await register(username, email, password, passwordConfirm);
            showToast('Kayıt başarılı! Hoş geldiniz! 🎉', 'success');
            showPage('home');
        } catch (error) {
            // Daha kullanıcı dostu hata mesajları
            let errorMessage = error.message;
            if (errorMessage.includes('zaten kullanımda') || errorMessage.includes('already')) {
                if (errorMessage.includes('e-posta') || errorMessage.includes('email')) {
                    errorMessage = 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya başka bir e-posta kullanın.';
                } else if (errorMessage.includes('kullanıcı adı') || errorMessage.includes('username')) {
                    errorMessage = 'Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı deneyin.';
                }
            }
            showToast(errorMessage, 'error');
        }
    });
    
    // Forgot Password Form
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();
        
        try {
            await forgotPassword(email);
            showToast('Şifre sıfırlama linki e-posta adresinize gönderildi', 'success');
            // Form'u temizle ve login'e dön
            document.getElementById('forgot-email').value = '';
            document.getElementById('forgot-password-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        } catch (error) {
            showToast(error.message || 'Bir hata oluştu', 'error');
        }
    });
    
    // Reset Password Form event listener artık token bulunduğunda inline olarak attach ediliyor (yukarıda)
    
    // Toggle between forms
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('forgot-password-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'none';
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('forgot-password-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'none';
    });
    
    document.getElementById('show-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'block';
        document.getElementById('reset-password-form').style.display = 'none';
    });
    
    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'none';
    });
    
    document.getElementById('back-to-login-from-reset').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('reset-password-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('forgot-password-form').style.display = 'none';
        
        // URL'den token'ı temizle
        window.history.pushState({}, document.title, window.location.pathname);
    });
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            showPage(page);
        });
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Explore tabs
    document.querySelectorAll('.explore-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.explore-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentExploreTab = btn.dataset.tab;
            loadExploreContent();
        });
    });
    
    // Explore search
    document.getElementById('explore-search-btn').addEventListener('click', () => {
        const query = document.getElementById('explore-search').value;
        if (query) {
            loadExploreContent(query);
        }
    });
    
    document.getElementById('explore-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value;
            if (query) {
                loadExploreContent(query);
            }
        }
    });
    
    // Filtre toggle
    document.getElementById('toggle-filters-btn').addEventListener('click', () => {
        const filtersPanel = document.getElementById('filters-panel');
        if (filtersPanel.style.display === 'none') {
            filtersPanel.style.display = 'grid';
        } else {
            filtersPanel.style.display = 'none';
        }
    });
    
    // Filtre uygula
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        currentFilters.genre = document.getElementById('filter-genre').value;
        currentFilters.yearMin = document.getElementById('filter-year-min').value;
        currentFilters.yearMax = document.getElementById('filter-year-max').value;
        currentFilters.rating = document.getElementById('filter-rating').value;
        
        loadExploreContent(currentExploreQuery);
        showToast('Filtreler uygulandı', 'success');
    });
    
    // Filtreleri temizle
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        currentFilters = {
            genre: '',
            yearMin: '',
            yearMax: '',
            rating: ''
        };
        
        document.getElementById('filter-genre').value = '';
        document.getElementById('filter-year-min').value = '';
        document.getElementById('filter-year-max').value = '';
        document.getElementById('filter-rating').value = '';
        
        loadExploreContent(currentExploreQuery);
        showToast('Filtreler temizlendi', 'success');
    });
    
    // Library tabs (Library Page)
    document.querySelectorAll('#library-page .library-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#library-page .library-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.status;
            loadLibraryContent(status === 'all' ? null : status);
        });
    });
    
    // Profile Library tabs (Profile Page)
    document.querySelectorAll('#profile-page .library-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#profile-page .library-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.status;
            loadProfileLibraryContent(status === 'all' ? null : status);
        });
    });
    
    // Modal close
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('content-modal').classList.remove('active');
    });
    
    // Close modal on outside click
    document.getElementById('content-modal').addEventListener('click', (e) => {
        if (e.target.id === 'content-modal') {
            document.getElementById('content-modal').classList.remove('active');
        }
    });
    
    // Comment modal outside click
    document.getElementById('comment-modal').addEventListener('click', (e) => {
        if (e.target.id === 'comment-modal') {
            closeCommentModal();
        }
    });
    
    // Share modal outside click
    document.getElementById('share-modal').addEventListener('click', (e) => {
        if (e.target.id === 'share-modal') {
            closeShareModal();
        }
    });
    
    // List detail modal outside click
    document.getElementById('list-detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'list-detail-modal') {
            closeListDetailModal();
        }
    });
    
    // Add to List modal outside click
    document.getElementById('add-to-list-modal').addEventListener('click', (e) => {
        if (e.target.id === 'add-to-list-modal') {
            closeAddToListModal();
        }
    });
    
    // Edit Profile modal outside click
    document.getElementById('edit-profile-modal').addEventListener('click', (e) => {
        if (e.target.id === 'edit-profile-modal') {
            closeEditProfileModal();
        }
    });
    
    // Edit Profile button
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        openEditProfileModal();
    });
    
    // Bio character counter
    document.getElementById('edit-bio').addEventListener('input', updateBioCharCount);
    
    // Create List button
    document.getElementById('create-list-btn').addEventListener('click', () => {
        openCreateListModal();
    });
    
    // Follow/Unfollow buttons
    document.getElementById('follow-btn').addEventListener('click', async () => {
        const username = document.getElementById('profile-username').textContent;
        await followUser(username);
    });
    
    document.getElementById('unfollow-btn').addEventListener('click', async () => {
        const username = document.getElementById('profile-username').textContent;
        await unfollowUser(username);
    });
});

// =====================================================
// PROFILE EDIT FUNCTIONS
// =====================================================

async function updateUserProfile(bio) {
    return await apiCall('/users/me', 'PUT', { bio });
}

function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        showToast('Kullanıcı bilgileri bulunamadı', 'error');
        return;
    }
    
    // Form'u doldur
    document.getElementById('edit-username').value = currentUser.username;
    document.getElementById('edit-email').value = currentUser.email;
    document.getElementById('edit-bio').value = currentUser.bio || '';
    updateBioCharCount();
    
    modal.classList.add('active');
}

function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('active');
}

function updateBioCharCount() {
    const bioTextarea = document.getElementById('edit-bio');
    const charCount = document.getElementById('bio-char-count');
    if (bioTextarea && charCount) {
        charCount.textContent = `${bioTextarea.value.length} / 500 karakter`;
    }
}

async function submitProfileEdit(event) {
    event.preventDefault();
    
    const bio = document.getElementById('edit-bio').value.trim();
    
    try {
        const updatedUser = await updateUserProfile(bio);
        
        // LocalStorage'ı güncelle
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Profil sayfasını güncelle
        document.getElementById('profile-bio').textContent = bio || 'Henüz biyografi eklenmemiş.';
        
        showToast('Profiliniz güncellendi!', 'success');
        closeEditProfileModal();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// =====================================================
// CUSTOM LISTS FUNCTIONS
// =====================================================
let currentContentIdForList = null;

// API Functions
async function getUserCustomLists() {
    return await apiCall('/lists/me');
}

async function getCustomListDetails(listId) {
    return await apiCall(`/lists/${listId}`);
}

async function createCustomList(name, description = '', isPublic = true) {
    return await apiCall('/lists/', 'POST', {
        name,
        description,
        is_public: isPublic
    });
}

async function updateCustomList(listId, name, description = '', isPublic = true) {
    return await apiCall(`/lists/${listId}`, 'PUT', {
        name,
        description,
        is_public: isPublic
    });
}

async function deleteCustomList(listId) {
    return await apiCall(`/lists/${listId}`, 'DELETE');
}

async function removeContentFromList(listId, contentId) {
    return await apiCall(`/lists/${listId}/items/${contentId}`, 'DELETE');
}

async function addContentToList(listId, contentId) {
    return await apiCall(`/lists/${listId}/items`, 'POST', {
        content_id: contentId
    });
}

async function getListDetails(listId) {
    return await apiCall(`/lists/${listId}`);
}

// Modal Functions
async function openAddToListModal(contentId) {
    currentContentIdForList = contentId;
    const modal = document.getElementById('add-to-list-modal');
    const container = document.getElementById('custom-lists-container');
    
    modal.classList.add('active');
    container.innerHTML = '<div class="loading">Listeler yükleniyor...</div>';
    
    try {
        const lists = await getUserCustomLists();
        
        if (lists.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Henüz listeniz yok. Yeni bir liste oluşturun!</p>';
            return;
        }
        
        container.innerHTML = lists.map(list => `
            <div class="list-item" onclick="addToSelectedList(${list.id}, '${list.name.replace(/'/g, "\\'")}')">
                <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 0.5rem; cursor: pointer; transition: all 0.3s;">
                    <span style="font-size: 1.5rem;">📝</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary);">${list.name}</div>
                        ${list.description ? `<div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">${list.description}</div>` : ''}
                    </div>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">${list.items?.length || 0} içerik</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: var(--danger-color);">Listeler yüklenirken hata oluştu.</p>';
        showToast(error.message, 'error');
    }
}

function closeAddToListModal() {
    document.getElementById('add-to-list-modal').classList.remove('active');
    currentContentIdForList = null;
}

async function addToSelectedList(listId, listName) {
    if (!currentContentIdForList) {
        showToast('İçerik ID bulunamadı', 'error');
        return;
    }
    
    try {
        await addContentToList(listId, currentContentIdForList);
        showToast(`"${listName}" listesine eklendi!`, 'success');
        closeAddToListModal();
    } catch (error) {
        if (error.message.includes('zaten listede')) {
            showToast('Bu içerik zaten bu listede', 'error');
        } else {
            showToast(error.message, 'error');
        }
    }
}

function openCreateListModal() {
    currentContentIdForList = null; // Profil sayfasından çağrıldığında içerik yok
    const modal = document.getElementById('add-to-list-modal');
    modal.classList.add('active');
    showCreateListForm();
}

async function showCreateListForm() {
    const container = document.getElementById('custom-lists-container');
    
    const cancelAction = currentContentIdForList 
        ? `openAddToListModal(${currentContentIdForList})`
        : `closeAddToListModal()`;
    
    const submitButtonText = currentContentIdForList 
        ? '✓ Oluştur ve Ekle'
        : '✓ Oluştur';
    
    container.innerHTML = `
        <form id="create-list-form" onsubmit="submitCreateList(event)" style="padding: 1rem; background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 0.5rem;">
            <div class="form-group">
                <label>Liste Adı *</label>
                <input type="text" id="new-list-name" required minlength="1" maxlength="100" placeholder="Örn: Favori Filmlerim" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem; background: var(--darker-bg); color: var(--text-primary);">
            </div>
            <div class="form-group">
                <label>Açıklama (Opsiyonel)</label>
                <textarea id="new-list-description" rows="3" placeholder="Liste hakkında kısa bir açıklama..." style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem; background: var(--darker-bg); color: var(--text-primary); resize: vertical;"></textarea>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <input type="checkbox" id="new-list-public" checked style="width: 20px; height: 20px;">
                <label for="new-list-public" style="margin: 0; cursor: pointer;">Herkes görebilsin</label>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button type="submit" class="btn btn-primary" style="flex: 1;">
                    ${submitButtonText}
                </button>
                <button type="button" class="btn btn-secondary" onclick="${cancelAction}">
                    İptal
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('new-list-name').focus();
}

async function submitCreateList(event) {
    event.preventDefault();
    
    const name = document.getElementById('new-list-name').value.trim();
    const description = document.getElementById('new-list-description').value.trim();
    const isPublic = document.getElementById('new-list-public').checked;
    
    if (!name) {
        showToast('Liste adı gerekli', 'error');
        return;
    }
    
    try {
        const newList = await createCustomList(name, description, isPublic);
        showToast(`"${name}" listesi oluşturuldu!`, 'success');
        
        // İçeriği hemen bu listeye ekle (eğer içerik varsa)
        if (currentContentIdForList) {
            await addContentToList(newList.id, currentContentIdForList);
            showToast(`İçerik "${name}" listesine eklendi!`, 'success');
        }
        
        closeAddToListModal();
        
        // Profil sayfasını yenile (eğer profil sayfasındaysak)
        const currentPage = document.querySelector('.page.active').id;
        if (currentPage === 'profile-page') {
            await loadUserCustomLists();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

