let currentTheme = localStorage.getItem('theme') || 'light';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    
    updateActiveThemeButton(theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
    
    changeImagesForTheme(theme);
    
    if (window.ToastManager) {
        window.ToastManager.show(`Тема: ${theme === 'dark' ? 'Темная' : 'Светлая'}`, 'info', 1500);
    }
}

function changeImagesForTheme(theme) {
    const themeImages = document.querySelectorAll('[data-theme-img]');
    themeImages.forEach(img => {
        const lightSrc = img.getAttribute('data-light-src');
        const darkSrc = img.getAttribute('data-dark-src');
        if (theme === 'dark' && darkSrc) {
            img.src = darkSrc;
        } else if (lightSrc) {
            img.src = lightSrc;
        }
    });
}

function updateActiveThemeButton(theme) {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

function createThemeSwitcher() {
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher';
    themeSwitcher.innerHTML = `
        <button class="theme-btn" data-theme="light" title="Светлая тема">☀️</button>
        <button class="theme-btn" data-theme="dark" title="Темная тема">🌙</button>
    `;
    
    const headerRight = document.querySelector('.header-line .nav-right');
    if (headerRight) {
        headerRight.appendChild(themeSwitcher);
    }
    
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
        });
    });
}

function addThemeSwitcherStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .theme-switcher {
            display: flex;
            gap: 8px;
            margin-left: 15px;
        }
        .theme-btn {
            background: var(--btn-bg, transparent);
            border: 1px solid var(--btn-border, #264A51);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            background-color: var(--bg-card, #F1F6F9);
        }
        .theme-btn.active {
            background: var(--border-color, #264A51);
            border-color: var(--border-color, #264A51);
        }
        .theme-btn:hover {
            transform: scale(1.1);
            background: var(--bg-hover, #71B3C6);
        }
        @media (max-width: 768px) {
            .theme-switcher {
                margin-left: 8px;
            }
            .theme-btn {
                width: 32px;
                height: 32px;
                font-size: 16px;
            }
        }
    `;
    document.head.appendChild(style);
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addThemeSwitcherStyles();
        createThemeSwitcher();
        initTheme();
    });
} else {
    addThemeSwitcherStyles();
    createThemeSwitcher();
    initTheme();
}