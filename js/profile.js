class ProfileModal {
    constructor() {
        this.createModal();
        this.init();
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.id = 'profileModal';
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h2>👤 Личные данные</h2>
                    <span class="profile-modal-close">&times;</span>
                </div>
                <div class="profile-modal-body">
                    <form id="profileForm">
                        <div class="form-group">
                            <label>Имя</label>
                            <input type="text" id="profileFirstName" readonly>
                        </div>
                        <div class="form-group">
                            <label>Фамилия</label>
                            <input type="text" id="profileLastName" readonly>
                        </div>
                        <div class="form-group">
                            <label>Отчество</label>
                            <input type="text" id="profilePatronymic" readonly>
                        </div>
                        <div class="form-group">
                            <label>Никнейм</label>
                            <input type="text" id="profileNickname" readonly>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="profileEmail" readonly>
                        </div>
                        <div class="form-group">
                            <label>Телефон</label>
                            <input type="tel" id="profilePhone" readonly>
                        </div>
                        <div class="form-group">
                            <label>Дата рождения</label>
                            <input type="text" id="profileBirthDate" readonly>
                        </div>
                        <div class="form-group">
                            <label>Тема</label>
                            <select id="profileTheme">
                                <option value="light">Светлая</option>
                                <option value="dark">Темная</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Язык</label>
                            <select id="profileLanguage">
                                <option value="en">English</option>
                                <option value="ru">Русский</option>
                            </select>
                        </div>
                        <div class="profile-buttons">
                            <button type="button" class="edit-profile-btn" id="editProfileBtn">✏️ Редактировать</button>
                            <button type="button" class="save-profile-btn" id="saveProfileBtn" style="display: none;">💾 Сохранить</button>
                            <button type="button" class="reset-settings-btn" id="resetSettingsBtn">🔄 Сбросить настройки</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    init() {
        const closeBtn = document.querySelector('.profile-modal-close');
        const modal = document.getElementById('profileModal');
        const editBtn = document.getElementById('editProfileBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        const resetBtn = document.getElementById('resetSettingsBtn');
        const themeSelect = document.getElementById('profileTheme');
        const langSelect = document.getElementById('profileLanguage');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });
        }
        
        // Редактирование
        if (editBtn) {
            editBtn.addEventListener('click', () => this.enableEditing());
        }
        
        // Сохранение
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }
        
        // Сброс настроек
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }
        
        // Изменение темы
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                if (window.applyTheme) {
                    window.applyTheme(e.target.value);
                }
            });
        }
        
        // Изменение языка
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                if (window.translatePage) {
                    window.translatePage(e.target.value);
                }
            });
        }
        
        this.createUserIcon();
    }
    
    createUserIcon() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        const headerLeft = document.querySelector('.nav-left');
        if (headerLeft && !document.querySelector('.user-icon')) {
            const userIcon = document.createElement('div');
            userIcon.className = 'user-icon';
            userIcon.innerHTML = `
                <img src="../assets/icons/human.png" alt="profile">
                <span>${user.nickname || user.firstName}</span>
            `;
            userIcon.addEventListener('click', () => this.open());
            headerLeft.appendChild(userIcon);
        }
    }
    
    getCurrentUser() {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    }
    
    open() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'register.html';
            return;
        }
        
        document.getElementById('profileFirstName').value = user.firstName || '';
        document.getElementById('profileLastName').value = user.lastName || '';
        document.getElementById('profilePatronymic').value = user.patronymic || '';
        document.getElementById('profileNickname').value = user.nickname || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileBirthDate').value = user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '';
        
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('language') || 'en';
        
        document.getElementById('profileTheme').value = savedTheme;
        document.getElementById('profileLanguage').value = savedLang;
        
        const modal = document.getElementById('profileModal');
        if (modal) modal.classList.add('active');
    }
    
    close() {
        const modal = document.getElementById('profileModal');
        if (modal) modal.classList.remove('active');
        this.disableEditing();
    }
    
    enableEditing() {
        const inputs = ['profileFirstName', 'profileLastName', 'profilePatronymic', 'profileNickname', 'profileEmail', 'profilePhone'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.readOnly = false;
        });
        
        document.getElementById('editProfileBtn').style.display = 'none';
        document.getElementById('saveProfileBtn').style.display = 'inline-block';
    }
    
    disableEditing() {
        const inputs = ['profileFirstName', 'profileLastName', 'profilePatronymic', 'profileNickname', 'profileEmail', 'profilePhone'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.readOnly = true;
        });
        
        document.getElementById('editProfileBtn').style.display = 'inline-block';
        document.getElementById('saveProfileBtn').style.display = 'none';
    }
    
    async saveProfile() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        const updatedData = {
            firstName: document.getElementById('profileFirstName').value,
            lastName: document.getElementById('profileLastName').value,
            patronymic: document.getElementById('profilePatronymic').value,
            nickname: document.getElementById('profileNickname').value,
            email: document.getElementById('profileEmail').value,
            phone: document.getElementById('profilePhone').value
        };
        
        try {
            const response = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                const updatedUser = { ...user, ...updatedData };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                ToastManager.show('Данные успешно обновлены', 'success');
                this.disableEditing();
                
                const userIconSpan = document.querySelector('.user-icon span');
                if (userIconSpan) userIconSpan.textContent = updatedUser.nickname || updatedUser.firstName;
            } else {
                throw new Error('Ошибка сохранения');
            }
        } catch (error) {
            ToastManager.show('Ошибка при сохранении данных', 'error');
        }
    }
    
    resetSettings() {
        localStorage.removeItem('theme');
        if (window.applyTheme) window.applyTheme('light');
        
        localStorage.removeItem('language');
        if (window.translatePage) window.translatePage('en');
        
        document.getElementById('profileTheme').value = 'light';
        document.getElementById('profileLanguage').value = 'en';
        
        ToastManager.show('Настройки сброшены до значений по умолчанию', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.profileModal = new ProfileModal();
});