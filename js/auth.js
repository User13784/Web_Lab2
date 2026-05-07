
const API_URL = 'http://localhost:3000';
const USER_STORAGE_KEY = 'currentUser';

function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

function translateErrorMessage(key, params = {}) {
    const currentLang = getCurrentLanguage();
    let message = i18Obj[currentLang]?.[key] || i18Obj['en'][key] || key;
    
    Object.keys(params).forEach(param => {
        message = message.replace(`{{${param}}}`, params[param]);
    });
    
    return message;
}

function saveUserToStorage(user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
        id: user.id,
        nickname: user.nickname,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        birthDate: user.birthDate,
        patronymic: user.patronymic || '',
        theme: currentTheme || 'light',
        language: currentLang || 'en'
    }));
}

function getUserFromStorage() {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
}

function logout() {
    localStorage.removeItem(USER_STORAGE_KEY);
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    window.location.reload();
}

function updateAuthUI() {
    const savedUser = getUserFromStorage();
    const userIconSpan = document.querySelector('.user-icon span');
    const userIcon = document.querySelector('.user-icon');
    
    if (savedUser && userIconSpan) {
        userIconSpan.textContent = savedUser.nickname || savedUser.firstName;
        
        let logoutBtn = document.querySelector('.user-icon .logout-btn');
        if (!logoutBtn) {
            const logoutButton = document.createElement('button');
            logoutButton.className = 'logout-btn';
            logoutButton.innerHTML = '🚪';
            logoutButton.title = translateErrorMessage('logout');
            logoutButton.style.cssText = `
                margin-left: 5px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                padding: 4px 8px;
                border-radius: 50%;
                transition: all 0.3s ease;
            `;
            logoutButton.onclick = (e) => {
                e.stopPropagation();
                logout();
            };
            
            userIcon.appendChild(logoutButton);
        }
    } else if (userIcon) {
        const logoutBtn = userIcon.querySelector('.logout-btn');
        if (logoutBtn) logoutBtn.remove();
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/users?email=${email}`);
        const users = await response.json();
        
        if (users.length === 0) {
            showErrorMessageOnForm('loginError', 'user-not-found');
            return false;
        }
        
        const user = users[0];
        if (user.password !== password) {
            showErrorMessageOnForm('loginError', 'wrong-password');
            return false;
        }
        
        saveUserToStorage(user);
        
        const savedTheme = localStorage.getItem(`${user.id}_theme`);
        const savedLang = localStorage.getItem(`${user.id}_lang`);
        
        if (savedTheme) applyTheme(savedTheme);
        if (savedLang) translatePage(savedLang);
        
        const errorContainer = document.getElementById('authErrorMessage');
        if (errorContainer) {
            const welcomeMsg = translateErrorMessage('welcome', { name: user.firstName });
            errorContainer.textContent = welcomeMsg;
            errorContainer.style.display = 'block';
            errorContainer.className = 'auth-error-message success';
        }
        
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = '../pages/admin.html';
            } else {
                window.location.href = '../pages/catalog.html';
            }
        }, 1500);
        
        return true;
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        showErrorMessageOnForm('loginError', 'server-error');
        return false;
    }
}

function showMessage(messageKey, type = 'info', params = {}) {
    const errorContainer = document.getElementById('authErrorMessage');
    
    if (errorContainer) {
        const translatedMessage = translateErrorMessage(messageKey, params);
        errorContainer.textContent = translatedMessage;
        errorContainer.style.display = 'block';
        errorContainer.className = `auth-error-message ${type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info')}`;
        
        setTimeout(() => {
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
        }, 4000);
    } else {
        console.log(`${type}: ${translateErrorMessage(messageKey, params)}`);
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/users?email=${email}`);
        const users = await response.json();
        
        if (users.length === 0) {
            showErrorMessageOnForm('loginError', 'user-not-found');
            return false;
        }
        
        const user = users[0];
        if (user.password !== password) {
            showErrorMessageOnForm('loginError', 'wrong-password');
            return false;
        }
        
        saveUserToStorage(user);
        
        const savedTheme = localStorage.getItem(`${user.id}_theme`);
        const savedLang = localStorage.getItem(`${user.id}_lang`);
        
        if (savedTheme) applyTheme(savedTheme);
        if (savedLang) translatePage(savedLang);
        
        const errorContainer = document.getElementById('authErrorMessage');
        if (errorContainer) {
            const welcomeMsg = translateErrorMessage('welcome', { name: user.firstName });
            errorContainer.textContent = welcomeMsg;
            errorContainer.style.display = 'block';
            errorContainer.className = 'auth-error-message success';
        }
        
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = '../pages/admin.html';
            } else {
                window.location.href = '../pages/catalog.html';
            }
        }, 1500);
        
        return true;
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        showErrorMessageOnForm('loginError', 'server-error');
        return false;
    }
}

function showErrorMessageOnForm(errorId, messageKey, params = {}) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        const translatedMessage = translateErrorMessage(messageKey, params);
        errorElement.textContent = translatedMessage;
        errorElement.classList.add('show');
        
        setTimeout(() => {
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }, 4000);
    } else {
        const errorContainer = document.getElementById('authErrorMessage');
        if (errorContainer) {
            errorContainer.textContent = translateErrorMessage(messageKey, params);
            errorContainer.style.display = 'block';
            errorContainer.className = 'auth-error-message error';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 4000);
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.classList.remove('show');
    }
    
    if (!email || !password) {
        showErrorMessageOnForm('loginError', 'fill-fields-error');
        return;
    }
    
    await loginUser(email, password);
}

const TOP_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'password123', '12345678', '111111',
    '12345', '1234567890', 'qwerty123', 'abc123', 'admin', 'iloveyou', 'welcome',
    'monkey', 'dragon', 'master', 'hello', 'freedom', 'whatever', 'qwertyuiop',
    'passw0rd', 'letmein', 'trustno1', '123123', 'admin123', 'password1', 'adminadmin'
];

const NICKNAME_SUFFIXES = ['', 'Cool', 'Pro', 'Star', 'Good', 'Super', 'Ultra', 'Mega'];

let generateAttempts = 0;
const MAX_GENERATE_ATTEMPTS = 5;
let isManualNicknameMode = false;
let currentUser = null;

let currentFormValidity = {
    isPhoneValid: false,
    isEmailValid: false,
    isBirthValid: false,
    isFirstNameValid: false,
    isLastNameValid: false,
    isNicknameValid: false,
    isPasswordValid: false,
    isConfirmValid: false,
    isAgreementValid: false,
    isNicknameUnique: false
};

function showMessage(messageKey, type = 'info', params = {}) {
    const errorContainer = document.getElementById('authErrorMessage');
    
    if (errorContainer) {
        const translatedMessage = translateErrorMessage(messageKey, params);
        errorContainer.textContent = translatedMessage;
        errorContainer.style.display = 'block';
        errorContainer.className = `auth-error-message ${type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info')}`;
        
        setTimeout(() => {
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
        }, 4000);
    } else {
        console.log(`${type}: ${translateErrorMessage(messageKey, params)}`);
    }
}

function validatePhone(phone) {
    const phoneRegex = /^(\+375|375)(29|33|44|25|17)\d{7}$/;
    return phoneRegex.test(phone);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
}

function validateNickname(nickname) {
    const nicknameRegex = /^[A-Za-z0-9_\-\.]{3,30}$/;
    return nicknameRegex.test(nickname);
}

function isOnlyEnglishLetters(text) {
    const englishOnlyRegex = /^[A-Za-z0-9_\-\.]*$/;
    return englishOnlyRegex.test(text);
}

function getAgeFromBirthDate(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function updateAgeHint() {
    const birthDateInput = document.getElementById('regBirthDate');
    const birthDate = birthDateInput?.value;
    
    const oldHint = document.querySelector('.age-hint');
    if (oldHint) oldHint.remove();
    
    if (!birthDate) {
        const hint = document.createElement('div');
        hint.className = 'age-hint info';
        hint.innerHTML = translateErrorMessage('age-hint-info');
        birthDateInput?.parentNode.appendChild(hint);
        return;
    }
    
    const age = getAgeFromBirthDate(birthDate);
    
    if (age !== null) {
        const hint = document.createElement('div');
        
        if (age >= 16) {
            hint.className = 'age-hint success';
            hint.innerHTML = translateErrorMessage('age-hint-success', { age: age });
        } else {
            hint.className = 'age-hint warning';
            hint.innerHTML = translateErrorMessage('age-hint-warning', { age: age });
        }
        
        birthDateInput?.parentNode.appendChild(hint);
    }
}

function validateBirthDate(birthDate) {
    const age = getAgeFromBirthDate(birthDate);
    return age !== null && age >= 16;
}

function isTopPassword(password) {
    return TOP_PASSWORDS.includes(password.toLowerCase());
}

function validatePassword(password) {
    const minLength = password.length >= 8;
    const maxLength = password.length <= 20;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const notTopPassword = !isTopPassword(password);
    
    return {
        isValid: minLength && maxLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial && notTopPassword,
        errors: {
            minLength: !minLength,
            maxLength: !maxLength,
            hasUpperCase: !hasUpperCase,
            hasLowerCase: !hasLowerCase,
            hasNumber: !hasNumber,
            hasSpecial: !hasSpecial,
            notTopPassword: !notTopPassword
        }
    };
}

async function generateUniqueNickname(firstName, lastName) {
    function transliterate(text) {
        const ru = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
            'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return text.toLowerCase().split('').map(char => ru[char] || char).join('');
    }
    
    const latinFirstName = transliterate(firstName);
    const latinLastName = transliterate(lastName);
    
    if (!latinFirstName || !latinLastName) {
        return generateRandomNickname();
    }
    
    for (let attempt = 0; attempt < 20; attempt++) {
        const namePart = latinFirstName.substring(0, Math.floor(Math.random() * 3) + 1);
        const lastNamePart = latinLastName.substring(0, Math.floor(Math.random() * 3) + 1);
        const randomNum = Math.floor(Math.random() * 990) + 10;
        const suffix = NICKNAME_SUFFIXES[Math.floor(Math.random() * NICKNAME_SUFFIXES.length)];
        
        let nickname = namePart.charAt(0).toUpperCase() + namePart.slice(1) + 
                       lastNamePart.charAt(0).toUpperCase() + lastNamePart.slice(1) + randomNum;
        if (suffix) nickname += suffix;
        
        const isUnique = await checkNicknameUnique(nickname);
        if (isUnique) {
            return nickname;
        }
    }
    
    return `${latinFirstName.substring(0, 2)}${latinLastName.substring(0, 2)}${Date.now() % 10000}`;
}

function generateRandomNickname() {
    const prefixes = ['User', 'Guest', 'Member', 'Client'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    return `${prefix}${randomNum}`;
}

async function checkNicknameUnique(nickname) {
    try {
        const response = await fetch(`${API_URL}/users?nickname=${nickname}`);
        const users = await response.json();
        return users.length === 0;
    } catch (error) {
        console.error('Ошибка проверки никнейма:', error);
        return true;
    }
}

async function checkEmailUnique(email) {
    try {
        const response = await fetch(`${API_URL}/users?email=${email}`);
        const users = await response.json();
        return users.length === 0;
    } catch (error) {
        console.error('Ошибка проверки email:', error);
        return true;
    }
}

async function checkPhoneUnique(phone) {
    try {
        const response = await fetch(`${API_URL}/users?phone=${phone}`);
        const users = await response.json();
        return users.length === 0;
    } catch (error) {
        console.error('Ошибка проверки телефона:', error);
        return true;
    }
}

function showFieldError(errorId, messageKey, params = {}) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        const translatedMessage = translateErrorMessage(messageKey, params);
        errorEl.textContent = translatedMessage;
        errorEl.classList.add('show');
    }
}

function hideFieldError(errorId) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

function updateRegisterButtonState() {
    const submitBtn = document.getElementById('registerSubmitBtn');
    if (!submitBtn) return;
    
    const isValid = currentFormValidity.isPhoneValid &&
                    currentFormValidity.isEmailValid &&
                    currentFormValidity.isBirthValid &&
                    currentFormValidity.isFirstNameValid &&
                    currentFormValidity.isLastNameValid &&
                    currentFormValidity.isNicknameValid &&
                    currentFormValidity.isNicknameUnique &&
                    currentFormValidity.isPasswordValid &&
                    currentFormValidity.isConfirmValid &&
                    currentFormValidity.isAgreementValid;
    
    submitBtn.disabled = !isValid;
    return isValid;
}

async function checkNicknameUniqueness(nickname) {
    if (!nickname || nickname.length < 3) {
        currentFormValidity.isNicknameUnique = false;
        updateRegisterButtonState();
        return false;
    }
    const isUnique = await checkNicknameUnique(nickname);
    currentFormValidity.isNicknameUnique = isUnique;
    
    if (!isUnique) {
        showFieldError('nicknameError', 'nickname-exists');
        document.getElementById('regNickname')?.classList.add('error');
        currentFormValidity.isNicknameValid = false;
    } else {
        hideFieldError('nicknameError');
        document.getElementById('regNickname')?.classList.remove('error');
        currentFormValidity.isNicknameValid = true;
    }
    
    updateRegisterButtonState();
    return isUnique;
}

function restrictNicknameInput() {
    const nicknameInput = document.getElementById('regNickname');
    if (!nicknameInput) return;
    
    nicknameInput.addEventListener('input', function(e) {
        const originalValue = this.value;
        const filteredValue = originalValue.replace(/[^A-Za-z0-9_\-\.]/g, '');
        
        if (originalValue !== filteredValue) {
            this.value = filteredValue;
            showFieldError('nicknameError', 'nickname-error');
            currentFormValidity.isNicknameValid = false;
        } else {
            hideFieldError('nicknameError');
        }
        
        validateRegistrationFormSync();
    });
}

function validateRegistrationFormSync() {
    const phone = document.getElementById('regPhone')?.value || '';
    const email = document.getElementById('regEmail')?.value || '';
    const birthDate = document.getElementById('regBirthDate')?.value || '';
    const firstName = document.getElementById('regFirstName')?.value || '';
    const lastName = document.getElementById('regLastName')?.value || '';
    const nickname = document.getElementById('regNickname')?.value || '';
    const agreement = document.getElementById('agreement')?.checked || false;
    
    const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
    let password = '';
    let confirmPassword = '';
    
    if (passwordMethod === 'manual') {
        password = document.getElementById('regPassword')?.value || '';
        confirmPassword = document.getElementById('regConfirmPassword')?.value || '';
    } else {
        password = document.getElementById('autoPassword')?.value || '';
    }
    
    let isValid = true;
    
    if (!validatePhone(phone)) {
        showFieldError('phoneError', 'phone-error');
        document.getElementById('regPhone')?.classList.add('error');
        currentFormValidity.isPhoneValid = false;
        isValid = false;
    } else {
        hideFieldError('phoneError');
        document.getElementById('regPhone')?.classList.remove('error');
        currentFormValidity.isPhoneValid = true;
    }
    
    if (!validateEmail(email)) {
        showFieldError('emailError', 'email-error');
        document.getElementById('regEmail')?.classList.add('error');
        currentFormValidity.isEmailValid = false;
        isValid = false;
    } else {
        hideFieldError('emailError');
        document.getElementById('regEmail')?.classList.remove('error');
        currentFormValidity.isEmailValid = true;
    }
    
    if (!birthDate) {
        showFieldError('birthError', 'birth-error');
        document.getElementById('regBirthDate')?.classList.add('error');
        currentFormValidity.isBirthValid = false;
        isValid = false;
    } else if (!validateBirthDate(birthDate)) {
        const age = getAgeFromBirthDate(birthDate);
        showFieldError('birthError', 'birth-error-age', { age: age });
        document.getElementById('regBirthDate')?.classList.add('error');
        currentFormValidity.isBirthValid = false;
        isValid = false;
    } else {
        hideFieldError('birthError');
        document.getElementById('regBirthDate')?.classList.remove('error');
        currentFormValidity.isBirthValid = true;
    }
    
    if (!firstName.trim()) {
        showFieldError('firstNameError', 'firstname-error');
        document.getElementById('regFirstName')?.classList.add('error');
        currentFormValidity.isFirstNameValid = false;
        isValid = false;
    } else {
        hideFieldError('firstNameError');
        document.getElementById('regFirstName')?.classList.remove('error');
        currentFormValidity.isFirstNameValid = true;
    }
    
    if (!lastName.trim()) {
        showFieldError('lastNameError', 'lastname-error');
        document.getElementById('regLastName')?.classList.add('error');
        currentFormValidity.isLastNameValid = false;
        isValid = false;
    } else {
        hideFieldError('lastNameError');
        document.getElementById('regLastName')?.classList.remove('error');
        currentFormValidity.isLastNameValid = true;
    }
    
    if (!nickname.trim()) {
        showFieldError('nicknameError', 'nickname-min-length');
        document.getElementById('regNickname')?.classList.add('error');
        currentFormValidity.isNicknameValid = false;
        isValid = false;
    } else if (nickname.length < 3) {
        showFieldError('nicknameError', 'nickname-min-length');
        document.getElementById('regNickname')?.classList.add('error');
        currentFormValidity.isNicknameValid = false;
        isValid = false;
    } else if (nickname.length > 30) {
        showFieldError('nicknameError', 'nickname-max-length');
        document.getElementById('regNickname')?.classList.add('error');
        currentFormValidity.isNicknameValid = false;
        isValid = false;
    } else if (!validateNickname(nickname)) {
        showFieldError('nicknameError', 'nickname-error');
        document.getElementById('regNickname')?.classList.add('error');
        currentFormValidity.isNicknameValid = false;
        isValid = false;
    } else if (!isOnlyEnglishLetters(nickname)) {
        showFieldError('nicknameError', 'nickname-english-only');
        document.getElementById('regNickname')?.classList.add('error');
        currentFormValidity.isNicknameValid = false;
        isValid = false;
    } else {
        hideFieldError('nicknameError');
        document.getElementById('regNickname')?.classList.remove('error');
        currentFormValidity.isNicknameValid = true;
        checkNicknameUniqueness(nickname);
    }
    
    if (passwordMethod === 'manual') {
        const validation = validatePassword(password);
        if (!validation.isValid) {
            showFieldError('passwordError', 'password-error');
            document.getElementById('regPassword')?.classList.add('error');
            currentFormValidity.isPasswordValid = false;
            isValid = false;
        } else {
            hideFieldError('passwordError');
            document.getElementById('regPassword')?.classList.remove('error');
            currentFormValidity.isPasswordValid = true;
        }
        
        if (password !== confirmPassword) {
            showFieldError('confirmError', 'password-match-error');
            document.getElementById('regConfirmPassword')?.classList.add('error');
            currentFormValidity.isConfirmValid = false;
            isValid = false;
        } else {
            hideFieldError('confirmError');
            document.getElementById('regConfirmPassword')?.classList.remove('error');
            currentFormValidity.isConfirmValid = true;
        }
    } else {
        currentFormValidity.isPasswordValid = true;
        currentFormValidity.isConfirmValid = true;
    }
    
    if (!agreement) {
        showFieldError('agreementError', 'agreement-error');
        currentFormValidity.isAgreementValid = false;
        isValid = false;
    } else {
        hideFieldError('agreementError');
        currentFormValidity.isAgreementValid = true;
    }
    
    updateRegisterButtonState();
    return isValid;
}

async function registerUser(userData) {
    try {
        const isEmailUnique = await checkEmailUnique(userData.email);
        if (!isEmailUnique) {
            showMessage('email-unique-error', 'error');
            return false;
        }
        
        const isPhoneUnique = await checkPhoneUnique(userData.phone);
        if (!isPhoneUnique) {
            showMessage('phone-unique-error', 'error');
            return false;
        }
        
        const isNicknameUnique = await checkNicknameUnique(userData.nickname);
        if (!isNicknameUnique) {
            showMessage('nickname-unique-error', 'error');
            return false;
        }
        
        const newUser = {
            id: Date.now(),
            phone: userData.phone,
            email: userData.email,
            birthDate: userData.birthDate,
            firstName: userData.firstName,
            lastName: userData.lastName,
            patronymic: userData.patronymic || '',
            nickname: userData.nickname,
            password: userData.password,
            role: 'user',
            agreementAccepted: true,
            createdAt: new Date().toISOString()
        };
        
        console.log('Отправка данных пользователя:', newUser);
        
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка регистрации: ${response.status} ${errorText}`);
        }
        
        const savedUser = await response.json();
        console.log('Пользователь успешно сохранен:', savedUser);
        
        showMessage('register-success', 'success');
        
        document.getElementById('registerFormContent')?.reset();
        
        setTimeout(() => {
            showLoginForm();
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showMessage('register-error', 'error', { error: error.message });
        return false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const isValid = validateRegistrationFormSync();
    if (!isValid) {
        showMessage('fill-fields-error', 'error');
        return;
    }
    
    if (!currentFormValidity.isNicknameUnique) {
        showMessage('nickname-unique-error', 'error');
        return;
    }
    
    const passwordMethod = document.querySelector('input[name="passwordMethod"]:checked')?.value;
    let password = '';
    
    if (passwordMethod === 'manual') {
        password = document.getElementById('regPassword').value;
    } else {
        password = document.getElementById('autoPassword').value;
    }
    
    const userData = {
        phone: document.getElementById('regPhone').value,
        email: document.getElementById('regEmail').value,
        birthDate: document.getElementById('regBirthDate').value,
        firstName: document.getElementById('regFirstName').value.trim(),
        lastName: document.getElementById('regLastName').value.trim(),
        patronymic: document.getElementById('regPatronymic').value.trim() || '',
        nickname: document.getElementById('regNickname').value.trim(),
        password: password,
        agreementAccepted: true
    };
    
    await registerUser(userData);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Очищаем предыдущие ошибки
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.classList.remove('show');
    }
    
    if (!email || !password) {
        showErrorMessageOnForm('loginError', 'fill-fields-error');
        return;
    }
    
    await loginUser(email, password);
}

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.add('active');
    
    resetGenerateAttempts();
    updateAgeHint();
    validateRegistrationFormSync();
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (registerTab) registerTab.classList.remove('active');
    if (loginTab) loginTab.classList.add('active');
}

function togglePasswordMethod() {
    const method = document.querySelector('input[name="passwordMethod"]:checked')?.value;
    const manualGroup = document.getElementById('manualPasswordGroup');
    const autoGroup = document.getElementById('autoPasswordGroup');
    
    if (method === 'manual') {
        if (manualGroup) manualGroup.style.display = 'block';
        if (autoGroup) autoGroup.style.display = 'none';
    } else {
        if (manualGroup) manualGroup.style.display = 'none';
        if (autoGroup) autoGroup.style.display = 'block';
        generateAutoPassword();
    }
    
    validateRegistrationFormSync();
}

function generateAutoPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    password += 'A';
    password += 'a';
    password += '1';
    password += '!';
    
    for (let i = 4; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    const autoPasswordInput = document.getElementById('autoPassword');
    if (autoPasswordInput) autoPasswordInput.value = password;
}

async function generateNickname() {
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    
    if (!firstName || !lastName) {
        showMessage('generate-firstname-lastname', 'error');
        return;
    }
    
    if (generateAttempts >= MAX_GENERATE_ATTEMPTS) {
        showMessage('generate-attempts-exhausted', 'error');
        enableManualNicknameInput();
        return;
    }
    
    generateAttempts++;
    const attemptsLeft = MAX_GENERATE_ATTEMPTS - generateAttempts;
    const attemptsInfo = document.getElementById('attemptsInfo');
    
    if (attemptsInfo) {
        attemptsInfo.textContent = translateErrorMessage('attempts-left', { attempts: attemptsLeft });
    }
    
    if (generateAttempts >= MAX_GENERATE_ATTEMPTS) {
        enableManualNicknameInput();
    }
    
    const newNickname = await generateUniqueNickname(firstName, lastName);
    const nicknameInput = document.getElementById('regNickname');
    if (nicknameInput) nicknameInput.value = newNickname;
    
    const isUnique = await checkNicknameUnique(newNickname);
    if (!isUnique) {
        showMessage('generate-error', 'error');
        currentFormValidity.isNicknameUnique = false;
    } else {
        showMessage('generate-success', 'success', { nickname: newNickname });
        currentFormValidity.isNicknameUnique = true;
        currentFormValidity.isNicknameValid = true;
        hideFieldError('nicknameError');
        if (nicknameInput) nicknameInput.classList.remove('error');
    }
    
    validateRegistrationFormSync();
}

function enableManualNicknameInput() {
    isManualNicknameMode = true;
    const nicknameInput = document.getElementById('regNickname');
    const generateBtn = document.getElementById('generateNicknameBtn');
    
    if (nicknameInput) {
        nicknameInput.readOnly = false;
        nicknameInput.placeholder = translateErrorMessage('nickname-manual-placeholder');
        if (!nicknameInput.value) {
            nicknameInput.value = '';
        }
    }
    
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.5';
        generateBtn.style.cursor = 'not-allowed';
        generateBtn.title = translateErrorMessage('generate-attempts-exhausted');
    }
    
    const attemptsInfo = document.getElementById('attemptsInfo');
    if (attemptsInfo) {
        attemptsInfo.textContent = translateErrorMessage('attempts-exhausted-warning');
        attemptsInfo.style.color = '#e74c3c';
    }
}

function resetGenerateAttempts() {
    generateAttempts = 0;
    isManualNicknameMode = false;
    
    const nicknameInput = document.getElementById('regNickname');
    const generateBtn = document.getElementById('generateNicknameBtn');
    
    if (nicknameInput) {
        nicknameInput.readOnly = true;
        nicknameInput.placeholder = translateErrorMessage('nickname-auto-placeholder');
        nicknameInput.value = '';
    }
    
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        generateBtn.style.cursor = 'pointer';
        generateBtn.title = '';
    }
    
    const attemptsInfo = document.getElementById('attemptsInfo');
    if (attemptsInfo) {
        attemptsInfo.textContent = translateErrorMessage('attempts-left', { attempts: 5 });
        attemptsInfo.style.color = '#5a7c85';
    }
    
    currentFormValidity.isNicknameValid = false;
    currentFormValidity.isNicknameUnique = false;
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function setupRealTimeValidation() {
    const inputs = ['regPhone', 'regEmail', 'regBirthDate', 'regFirstName', 'regLastName', 'regNickname', 'regPassword', 'regConfirmPassword'];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                const errorId = inputId.replace('reg', '').toLowerCase() + 'Error';
                const errorEl = document.getElementById(errorId);
                if (errorEl) {
                    errorEl.classList.remove('show');
                }
                input.classList.remove('error');
                
                validateRegistrationFormSync();
                
                if (inputId === 'regBirthDate') {
                    updateAgeHint();
                }
                
                if (inputId === 'regNickname' && input.value.length >= 3) {
                    checkNicknameUniqueness(input.value);
                }
            });
            
            input.addEventListener('blur', () => {
                validateRegistrationFormSync();
                if (inputId === 'regNickname' && input.value.length >= 3) {
                    checkNicknameUniqueness(input.value);
                }
            });
        }
    });
    
    const agreement = document.getElementById('agreement');
    if (agreement) {
        agreement.addEventListener('change', () => {
            validateRegistrationFormSync();
        });
    }
    
    const passwordMethodRadios = document.querySelectorAll('input[name="passwordMethod"]');
    passwordMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            validateRegistrationFormSync();
        });
    });
    
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');
    
    if (regPassword) {
        regPassword.addEventListener('input', () => {
            validateRegistrationFormSync();
        });
    }
    
    if (regConfirmPassword) {
        regConfirmPassword.addEventListener('input', () => {
            validateRegistrationFormSync();
        });
    }
    
    restrictNicknameInput();
}

function checkAdminMenu() {
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

function setupProfileLogout() {
    const observer = new MutationObserver(function(mutations) {
        const userIcon = document.querySelector('.user-icon');
        if (userIcon) {
            updateAuthUI();
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница регистрации загружена');
    
    checkAdminMenu();
    setupProfileLogout();
    
    const loginForm = document.getElementById('loginFormContent');
    const registerForm = document.getElementById('registerFormContent');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    
    if (loginTab) loginTab.addEventListener('click', showLoginForm);
    if (registerTab) registerTab.addEventListener('click', showRegisterForm);
    
    const passwordMethodRadios = document.querySelectorAll('input[name="passwordMethod"]');
    passwordMethodRadios.forEach(radio => {
        radio.addEventListener('change', togglePasswordMethod);
    });
    
    const generateBtn = document.getElementById('generateNicknameBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateNickname);
    }
    
    setupRealTimeValidation();
    
    generateAutoPassword();
    updateAgeHint();
    
    currentFormValidity = {
        isPhoneValid: false,
        isEmailValid: false,
        isBirthValid: false,
        isFirstNameValid: false,
        isLastNameValid: false,
        isNicknameValid: false,
        isPasswordValid: false,
        isConfirmValid: false,
        isAgreementValid: false,
        isNicknameUnique: false
    };
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    const submitBtn = document.getElementById('registerSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;
});

window.togglePasswordVisibility = togglePasswordVisibility;
window.generateNickname = generateNickname;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.logout = logout;
window.updateAuthUI = updateAuthUI;