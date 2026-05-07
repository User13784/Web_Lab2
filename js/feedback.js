const API_URL = 'http://localhost:3000';
let currentUser = null;

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

function showMessage(message, type = 'info') {
    const existingMsg = document.querySelector('.message-popup');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = `message-popup ${type === 'error' ? 'error' : (type === 'success' ? 'success' : '')}`;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => msg.remove(), 3000);
}

function checkAdminMenu() {
    const savedUser = localStorage.getItem('currentUser');
    const adminMenuItem = document.getElementById('adminMenuItem');
    
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'admin') {
            if (adminMenuItem) adminMenuItem.style.display = 'block';
        } else {
            if (adminMenuItem) adminMenuItem.style.display = 'none';
        }
    } else {
        if (adminMenuItem) adminMenuItem.style.display = 'none';
    }
}

async function loadProductsForSelect() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const select = document.getElementById('productSelect');
        if (select) {
            select.innerHTML = '<option value="">-- Выберите товар --</option>';
            
            let availableProducts = products;
            
            if (currentUser && currentUser.role !== 'admin') {
                const ordersResponse = await fetch(`${API_URL}/orders?userId=${currentUser.id}`);
                const userOrders = await ordersResponse.json();
                const purchasedProductIds = new Set();
                
                userOrders.forEach(order => {
                    if (order.items) {
                        order.items.forEach(item => {
                            purchasedProductIds.add(item.productId);
                        });
                    }
                });
                
                if (purchasedProductIds.size > 0) {
                    availableProducts = products.filter(p => purchasedProductIds.has(p.id));
                } else {
                    availableProducts = [];
                    const msg = getCurrentLanguage() === 'ru' 
                        ? 'Вы еще не совершали покупок. Чтобы оставить отзыв, сначала купите товар.'
                        : 'You haven\'t made any purchases yet. To leave a review, please buy a product first.';
                    showMessage(msg, 'error');
                }
            }
            
            if (availableProducts.length === 0) {
                const msg = getCurrentLanguage() === 'ru'
                    ? '-- Нет доступных товаров для отзыва --'
                    : '-- No products available for review --';
                select.innerHTML = `<option value="">${msg}</option>`;
                const submitBtn = document.getElementById('submitReviewBtn');
                if (submitBtn) submitBtn.disabled = true;
            } else {
                const currentLang = getCurrentLanguage();
                availableProducts.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    const productName = getTranslatedValue(product.name, currentLang);
                    option.textContent = `${productName} - £${product.price}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

async function loadProductsForFilter() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const filterSelect = document.getElementById('filterProduct');
        if (filterSelect) {
            const currentLang = getCurrentLanguage();
            
            filterSelect.innerHTML = '';
            
            const allOption = document.createElement('option');
            allOption.value = 'all';
            allOption.textContent = currentLang === 'ru' ? 'Все товары' : 'All products';
            filterSelect.appendChild(allOption);
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                const productName = getTranslatedValue(product.name, currentLang);
                option.textContent = productName;
                filterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров для фильтра:', error);
    }
}

function translateRatingFilter() {
    const ratingSelect = document.getElementById('filterRating');
    if (!ratingSelect) return;
    
    const currentLang = getCurrentLanguage();
    
    const ratingOptions = {
        'all': { ru: 'Все рейтинги', en: 'All ratings' },
        '5': { ru: '★★★★★ (5)', en: '★★★★★ (5)' },
        '4': { ru: '★★★★☆ (4+)', en: '★★★★☆ (4+)' },
        '3': { ru: '★★★☆☆ (3+)', en: '★★★☆☆ (3+)' },
        '2': { ru: '★★☆☆☆ (2+)', en: '★★☆☆☆ (2+)' },
        '1': { ru: '★☆☆☆☆ (1+)', en: '★☆☆☆☆ (1+)' }
    };
    
    const defaultValue = 'all';
    
    ratingSelect.innerHTML = '';
    
    Object.keys(ratingOptions).forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = ratingOptions[value][currentLang === 'ru' ? 'ru' : 'en'];
        ratingSelect.appendChild(option);
    });
    
    ratingSelect.value = defaultValue;
}

function resetRatingFilterToAll() {
    const ratingSelect = document.getElementById('filterRating');
    if (ratingSelect) {
        ratingSelect.value = 'all';
    }
}

async function loadReviews() {
    try {
        let productFilter = document.getElementById('filterProduct')?.value || 'all';
        let ratingFilter = document.getElementById('filterRating')?.value || 'all';
        
        if (!ratingFilter || ratingFilter === 'undefined') {
            ratingFilter = 'all';
            const ratingSelect = document.getElementById('filterRating');
            if (ratingSelect) ratingSelect.value = 'all';
        }
        
        const response = await fetch(`${API_URL}/feedback`);
        let reviews = await response.json();
        
        if (productFilter !== 'all') {
            reviews = reviews.filter(r => r.productId == productFilter);
        }
        
        if (ratingFilter !== 'all') {
            const minRating = parseInt(ratingFilter);
            reviews = reviews.filter(r => r.rating >= minRating);
        }
        
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        if (reviews.length === 0) {
            const currentLang = getCurrentLanguage();
            const noReviewsMsg = currentLang === 'ru' ? '💬 Пока нет отзывов. Будьте первым!' : '💬 No reviews yet. Be the first!';
            container.innerHTML = `<div class="no-reviews">${noReviewsMsg}</div>`;
            return;
        }
        
        const currentLang = getCurrentLanguage();
        
        container.innerHTML = reviews.map(review => {
            const productName = getTranslatedValue(review.productName, currentLang);
            const reviewText = getTranslatedValue(review.text, currentLang);
            
            return `
                <div class="review-card" data-id="${review.id}">
                    <div class="review-header">
                        <div class="review-user">
                            <div class="review-avatar">${review.userNickname ? review.userNickname.charAt(0).toUpperCase() : 'U'}</div>
                            <div class="review-user-info">
                                <span class="review-nickname">${escapeHtml(review.userNickname || 'Пользователь')}</span>
                                <span class="review-date">${formatDate(review.createdAt)}</span>
                            </div>
                        </div>
                        <div class="review-rating">
                            ${generateStars(review.rating)}
                        </div>
                    </div>
                    <div class="review-product">📦 ${escapeHtml(productName)}</div>
                    <div class="review-text">${escapeHtml(reviewText)}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        const container = document.getElementById('reviewsContainer');
        if (container) {
            const currentLang = getCurrentLanguage();
            const errorMsg = currentLang === 'ru' ? '❌ Ошибка загрузки отзывов' : '❌ Error loading reviews';
            container.innerHTML = `<div class="no-reviews">${errorMsg}</div>`;
        }
    }
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function hasUserPurchasedProduct(userId, productId) {
    try {
        const response = await fetch(`${API_URL}/orders?userId=${userId}`);
        const orders = await response.json();
        
        for (const order of orders) {
            if (order.items && order.items.some(item => item.productId == productId)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Ошибка проверки покупок:', error);
        return false;
    }
}

function validateFeedbackForm() {
    const productId = document.getElementById('productSelect').value;
    const rating = parseInt(document.getElementById('ratingValue').value);
    const reviewText = document.getElementById('reviewText').value.trim();
    
    let isValid = true;
    
    if (!productId) {
        showFieldError('productError', 'Выберите товар');
        isValid = false;
    } else {
        hideFieldError('productError');
    }
    
    if (rating === 0) {
        showFieldError('ratingError', 'Выберите рейтинг');
        isValid = false;
    } else {
        hideFieldError('ratingError');
    }
    
    if (reviewText.length < 50) {
        showFieldError('reviewError', `Отзыв должен содержать минимум 50 символов (сейчас ${reviewText.length})`);
        isValid = false;
    } else {
        hideFieldError('reviewError');
    }
    
    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn) {
        submitBtn.disabled = !isValid;
    }
    
    return isValid;
}

function showFieldError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function hideFieldError(errorId) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

function updateCharCount() {
    const textarea = document.getElementById('reviewText');
    const charCountSpan = document.getElementById('charCount');
    
    if (textarea && charCountSpan) {
        const length = textarea.value.length;
        charCountSpan.textContent = length;
        
        const charCounter = document.querySelector('.char-counter');
        if (charCounter) {
            if (length >= 50) {
                charCounter.classList.add('valid');
                charCounter.classList.remove('warning');
            } else {
                charCounter.classList.remove('valid');
                charCounter.classList.add('warning');
            }
        }
    }
}

function setupRatingStars() {
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('ratingValue');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            ratingInput.value = rating;
            
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.textContent = '★';
                    s.classList.add('active');
                } else {
                    s.textContent = '☆';
                    s.classList.remove('active');
                }
            });
            
            validateFeedbackForm();
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.textContent = '★';
                } else {
                    s.textContent = '☆';
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingInput.value);
            stars.forEach((s, index) => {
                if (index < currentRating) {
                    s.textContent = '★';
                } else {
                    s.textContent = '☆';
                }
            });
        });
    });
}

async function submitFeedback() {
    if (!currentUser) {
        const msg = getCurrentLanguage() === 'ru' ? 'Необходимо войти в аккаунт' : 'Please log in to your account';
        showMessage(msg, 'error');
        return;
    }
    
    if (currentUser.role === 'admin') {
        const msg = getCurrentLanguage() === 'ru' ? 'Администратор не может оставлять отзывы' : 'Admin cannot leave reviews';
        showMessage(msg, 'error');
        return;
    }
    
    const isValid = validateFeedbackForm();
    if (!isValid) return;
    
    const productId = parseInt(document.getElementById('productSelect').value);
    const rating = parseInt(document.getElementById('ratingValue').value);
    const reviewText = document.getElementById('reviewText').value.trim();
    
    const hasPurchased = await hasUserPurchasedProduct(currentUser.id, productId);
    if (!hasPurchased) {
        const msg = getCurrentLanguage() === 'ru' 
            ? 'Вы можете оставить отзыв только на товары, которые вы купили'
            : 'You can only leave reviews for products you have purchased';
        showMessage(msg, 'error');
        return;
    }
    
    const productResponse = await fetch(`${API_URL}/products/${productId}`);
    const product = await productResponse.json();
    
    const currentLang = getCurrentLanguage();
    const feedbackData = {
        id: Date.now(),
        userId: currentUser.id,
        userNickname: currentUser.nickname || `${currentUser.firstName} ${currentUser.lastName}`,
        productId: productId,
        productName: {
            en: product.name.en || product.name,
            ru: product.name.ru || product.name
        },
        rating: rating,
        text: {
            en: currentLang === 'en' ? reviewText : '',
            ru: currentLang === 'ru' ? reviewText : ''
        },
        createdAt: new Date().toISOString()
    };
    
    if (currentLang === 'ru') {
        feedbackData.text.en = reviewText;
    } else {
        feedbackData.text.ru = reviewText;
    }
    
    try {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        
        if (!response.ok) throw new Error('Ошибка отправки');
        
        const successMsg = currentLang === 'ru' ? '✅ Спасибо за ваш отзыв!' : '✅ Thank you for your review!';
        showMessage(successMsg, 'success');
        
        document.getElementById('productSelect').value = '';
        document.getElementById('ratingValue').value = '0';
        document.getElementById('reviewText').value = '';
        
        const stars = document.querySelectorAll('.rating-star');
        stars.forEach(star => {
            star.textContent = '☆';
            star.classList.remove('active');
        });
        
        updateCharCount();
        
        loadReviews();
        loadProductsForSelect();
        
    } catch (error) {
        console.error('Ошибка:', error);
        const errorMsg = getCurrentLanguage() === 'ru' ? 'Ошибка при отправке отзыва' : 'Error submitting review';
        showMessage(errorMsg, 'error');
    }
}

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    const authRequiredDiv = document.getElementById('authRequired');
    const feedbackFormDiv = document.getElementById('feedbackForm');
    const currentLang = getCurrentLanguage();
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        if (currentUser.role === 'admin') {
            if (authRequiredDiv) {
                authRequiredDiv.style.display = 'block';
                authRequiredDiv.innerHTML = currentLang === 'ru' 
                    ? '<p>🔒 Администраторы не могут оставлять отзывы</p>'
                    : '<p>🔒 Admins cannot leave reviews</p>';
            }
            if (feedbackFormDiv) feedbackFormDiv.style.display = 'none';
        } else {
            if (authRequiredDiv) authRequiredDiv.style.display = 'none';
            if (feedbackFormDiv) feedbackFormDiv.style.display = 'block';
            loadProductsForSelect();
        }
    } else {
        if (authRequiredDiv) {
            authRequiredDiv.style.display = 'block';
            authRequiredDiv.innerHTML = currentLang === 'ru'
                ? '<p>🔒 Для добавления отзыва необходимо <a href="register.html">войти в аккаунт</a></p>'
                : '<p>🔒 You need to <a href="register.html">log in</a> to leave a review</p>';
        }
        if (feedbackFormDiv) feedbackFormDiv.style.display = 'none';
    }
}

function translatePageStaticElements() {
    const currentLang = getCurrentLanguage();
    
    const leaveReviewTitle = document.querySelector('.feedback-form-container h2');
    if (leaveReviewTitle) {
        leaveReviewTitle.textContent = currentLang === 'ru' ? '📝 Оставить отзыв' : '📝 Leave a review';
    }
    
    const customerReviewsTitle = document.querySelector('.reviews-list h2');
    if (customerReviewsTitle) {
        customerReviewsTitle.textContent = currentLang === 'ru' ? '📖 Отзывы покупателей' : '📖 Customer Reviews';
    }
    
    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn) {
        submitBtn.textContent = currentLang === 'ru' ? 'Отправить отзыв' : 'Submit review';
    }
    
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
        loadingEl.textContent = currentLang === 'ru' ? 'Загрузка отзывов...' : 'Loading reviews...';
    }
}

function setupEventListeners() {
    const submitBtn = document.getElementById('submitReviewBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitFeedback);
    }
    
    const productSelect = document.getElementById('productSelect');
    if (productSelect) {
        productSelect.addEventListener('change', validateFeedbackForm);
    }
    
    const reviewText = document.getElementById('reviewText');
    if (reviewText) {
        reviewText.addEventListener('input', () => {
            updateCharCount();
            validateFeedbackForm();
        });
    }
    
    const filterProduct = document.getElementById('filterProduct');
    const filterRating = document.getElementById('filterRating');
    
    if (filterProduct) {
        filterProduct.addEventListener('change', loadReviews);
    }
    
    if (filterRating) {
        filterRating.addEventListener('change', loadReviews);
    }
}

function translateFeedbackPage() {
    translatePageStaticElements();
    loadProductsForFilter();
    translateRatingFilter();
    loadReviews();
    if (currentUser && currentUser.role !== 'admin') {
        loadProductsForSelect();
    }
}

window.addEventListener('storage', (event) => {
    if (event.key === 'language') {
        setTimeout(() => {
            translateFeedbackPage();
            if (currentUser && currentUser.role !== 'admin') {
                checkAuth();
            }
        }, 50);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Страница отзывов загружена');
    
    checkAdminMenu();
    checkAuth();
    
    await loadProductsForFilter();
    
    translateRatingFilter();
    resetRatingFilterToAll();
    
    await loadReviews();
    
    translatePageStaticElements();
    setupRatingStars();
    setupEventListeners();
    updateCharCount();
    
    const minCharSpan = document.getElementById('minCharCount');
    if (minCharSpan) {
        minCharSpan.textContent = '50';
    }
});

window.submitFeedback = submitFeedback;