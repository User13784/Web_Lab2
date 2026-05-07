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

function translateProduct(product, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    
    return {
        ...product,
        name: getTranslatedValue(product.name, currentLang),
        description: getTranslatedValue(product.description, currentLang),
        category: getTranslatedValue(product.category, currentLang)
    };
}

function translateProducts(products, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    return products.map(product => translateProduct(product, currentLang));
}

function getTranslatedCategory(categoryKey, lang = null) {
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
    
    return categories[currentLang]?.[categoryKey] || categoryKey;
}

window.getCurrentLanguage = getCurrentLanguage;
window.getTranslatedValue = getTranslatedValue;
window.translateProduct = translateProduct;
window.translateProducts = translateProducts;
window.getTranslatedCategory = getTranslatedCategory;