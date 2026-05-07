const API_URL = 'http://localhost:3000';
const CART_STORAGE_PREFIX = 'cart_';

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

function getCurrentUserId() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            return user.id;
        } catch (e) {
            console.error('Ошибка парсинга пользователя:', e);
            return null;
        }
    }
    return null;
}

function getCurrentUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            console.error('Ошибка парсинга пользователя:', e);
            return null;
        }
    }
    return null;
}

async function saveUserCartToLocalStorage(userId, cartItems) {
    if (userId) {
        localStorage.setItem(`${CART_STORAGE_PREFIX}${userId}`, JSON.stringify(cartItems));
    }
}

async function loadUserCartFromLocalStorage(userId) {
    if (!userId) return null;
    const saved = localStorage.getItem(`${CART_STORAGE_PREFIX}${userId}`);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка парсинга корзины:', e);
            return null;
        }
    }
    return null;
}

async function syncCartWithServer(userId) {
    if (!userId) return [];
    
    try {
        const response = await fetch(`${API_URL}/cart`);
        let serverCart = await response.json();
        
        let userServerCart = serverCart.filter(item => item.userId === userId);
        
        const localCart = await loadUserCartFromLocalStorage(userId);
        
        if (localCart && localCart.length > 0 && userServerCart.length === 0) {
            for (const item of localCart) {
                await fetch(`${API_URL}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: Date.now() + Math.random(),
                        userId: userId,
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                        quantity: item.quantity
                    })
                });
            }
            userServerCart = localCart;
        }
        
        await saveUserCartToLocalStorage(userId, userServerCart);
        
        return userServerCart;
    } catch (error) {
        console.error('Ошибка синхронизации корзины:', error);
        const localCart = await loadUserCartFromLocalStorage(userId);
        return localCart || [];
    }
}

function getImagePath(imagePath) {
    if (!imagePath) return '../assets/images/chair.png';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return imagePath;
    return '../' + imagePath;
}

function showMessage(message, isError = false) {
    const existingMsg = document.querySelector('.message-popup');
    if (existingMsg) existingMsg.remove();
    
    const msg = document.createElement('div');
    msg.className = 'message-popup';
    msg.textContent = message;
    if (isError) msg.style.background = '#c62828';
    document.body.appendChild(msg);
    
    setTimeout(() => msg.remove(), 3000);
}

async function loadCart() {
    try {
        const userId = getCurrentUserId();
        let cartItems = [];
        
        if (userId) {
            cartItems = await syncCartWithServer(userId);
        } else {
            const response = await fetch(`${API_URL}/cart`);
            const allCart = await response.json();
            cartItems = allCart;
        }
        
        const container = document.getElementById('cartContent');
        const currentLang = getCurrentLanguage();
        
        if (!cartItems || cartItems.length === 0) {
            const emptyTitle = currentLang === 'ru' ? '🛍️ Корзина пуста' : '🛍️ Cart is empty';
            const emptyText = currentLang === 'ru' ? 'Добавьте товары в корзину, чтобы оформить заказ' : 'Add items to cart to checkout';
            const goToCatalogText = currentLang === 'ru' ? 'Перейти в каталог' : 'Go to catalog';
            
            container.innerHTML = `
                <div class="empty-cart">
                    <h2>${emptyTitle}</h2>
                    <p>${emptyText}</p>
                    <a href="catalog.html" class="back-link">${goToCatalogText}</a>
                </div>
            `;
            return;
        }
        
        let total = 0;
        
        const productHeader = currentLang === 'ru' ? 'Товар' : 'Product';
        const nameHeader = currentLang === 'ru' ? 'Название' : 'Name';
        const priceHeader = currentLang === 'ru' ? 'Цена' : 'Price';
        const quantityHeader = currentLang === 'ru' ? 'Количество' : 'Quantity';
        const totalHeader = currentLang === 'ru' ? 'Сумма' : 'Total';
        
        const itemsHtml = cartItems.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const itemName = getTranslatedValue(item.name, currentLang);
            
            return `
                <div class="cart-item" data-cart-id="${item.id}">
                    <img src="${getImagePath(item.image)}" alt="${escapeHtml(itemName)}" class="cart-item-image" onerror="this.src='../assets/images/chair.png'">
                    <div class="cart-item-title">${escapeHtml(itemName)}</div>
                    <div class="cart-item-price">£${item.price.toFixed(2)}</div>
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-total">£${itemTotal.toFixed(2)}</div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})" title="${currentLang === 'ru' ? 'Удалить' : 'Remove'}">🗑️</button>
                </div>
            `;
        }).join('');
        
        const totalText = currentLang === 'ru' ? 'Итого:' : 'Total:';
        const checkoutText = currentLang === 'ru' ? '✅ Оформить заказ' : '✅ Checkout';
        
        container.innerHTML = `
            <div class="cart-table">
                <div class="cart-header">
                    <div>${productHeader}</div>
                    <div>${nameHeader}</div>
                    <div>${priceHeader}</div>
                    <div>${quantityHeader}</div>
                    <div>${totalHeader}</div>
                    <div></div>
                </div>
                ${itemsHtml}
            </div>
            <div class="cart-summary">
                <div class="cart-total">${totalText} £${total.toFixed(2)}</div>
                <button class="checkout-btn" onclick="checkout()">${checkoutText}</button>
            </div>
        `;
        
        updateHeaderCartCount(cartItems);
        
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        showMessage('Ошибка загрузки корзины. Убедитесь, что сервер запущен.', true);
    }
}

function updateHeaderCartCount(cartItems) {
    const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) cartBadge.textContent = cartCount;
    
    const mobileCartCount = document.getElementById('mobileCartCount');
    if (mobileCartCount) mobileCartCount.textContent = cartCount;
}

async function updateQuantity(cartId, newQuantity) {
    if (newQuantity < 1) {
        await removeFromCart(cartId);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления');
        
        const userId = getCurrentUserId();
        if (userId) {
            const updatedResponse = await fetch(`${API_URL}/cart`);
            const allCart = await updatedResponse.json();
            const userCart = allCart.filter(item => item.userId === userId);
            await saveUserCartToLocalStorage(userId, userCart);
        }
        
        const currentLang = getCurrentLanguage();
        const updateMessage = currentLang === 'ru' ? 'Количество обновлено' : 'Quantity updated';
        showMessage(updateMessage);
        loadCart();
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка обновления количества', true);
    }
}

async function removeFromCart(cartId) {
    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка удаления');
        
        const userId = getCurrentUserId();
        if (userId) {
            const updatedResponse = await fetch(`${API_URL}/cart`);
            const allCart = await updatedResponse.json();
            const userCart = allCart.filter(item => item.userId === userId);
            await saveUserCartToLocalStorage(userId, userCart);
        }
        
        const currentLang = getCurrentLanguage();
        const removeMessage = currentLang === 'ru' ? '🗑️ Товар удален из корзины' : '🗑️ Item removed from cart';
        showMessage(removeMessage);
        loadCart();
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка удаления товара', true);
    }
}

async function checkout() {
    try {
        const currentUser = getCurrentUser();
        const currentLang = getCurrentLanguage();
        
        if (!currentUser) {
            const loginMessage = currentLang === 'ru' ? 'Для оформления заказа необходимо войти в аккаунт' : 'Please log in to checkout';
            showMessage(loginMessage, true);
            setTimeout(() => {
                window.location.href = 'register.html';
            }, 1500);
            return;
        }
        
        const userId = currentUser.id;
        
        const response = await fetch(`${API_URL}/cart`);
        let allCart = await response.json();
        let cartItems = allCart.filter(item => item.userId === userId);
        
        if (cartItems.length === 0) {
            const emptyMessage = currentLang === 'ru' ? 'Корзина пуста' : 'Cart is empty';
            showMessage(emptyMessage, true);
            return;
        }
        
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const orderData = {
            id: Date.now(),
            userId: currentUser.id,
            userNickname: currentUser.nickname || `${currentUser.firstName} ${currentUser.lastName}`,
            userEmail: currentUser.email,
            items: cartItems.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            totalAmount: totalAmount,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        
        const orderResponse = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!orderResponse.ok) throw new Error('Ошибка сохранения заказа');
        
        for (const item of cartItems) {
            await fetch(`${API_URL}/cart/${item.id}`, { 
                method: 'DELETE' 
            });
        }
        
        await saveUserCartToLocalStorage(userId, []);
        
        const successMessage = currentLang === 'ru' 
            ? `✅ Заказ успешно оформлен! Сумма: £${totalAmount.toFixed(2)}. Спасибо за покупку!` 
            : `✅ Order completed! Total: £${totalAmount.toFixed(2)}. Thank you for your purchase!`;
        showMessage(successMessage);
        
        setTimeout(() => {
            window.location.href = 'feedback.html';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка:', error);
        const errorMessage = getCurrentLanguage() === 'ru' ? 'Ошибка оформления заказа' : 'Checkout error';
        showMessage(errorMessage, true);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function checkAdminAccessForMenu() {
    const savedUser = localStorage.getItem('currentUser');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const profileMenuItem = document.getElementById('profileMenuItem');
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user.role === 'admin') {
                if (adminMenuItem) adminMenuItem.style.display = 'block';
                if (profileMenuItem) profileMenuItem.style.display = 'none';
            } else {
                if (adminMenuItem) adminMenuItem.style.display = 'none';
                if (profileMenuItem) profileMenuItem.style.display = 'block';
            }
        } catch (e) {
            console.error('Ошибка:', e);
        }
    } else {
        if (adminMenuItem) adminMenuItem.style.display = 'none';
        if (profileMenuItem) profileMenuItem.style.display = 'block';
    }
}

window.addToCartFromDetail = async (productId) => {
    try {
        const userId = getCurrentUserId();
        const currentLang = getCurrentLanguage();
        
        const response = await fetch(`${API_URL}/products/${productId}`);
        const product = await response.json();
        
        const cartResponse = await fetch(`${API_URL}/cart`);
        let cart = await cartResponse.json();
        
        let existingItem = null;
        if (userId) {
            existingItem = cart.find(item => item.productId === productId && item.userId === userId);
        } else {
            existingItem = cart.find(item => item.productId === productId);
        }
        
        const productName = getTranslatedValue(product.name, currentLang);
        
        if (existingItem) {
            await fetch(`${API_URL}/cart/${existingItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: existingItem.quantity + 1 })
            });
        } else {
            await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: Date.now(),
                    userId: userId,
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                })
            });
        }
        
        if (userId) {
            const updatedResponse = await fetch(`${API_URL}/cart`);
            const updatedCart = await updatedResponse.json();
            const userCart = updatedCart.filter(item => item.userId === userId);
            await saveUserCartToLocalStorage(userId, userCart);
        }
        
        const addMessage = currentLang === 'ru' ? `"${productName}" добавлен в корзину` : `"${productName}" added to cart`;
        showMessage(addMessage);
        
        const countResponse = await fetch(`${API_URL}/cart`);
        const countCart = await countResponse.json();
        const userCountCart = userId ? countCart.filter(item => item.userId === userId) : countCart;
        updateHeaderCartCount(userCountCart);
        
    } catch (error) {
        console.error('Ошибка:', error);
        const errorMessage = getCurrentLanguage() === 'ru' ? 'Ошибка добавления в корзину' : 'Error adding to cart';
        showMessage(errorMessage, true);
    }
};

window.addEventListener('storage', (event) => {
    if (event.key === 'language') {
        loadCart();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница корзины загружена');
    checkAdminAccessForMenu();
    loadCart();
});

window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.addToCartFromDetail = addToCartFromDetail;