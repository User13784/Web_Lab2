const API_URL = 'http://localhost:3000';
let currentUser = null;

function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

function translate(key, params = {}) {
    const lang = getCurrentLanguage();
    let text = i18Obj[lang]?.[key] || i18Obj['en'][key] || key;
    
    Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
    });
    
    return text;
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

function checkAdminAccess() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.role === 'admin') {
            document.getElementById('accessDenied').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';
            loadProducts();
            loadProductsForSelect();
            loadUsersForFilter();
            loadReviews();
            return true;
        }
    }
    document.getElementById('accessDenied').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
    return false;
}

function getProductName(product) {
    if (!product) return translate('product');
    if (typeof product === 'string') return product;
    if (typeof product.name === 'string') return product.name;
    
    const currentLang = getCurrentLanguage();
    if (product.name && typeof product.name === 'object') {
        return product.name[currentLang] || product.name['ru'] || product.name['en'] || translate('product');
    }
    return translate('product');
}

function getProductDescription(product) {
    if (!product || !product.description) return '';
    if (typeof product.description === 'string') return product.description;
    
    const currentLang = getCurrentLanguage();
    return product.description[currentLang] || product.description['ru'] || product.description['en'] || '';
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        let products = await response.json();
        
        const searchTerm = document.getElementById('searchProduct')?.value.toLowerCase() || '';
        if (searchTerm) {
            products = products.filter(p => {
                const productName = getProductName(p).toLowerCase();
                return productName.includes(searchTerm);
            });
        }
        
        const container = document.getElementById('productsContainer');
        if (!container) return;
        
        const currentLang = getCurrentLanguage();
        
        if (products.length === 0) {
            container.innerHTML = `<div class="no-data">${translate('no-data')}</div>`;
            return;
        }
        
        const idText = translate('id');
        const imageText = translate('image');
        const nameText = translate('name');
        const categoryText = translate('category');
        const priceText = translate('price');
        const stockText = translate('availability');
        const actionsText = translate('actions');
        const inStockLabel = translate('in-stock');
        const outStockLabel = translate('out-of-stock');
        const editText = translate('edit');
        const deleteText = translate('delete');
        
        container.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>${idText}</th>
                        <th>${imageText}</th>
                        <th>${nameText}</th>
                        <th>${categoryText}</th>
                        <th>${priceText}</th>
                        <th>${stockText}</th>
                        <th>${actionsText}</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.id}</td>
                            <td><img src="../${product.image}" class="product-image" onerror="this.src='../assets/images/chair.png'"></td>
                            <td>${escapeHtml(getProductName(product))}</td>
                            <td>${getCategoryLabel(product.category)}</td>
                            <td>${product.price} £</td>
                            <td>${product.inStock ? inStockLabel : outStockLabel}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="edit-btn" onclick="openEditProductModal(${product.id})">${editText}</button>
                                    <button class="delete-btn" onclick="openDeleteProductModal(${product.id}, '${escapeHtml(getProductName(product))}')">${deleteText}</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showMessage(translate('error-load-products'), 'error');
    }
}

async function loadProductsForSelect() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        const filterSelect = document.getElementById('adminFilterProduct');
        if (filterSelect) {
            filterSelect.innerHTML = `<option value="all" data-i18n="all-products-filter">${translate('all-products-filter')}</option>` +
                products.map(p => `<option value="${p.id}">${escapeHtml(getProductName(p))}</option>`).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров для фильтра:', error);
    }
}

async function loadUsersForFilter() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const filterSelect = document.getElementById('adminFilterUser');
        if (filterSelect) {
            filterSelect.innerHTML = `<option value="all" data-i18n="all-users">${translate('all-users')}</option>` +
                users.map(u => `<option value="${u.id}">${escapeHtml(u.nickname || u.email)}</option>`).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

function getReviewText(review) {
    if (!review.text) return '';
    if (typeof review.text === 'string') return review.text;
    
    const currentLang = getCurrentLanguage();
    return review.text[currentLang] || review.text['ru'] || review.text['en'] || '';
}

function getReviewProductName(review) {
    if (!review.productName) return translate('product');
    if (typeof review.productName === 'string') return review.productName;
    
    const currentLang = getCurrentLanguage();
    return review.productName[currentLang] || review.productName['ru'] || review.productName['en'] || translate('product');
}

async function loadReviews() {
    try {
        const productFilter = document.getElementById('adminFilterProduct')?.value || 'all';
        const userFilter = document.getElementById('adminFilterUser')?.value || 'all';
        
        let url = `${API_URL}/feedback`;
        const response = await fetch(url);
        let reviews = await response.json();
        
        if (productFilter !== 'all') {
            reviews = reviews.filter(r => r.productId == productFilter);
        }
        
        if (userFilter !== 'all') {
            reviews = reviews.filter(r => r.userId == userFilter);
        }
        
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        const currentLang = getCurrentLanguage();
        const deleteText = translate('delete');
        const noReviewsText = translate('no-data');
        
        if (reviews.length === 0) {
            container.innerHTML = `<div class="no-data">${noReviewsText}</div>`;
            return;
        }
        
        container.innerHTML = reviews.map(review => `
            <div class="review-card" data-id="${review.id}">
                <div class="review-header">
                    <div>
                        <span class="review-user">${escapeHtml(review.userNickname || translate('user'))}</span>
                        <span class="review-product">${escapeHtml(getReviewProductName(review))}</span>
                    </div>
                    <div>
                        <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                        <button class="delete-review-btn" onclick="deleteReview(${review.id})">${deleteText}</button>
                    </div>
                </div>
                <div class="review-text">${escapeHtml(getReviewText(review))}</div>
                <div class="review-date">${formatDate(review.createdAt)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        showMessage(translate('error-load-reviews'), 'error');
    }
}

window.openAddProductModal = () => {
    const currentLang = getCurrentLanguage();
    const title = translate('add-product-title');
    
    if (window.modalManager) {
        window.modalManager.openFormModal(
            title,
            [
                { name: 'name', label: translate('product-name'), type: 'text', required: true, placeholder: translate('product-name-placeholder') },
                { name: 'price', label: translate('price'), type: 'number', required: true, placeholder: translate('price-placeholder') },
                { 
                    name: 'category', 
                    label: translate('category'), 
                    type: 'select', 
                    required: true,
                    options: [
                        { value: 'sofa', text: currentLang === 'ru' ? 'Диваны' : 'Sofas' },
                        { value: 'living', text: currentLang === 'ru' ? 'Гостиная' : 'Living Room' },
                        { value: 'kitchen', text: currentLang === 'ru' ? 'Кухня' : 'Kitchen' },
                        { value: 'bedroom', text: currentLang === 'ru' ? 'Спальня' : 'Bedroom' },
                        { value: 'bathroom', text: currentLang === 'ru' ? 'Ванная' : 'Bathroom' },
                        { value: 'decor', text: currentLang === 'ru' ? 'Декор' : 'Decor' },
                        { value: 'ceramics', text: currentLang === 'ru' ? 'Керамика' : 'Ceramics' }
                    ]
                },
                { name: 'description', label: translate('description'), type: 'textarea', required: true, placeholder: translate('description-placeholder') },
                { name: 'image', label: translate('image-url'), type: 'text', required: true, placeholder: translate('image-url-placeholder') },
                { 
                    name: 'stock', 
                    label: translate('stock'), 
                    type: 'select', 
                    required: true,
                    options: [
                        { value: 'true', text: translate('in-stock') },
                        { value: 'false', text: translate('out-of-stock') }
                    ]
                },
                { 
                    name: 'rating', 
                    label: translate('rating'), 
                    type: 'select', 
                    required: false,
                    value: '5',
                    options: [
                        { value: '5', text: '★★★★★ (5)' },
                        { value: '4.5', text: '★★★★☆ (4.5)' },
                        { value: '4', text: '★★★★☆ (4)' },
                        { value: '3.5', text: '★★★☆☆ (3.5)' },
                        { value: '3', text: '★★★☆☆ (3)' },
                        { value: '2.5', text: '★★☆☆☆ (2.5)' },
                        { value: '2', text: '★★☆☆☆ (2)' },
                        { value: '1.5', text: '★☆☆☆☆ (1.5)' },
                        { value: '1', text: '★☆☆☆☆ (1)' }
                    ]
                }
            ],
            async (data) => {
                try {
                    const response = await fetch(`${API_URL}/products`);
                    const products = await response.json();
                    const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
                    
                    const newProduct = {
                        id: maxId + 1,
                        name: {
                            ru: data.name,
                            en: data.name
                        },
                        price: parseFloat(data.price),
                        category: data.category,
                        description: {
                            ru: data.description,
                            en: data.description
                        },
                        image: data.image,
                        inStock: data.stock === 'true',
                        rating: parseFloat(data.rating) || 5,
                        isFavorite: false
                    };
                    
                    await fetch(`${API_URL}/products`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newProduct)
                    });
                    
                    showMessage(translate('product-added-success'), 'success');
                    loadProducts();
                    loadProductsForSelect();
                } catch (error) {
                    console.error('Ошибка:', error);
                    showMessage(translate('product-add-error'), 'error');
                }
            }
        );
    }
};

window.openEditProductModal = async (productId) => {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const product = await response.json();
        
        const currentLang = getCurrentLanguage();
        const title = translate('edit-product-title');
        
        if (window.modalManager) {
            window.modalManager.openFormModal(
                title,
                [
                    { name: 'name', label: translate('product-name'), type: 'text', required: true, value: getProductName(product), placeholder: translate('product-name-placeholder') },
                    { name: 'price', label: translate('price'), type: 'number', required: true, value: product.price, placeholder: translate('price-placeholder') },
                    { 
                        name: 'category', 
                        label: translate('category'), 
                        type: 'select', 
                        required: true,
                        value: product.category,
                        options: [
                            { value: 'sofa', text: currentLang === 'ru' ? 'Диваны' : 'Sofas' },
                            { value: 'living', text: currentLang === 'ru' ? 'Гостиная' : 'Living Room' },
                            { value: 'kitchen', text: currentLang === 'ru' ? 'Кухня' : 'Kitchen' },
                            { value: 'bedroom', text: currentLang === 'ru' ? 'Спальня' : 'Bedroom' },
                            { value: 'bathroom', text: currentLang === 'ru' ? 'Ванная' : 'Bathroom' },
                            { value: 'decor', text: currentLang === 'ru' ? 'Декор' : 'Decor' },
                            { value: 'ceramics', text: currentLang === 'ru' ? 'Керамика' : 'Ceramics' }
                        ]
                    },
                    { name: 'description', label: translate('description'), type: 'textarea', required: true, value: getProductDescription(product), placeholder: translate('description-placeholder') },
                    { name: 'image', label: translate('image-url'), type: 'text', required: true, value: product.image, placeholder: translate('image-url-placeholder') },
                    { 
                        name: 'stock', 
                        label: translate('stock'), 
                        type: 'select', 
                        required: true,
                        value: product.inStock ? 'true' : 'false',
                        options: [
                            { value: 'true', text: translate('in-stock') },
                            { value: 'false', text: translate('out-of-stock') }
                        ]
                    },
                    { 
                        name: 'rating', 
                        label: translate('rating'), 
                        type: 'select', 
                        required: false,
                        value: product.rating,
                        options: [
                            { value: '5', text: '★★★★★ (5)' },
                            { value: '4.5', text: '★★★★☆ (4.5)' },
                            { value: '4', text: '★★★★☆ (4)' },
                            { value: '3.5', text: '★★★☆☆ (3.5)' },
                            { value: '3', text: '★★★☆☆ (3)' },
                            { value: '2.5', text: '★★☆☆☆ (2.5)' },
                            { value: '2', text: '★★☆☆☆ (2)' },
                            { value: '1.5', text: '★☆☆☆☆ (1.5)' },
                            { value: '1', text: '★☆☆☆☆ (1)' }
                        ]
                    }
                ],
                async (data) => {
                    try {
                        const oldName = typeof product.name === 'object' ? product.name : { ru: data.name, en: data.name };
                        const oldDescription = typeof product.description === 'object' ? product.description : { ru: data.description, en: data.description };
                        
                        await fetch(`${API_URL}/products/${productId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...product,
                                name: {
                                    ru: data.name,
                                    en: oldName.en || data.name
                                },
                                price: parseFloat(data.price),
                                category: data.category,
                                description: {
                                    ru: data.description,
                                    en: oldDescription.en || data.description
                                },
                                image: data.image,
                                inStock: data.stock === 'true',
                                rating: parseFloat(data.rating) || product.rating
                            })
                        });
                        
                        showMessage(translate('product-updated-success'), 'success');
                        loadProducts();
                        loadProductsForSelect();
                    } catch (error) {
                        console.error('Ошибка:', error);
                        showMessage(translate('product-update-error'), 'error');
                    }
                }
            );
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage(translate('product-load-error'), 'error');
    }
};

window.openDeleteProductModal = (productId, productName) => {
    if (window.modalManager) {
        window.modalManager.openConfirmModal(
            translate('confirm-delete'),
            translate('delete-confirm-text', { name: productName }),
            async () => {
                try {
                    await fetch(`${API_URL}/products/${productId}`, {
                        method: 'DELETE'
                    });
                    
                    showMessage(translate('product-deleted-success', { name: productName }), 'success');
                    loadProducts();
                    loadProductsForSelect();
                } catch (error) {
                    console.error('Ошибка:', error);
                    showMessage(translate('product-delete-error'), 'error');
                }
            }
        );
    }
};

async function deleteReview(id) {
    const confirmText = translate('confirm-delete-review');
    if (confirm(confirmText)) {
        try {
            await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
            showMessage(translate('review-deleted-success'), 'success');
            loadReviews();
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage(translate('review-delete-error'), 'error');
        }
    }
}

function getCategoryLabel(categoryValue) {
    const currentLang = getCurrentLanguage();
    const categories = {
        'sofa': currentLang === 'ru' ? 'Диваны' : 'Sofas',
        'living': currentLang === 'ru' ? 'Гостиная' : 'Living Room',
        'kitchen': currentLang === 'ru' ? 'Кухня' : 'Kitchen',
        'bedroom': currentLang === 'ru' ? 'Спальня' : 'Bedroom',
        'bathroom': currentLang === 'ru' ? 'Ванная' : 'Bathroom',
        'decor': currentLang === 'ru' ? 'Декор' : 'Decor',
        'ceramics': currentLang === 'ru' ? 'Керамика' : 'Ceramics'
    };
    return categories[categoryValue] || categoryValue;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const currentLang = getCurrentLanguage();
    return date.toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function initEventListeners() {
    const searchInput = document.getElementById('searchProduct');
    if (searchInput) {
        searchInput.addEventListener('input', () => loadProducts());
    }
    
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadReviews);
    }
    
    const addProductBtn = document.getElementById('openAddProductModalBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openAddProductModal());
    }
}

function translateAdminPanel() {
    loadProducts();
    loadReviews();
    loadProductsForSelect();
    loadUsersForFilter();
}

window.addEventListener('storage', (event) => {
    if (event.key === 'language') {
        setTimeout(() => {
            translateAdminPanel();
        }, 100);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Админ-панель загружена');
    
    if (checkAdminAccess()) {
        initEventListeners();
    }
});

window.deleteReview = deleteReview;

function translateAdminPanel() {
    const currentLang = getCurrentLanguage();
    
    const addProductBtn = document.getElementById('openAddProductModalBtn');
    if (addProductBtn) {
        addProductBtn.innerHTML = currentLang === 'ru' ? '➕ Добавить товар' : '➕ Add product';
    }
    
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.innerHTML = currentLang === 'ru' ? '🔍 Применить фильтры' : '🔍 Apply filters';
    }
    
    const productsTitle = document.querySelector('.admin-section:first-child h2');
    if (productsTitle && productsTitle.getAttribute('data-i18n') === 'products-management') {
        productsTitle.textContent = currentLang === 'ru' ? '📦 Управление товарами' : '📦 Products Management';
    }
    
    const productListTitle = document.querySelector('.products-list h3');
    if (productListTitle && productListTitle.getAttribute('data-i18n') === 'product-list') {
        productListTitle.textContent = currentLang === 'ru' ? 'Список товаров' : 'Product list';
    }
    
    const reviewsTitle = document.querySelector('.admin-section:last-child h2');
    if (reviewsTitle && reviewsTitle.getAttribute('data-i18n') === 'reviews-management') {
        reviewsTitle.textContent = currentLang === 'ru' ? '💬 Управление отзывами' : '💬 Reviews Management';
    }
    
    const filterProductLabel = document.querySelector('.reviews-filters .form-group:first-child label');
    if (filterProductLabel) {
        filterProductLabel.textContent = currentLang === 'ru' ? 'Фильтр по товару' : 'Filter by product';
    }
    
    const filterUserLabel = document.querySelector('.reviews-filters .form-group:last-child label');
    if (filterUserLabel) {
        filterUserLabel.textContent = currentLang === 'ru' ? 'Фильтр по пользователю' : 'Filter by user';
    }
    
    const searchInput = document.getElementById('searchProduct');
    if (searchInput) {
        searchInput.placeholder = currentLang === 'ru' ? '🔍 Поиск товаров...' : '🔍 Search products...';
    }
    
    loadProducts();
    loadReviews();
    loadProductsForSelect();
    loadUsersForFilter();
}

window.addEventListener('storage', (event) => {
    if (event.key === 'language') {
        setTimeout(() => {
            translateAdminPanel();
        }, 100);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        translateAdminPanel();
    }, 100);
});