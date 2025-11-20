// Поиск пользователей как в Telegram
// Без системы друзей - просто поиск и ЛС

class TelegramSearch {
    constructor() {
        this.searchInput = null;
        this.resultsContainer = null;
        this.init();
    }

    init() {
        // Создаем интерфейс поиска
        this.createSearchInterface();
        this.setupEventListeners();
    }

    createSearchInterface() {
        const friendsContent = document.querySelector('.friends-content');
        if (!friendsContent) return;

        friendsContent.innerHTML = `
            <div class="telegram-search-container">
                <div class="search-header">
                    <h2>Контакты</h2>
                    <p>Найдите пользователя и начните общение</p>
                </div>
                
                <div class="search-input-wrapper">
                    <input type="text" 
                           id="telegramSearchInput" 
                           placeholder="🔍 Поиск пользователей..." 
                           autocomplete="off">
                </div>
                
                <div id="telegramSearchResults" class="search-results-list"></div>
            </div>
        `;

        this.searchInput = document.getElementById('telegramSearchInput');
        this.resultsContainer = document.getElementById('telegramSearchResults');
    }

    setupEventListeners() {
        if (!this.searchInput) return;

        // Поиск при вводе (с задержкой)
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.resultsContainer.innerHTML = '<div class="search-hint">Введите минимум 2 символа</div>';
                return;
            }

            searchTimeout = setTimeout(() => {
                this.searchUsers(query);
            }, 300);
        });
    }

    async searchUsers(query) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showError('Необходимо войти в аккаунт');
                return;
            }

            this.resultsContainer.innerHTML = '<div class="search-loading">Поиск...</div>';

            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Server error');

            const users = await response.json();
            const currentUserId = JSON.parse(atob(token.split('.')[1])).id;

            const results = users.filter(u => 
                u.username.toLowerCase().includes(query.toLowerCase()) && 
                u.id !== currentUserId
            );

            this.displayResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Ошибка поиска');
        }
    }

    displayResults(users) {
        if (users.length === 0) {
            this.resultsContainer.innerHTML = '<div class="search-empty">Пользователи не найдены</div>';
            return;
        }

        this.resultsContainer.innerHTML = '';

        users.forEach(user => {
            const userCard = this.createUserCard(user);
            this.resultsContainer.appendChild(userCard);
        });
    }

    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'telegram-user-card';
        
        const avatar = user.avatar || user.username.charAt(0).toUpperCase();
        const statusClass = user.status || 'offline';
        
        card.innerHTML = `
            <div class="user-card-avatar">
                <div class="avatar-circle">${avatar}</div>
                <span class="status-indicator ${statusClass}"></span>
            </div>
            <div class="user-card-info">
                <div class="user-card-name">${user.username}</div>
                <div class="user-card-status">${this.getStatusText(user.status)}</div>
            </div>
            <div class="user-card-actions">
                <button class="action-btn message-btn" title="Написать">
                    💬
                </button>
                <button class="action-btn call-btn" title="Позвонить">
                    📞
                </button>
                <button class="action-btn video-btn" title="Видеозвонок">
                    📹
                </button>
            </div>
        `;

        // Обработчики
        card.querySelector('.message-btn').onclick = () => this.openChat(user);
        card.querySelector('.call-btn').onclick = () => this.startCall(user, 'audio');
        card.querySelector('.video-btn').onclick = () => this.startCall(user, 'video');

        return card;
    }

    getStatusText(status) {
        const statuses = {
            'online': 'В сети',
            'idle': 'Не активен',
            'dnd': 'Не беспокоить',
            'offline': 'Не в сети'
        };
        return statuses[status] || 'Не в сети';
    }

    openChat(user) {
        console.log('Открытие чата с:', user.username);
        // Используем существующую функцию startDM
        if (window.startDM) {
            window.startDM(user.id, user.username, user.avatar);
        }
    }

    startCall(user, type) {
        console.log(`Звонок ${type} пользователю:`, user.username);
        // Используем существующую функцию initiateCall
        if (window.initiateCall) {
            window.initiateCall(user.id, type);
        }
    }

    showError(message) {
        this.resultsContainer.innerHTML = `<div class="search-error">${message}</div>`;
    }
}

// Инициализация при переключении на вкладку Friends
window.initTelegramSearch = function() {
    if (!window.telegramSearch) {
        window.telegramSearch = new TelegramSearch();
    }
};

// Автоинициализация при загрузке если на вкладке Friends
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем при клике на Friends
    const friendsBtn = document.querySelector('[onclick*="showFriends"]');
    if (friendsBtn) {
        const originalOnclick = friendsBtn.onclick;
        friendsBtn.onclick = function() {
            if (originalOnclick) originalOnclick.call(this);
            setTimeout(() => window.initTelegramSearch(), 100);
        };
    }
});
