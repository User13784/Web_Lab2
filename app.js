const API_BASE_URL = 'https://rickandmortyapi.com/api';

let currentPage = 1;
let currentGender = 'all';
let currentSearchQuery = '';
let isLoading = false;
let hasMorePages = true;
let allCharacters = [];
let currentTotalPages = 0;

const charactersGrid = document.getElementById('charactersGrid');
const genderSelect = document.getElementById('genderSelect');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const noResultsDiv = document.getElementById('noResults');
const resultsInfo = document.getElementById('resultsInfo');

function showLoading(show) {
    isLoading = show;
    if (show) {
        loadingIndicator.classList.remove('hidden');
        if (loadMoreBtn) loadMoreBtn.disabled = true;
    } else {
        loadingIndicator.classList.add('hidden');
        if (loadMoreBtn) loadMoreBtn.disabled = false;
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'alive':
            return 'status-alive';
        case 'dead':
            return 'status-dead';
        default:
            return 'status-unknown';
    }
}

function getStatusEmoji(status) {
    switch (status.toLowerCase()) {
        case 'alive':
            return '💚';
        case 'dead':
            return '💀';
        default:
            return '❓';
    }
}

function createCharacterCard(character) {
    return `
        <div class="character-card" data-id="${character.id}">
            <img class="card-image" src="${character.image}" alt="${character.name}" loading="lazy">
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(character.name)}</h3>
                <div class="card-info">
                    <div class="info-item">
                        <span>${getStatusEmoji(character.status)}</span>
                        <span class="status-badge ${getStatusClass(character.status)}">
                            ${character.status}
                        </span>
                    </div>
                    <div class="info-item">
                        <span>🎭</span>
                        <span>${character.species}</span>
                    </div>
                    <div class="info-item">
                        <span>⚥</span>
                        <span>${character.gender}</span>
                    </div>
                    <div class="info-item">
                        <span>📍</span>
                        <span>${escapeHtml(character.origin.name)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return 'Unknown';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderCharacters(characters) {
    console.log('Rendering characters:', characters.length);
    
    if (!charactersGrid) {
        console.error('charactersGrid element not found!');
        return;
    }
    
    if (characters.length === 0) {
        charactersGrid.innerHTML = '';
        if (noResultsDiv) noResultsDiv.classList.remove('hidden');
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        if (resultsInfo) resultsInfo.textContent = '';
        return;
    }

    if (noResultsDiv) noResultsDiv.classList.add('hidden');
    if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
    
    const cardsHtml = characters.map(character => createCharacterCard(character)).join('');
    charactersGrid.innerHTML = cardsHtml;
    
    if (resultsInfo) {
        resultsInfo.textContent = `Найдено персонажей: ${characters.length}`;
    }
}

async function fetchFromAPI(page, gender, searchQuery) {
    try {
        let url = `${API_BASE_URL}/character/?page=${page}`;
        
        if (gender !== 'all') {
            url += `&gender=${gender}`;
        }
        
        if (searchQuery && searchQuery.trim() !== '') {
            url += `&name=${encodeURIComponent(searchQuery.trim())}`;
        }
        
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                return { characters: [], hasMore: false, totalPages: 0 };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        return {
            characters: data.results,
            hasMore: data.info.next !== null,
            totalPages: data.info.pages
        };
    } catch (error) {
        console.error('Error fetching characters:', error);
        return {
            characters: [],
            hasMore: false,
            totalPages: 0
        };
    }
}

async function loadCharacters(reset = true) {
    if (isLoading) return;
    
    if (reset) {
        currentPage = 1;
        allCharacters = [];
        hasMorePages = true;
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load more';
        }
    }
    
    showLoading(true);
    
    const result = await fetchFromAPI(currentPage, currentGender, currentSearchQuery);
    
    if (result.characters && result.characters.length > 0) {
        if (reset) {
            allCharacters = result.characters;
        } else {
            allCharacters = [...allCharacters, ...result.characters];
        }
        
        renderCharacters(allCharacters);
        hasMorePages = result.hasMore;
        
        if (hasMorePages && !reset) {
            currentPage++;
        } else if (reset && hasMorePages) {
            currentPage++;
        }
        
        if (!hasMorePages && loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Все персонажи загружены';
        }
    } else {
        if (reset) {
            renderCharacters([]);
        }
        hasMorePages = false;
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
        }
    }
    
    showLoading(false);
}

async function loadMoreCharacters() {
    if (isLoading || !hasMorePages) return;
    await loadCharacters(false);
}

function handleGenderChange() {
    currentGender = genderSelect.value;
    loadCharacters(true);
}

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearchQuery = searchInput.value;
        loadCharacters(true);
        
        if (currentSearchQuery.length > 0) {
            clearSearchBtn.classList.add('visible');
        } else {
            clearSearchBtn.classList.remove('visible');
        }
    }, 500);
}

function clearSearch() {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.remove('visible');
    loadCharacters(true);
    searchInput.focus();
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        currentSearchQuery = searchInput.value;
        loadCharacters(true);
    }
}

function initEventListeners() {
    if (genderSelect) {
        genderSelect.addEventListener('change', handleGenderChange);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', handleKeyPress);
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreCharacters);
    }
}

async function init() {
    console.log('Initializing app...');
    
    if (!charactersGrid) {
        console.error('charactersGrid element not found! Check HTML structure.');
        return;
    }
    
    initEventListeners();
    
    if (searchInput) {
        searchInput.focus();
    }
    
    await loadCharacters(true);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}