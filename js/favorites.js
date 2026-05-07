const API_URL = 'http://localhost:3000';

function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

function getTranslatedValue(obj, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object' && obj[currentLang]) return obj[currentLang];
    if (typeof obj === 'object' && obj['en']) return obj['en'];
    
    return String(obj);
}

function getImagePath(imagePath) {
    if (!imagePath) return '../assets/images/chair.png';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return imagePath;
    return '../' + imagePath;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="star">★</span>';
    }
    for (let i = fullStars; i < 5; i++) {
        stars += '<span class="star">☆</span>';
    }
    return stars;
}

function getCategoryLabel(categoryValue, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    
    const categories = {
        'en': {
            'sofa': 'Sofas',
            'living': 'Living Room',
            'kitchen': 'Kitchen',
            'bedroom': 'Bedroom',
            'bathroom': 'Bathroom',
            'decor': 'Decor',
            'ceramics': 'Ceramics'
        },
        'ru': {
            'sofa': 'Диваны',
            'living': 'Гостиная',
            'kitchen': 'Кухня',
            'bedroom': 'Спальня',
            'bathroom': 'Ванная',
            'decor': 'Декор',
            'ceramics': 'Керамика'
        }
    };
    
    return categories[currentLang]?.[categoryValue] || categoryValue;
}

function showMessage(message, isError = false) {
    const existingMsg = document.querySelector('.message-popup');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = 'message-popup';
    msg.textContent = message;
    if (isError) {
        msg.style.background = '#c62828';
    }
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.remove();
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadFavorites() {
    try {
        const container = document.getElementById('favoritesContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="empty-favorites"><h2>⏳ Загрузка...</h2></div>';
        
        const response = await fetch(`${API_URL}/favorites`);
        const favorites = await response.json();
        
        if (!favorites || favorites.length === 0) {
            const currentLang = getCurrentLanguage();
            const emptyTitle = currentLang === 'ru' ? '😔 В избранном пока пусто' : '😔 Favorites is empty';
            const emptyText = currentLang === 'ru' ? 'Добавляйте товары в избранное, чтобы они появились здесь' : 'Add items to favorites to see them here';
            const goToCatalogText = currentLang === 'ru' ? 'Перейти в каталог' : 'Go to catalog';
            
            container.innerHTML = `
                <div class="empty-favorites">
                    <h2>${emptyTitle}</h2>
                    <p>${emptyText}</p>
                    <a href="catalog.html" class="back-link" data-i18n="go-to-catalog">${goToCatalogText}</a>
                </div>
            `;
            return;
        }
        
        const productPromises = favorites.map(fav => 
            fetch(`${API_URL}/products/${fav.productId}`).then(res => {
                if (!res.ok) throw new Error(`Товар ${fav.productId} не найден`);
                return res.json();
            })
        );
        
        const products = await Promise.all(productPromises);
        const currentLang = getCurrentLanguage();
        
        container.innerHTML = products.map(product => {
            const productName = getTranslatedValue(product.name, currentLang);
            const categoryName = getCategoryLabel(product.category, currentLang);
            const stockText = product.inStock ? (currentLang === 'ru' ? '✓ В наличии' : '✓ In stock') : (currentLang === 'ru' ? '✗ Нет в наличии' : '✗ Out of stock');
            
            return `
                <div class="favorite-card" data-id="${product.id}">
                    <div class="card-image">
                        <img src="${getImagePath(product.image)}" alt="${escapeHtml(productName)}" onerror="this.src='../assets/images/chair.png'">
                        <button class="remove-fav-btn" onclick="removeFromFavorites(${product.id})" title="${currentLang === 'ru' ? 'Удалить из избранного' : 'Remove from favorites'}">
                            🗑️
                        </button>
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${escapeHtml(productName)}</h3>
                        <div class="card-category">${categoryName}</div>
                        <div class="card-price">£${product.price.toFixed(2)}</div>
                        <div class="card-rating">${generateStars(product.rating)}</div>
                        <span class="card-stock ${product.inStock ? 'in-stock' : 'out-stock'}">
                            ${stockText}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        showMessage('Ошибка загрузки избранного. Проверьте подключение к серверу.', true);
        
        const container = document.getElementById('favoritesContainer');
        if (container) {
            const currentLang = getCurrentLanguage();
            const errorTitle = currentLang === 'ru' ? '⚠️ Ошибка загрузки' : '⚠️ Loading error';
            const errorText = currentLang === 'ru' ? 'Не удалось загрузить избранное. Убедитесь, что сервер запущен.' : 'Failed to load favorites. Make sure the server is running.';
            const goToCatalogText = currentLang === 'ru' ? 'Перейти в каталог' : 'Go to catalog';
            
            container.innerHTML = `
                <div class="empty-favorites">
                    <h2>${errorTitle}</h2>
                    <p>${errorText}</p>
                    <a href="catalog.html" class="back-link">${goToCatalogText}</a>
                </div>
            `;
        }
    }
}

async function removeFromFavorites(productId) {
    try {
        const favResponse = await fetch(`${API_URL}/favorites`);
        const favorites = await favResponse.json();
        
        const favItem = favorites.find(f => f.productId === productId);
        
        if (!favItem) {
            showMessage('Товар не найден в избранном', true);
            return;
        }
        
        await fetch(`${API_URL}/favorites/${favItem.id}`, { 
            method: 'DELETE' 
        });
        
        await fetch(`${API_URL}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFavorite: false })
        });
        
        const currentLang = getCurrentLanguage();
        const removeMessage = currentLang === 'ru' ? '❤️ Товар удален из избранного' : '❤️ Item removed from favorites';
        showMessage(removeMessage);
        loadFavorites();
        
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showMessage('Ошибка при удалении товара', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница избранного загружена');
    loadFavorites();
});

window.removeFromFavorites = removeFromFavorites;

function checkAdminAccessForMenu() {
    const savedUser = localStorage.getItem('currentUser');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const profileMenuItem = document.getElementById('profileMenuItem');
    
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
            if (adminMenuItem) adminMenuItem.style.display = 'block';
            if (profileMenuItem) profileMenuItem.style.display = 'none';
        } else {
            if (adminMenuItem) adminMenuItem.style.display = 'none';
            if (profileMenuItem) profileMenuItem.style.display = 'block';
        }
    } else {
        if (adminMenuItem) adminMenuItem.style.display = 'none';
        if (profileMenuItem) profileMenuItem.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccessForMenu();
    loadFavorites();
});

window.addEventListener('storage', (event) => {
    if (event.key === 'language') {
        loadFavorites();
    }
});