// Система переключения аккаунтов

class AccountManager {
    constructor() {
        this.accounts = this.loadAccounts();
        this.currentAccountId = localStorage.getItem('currentAccountId');
    }

    // Загрузить все аккаунты
    loadAccounts() {
        const accountsData = localStorage.getItem('wallnux_accounts');
        return accountsData ? JSON.parse(accountsData) : [];
    }

    // Сохранить аккаунты
    saveAccounts() {
        localStorage.setItem('wallnux_accounts', JSON.stringify(this.accounts));
    }

    // Добавить аккаунт
    addAccount(userData, token) {
        const account = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar,
            token: token,
            lastLogin: Date.now()
        };

        // Проверить есть ли уже такой аккаунт
        const existingIndex = this.accounts.findIndex(a => a.id === userData.id);
        if (existingIndex >= 0) {
            // Обновить существующий
            this.accounts[existingIndex] = account;
        } else {
            // Добавить новый
            this.accounts.push(account);
        }

        this.saveAccounts();
        this.setCurrentAccount(userData.id);
        
        console.log('✅ Аккаунт добавлен:', userData.username);
    }

    // Установить текущий аккаунт
    setCurrentAccount(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) {
            console.error('❌ Аккаунт не найден');
            return false;
        }

        // Установить токен и данные пользователя
        localStorage.setItem('token', account.token);
        localStorage.setItem('currentUser', JSON.stringify({
            id: account.id,
            username: account.username,
            email: account.email,
            avatar: account.avatar
        }));
        localStorage.setItem('currentAccountId', account.id);

        this.currentAccountId = account.id;

        // Обновить время последнего входа
        account.lastLogin = Date.now();
        this.saveAccounts();

        console.log('✅ Переключено на аккаунт:', account.username);
        return true;
    }

    // Получить текущий аккаунт
    getCurrentAccount() {
        return this.accounts.find(a => a.id === this.currentAccountId);
    }

    // Получить все аккаунты
    getAllAccounts() {
        return this.accounts;
    }

    // Удалить аккаунт
    removeAccount(accountId) {
        this.accounts = this.accounts.filter(a => a.id !== accountId);
        this.saveAccounts();

        // Если удалили текущий аккаунт
        if (this.currentAccountId === accountId) {
            if (this.accounts.length > 0) {
                // Переключиться на первый доступный
                this.setCurrentAccount(this.accounts[0].id);
            } else {
                // Выйти полностью
                this.logout();
            }
        }

        console.log('✅ Аккаунт удален');
    }

    // Выйти из текущего аккаунта
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentAccountId');
        this.currentAccountId = null;
        window.location.href = 'login.html';
    }

    // Выйти из всех аккаунтов
    logoutAll() {
        localStorage.removeItem('wallnux_accounts');
        this.logout();
    }
}

// Глобальный экземпляр
window.accountManager = new AccountManager();

// Инициализация переключателя аккаунтов в UI
function initializeAccountSwitcher() {
    console.log('🔄 Инициализация переключателя аккаунтов');

    // Создать меню переключения аккаунтов
    createAccountSwitcherMenu();

    // Обработчик для кнопки переключения
    const userPanel = document.querySelector('.user-panel');
    if (userPanel) {
        userPanel.addEventListener('click', (e) => {
            if (e.target.closest('.switch-account-btn')) {
                toggleAccountSwitcher();
            }
        });
    }
}

// Создать меню переключения аккаунтов
function createAccountSwitcherMenu() {
    // Проверить есть ли уже меню
    if (document.getElementById('accountSwitcherMenu')) return;

    const menu = document.createElement('div');
    menu.id = 'accountSwitcherMenu';
    menu.className = 'account-switcher-menu hidden';
    menu.innerHTML = `
        <div class="account-switcher-header">
            <h3>Аккаунты</h3>
            <button class="close-switcher">×</button>
        </div>
        <div class="account-list" id="accountList">
            <!-- Список аккаунтов -->
        </div>
        <button class="add-account-btn" onclick="addNewAccount()">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Добавить аккаунт
        </button>
    `;

    document.body.appendChild(menu);

    // Обработчик закрытия
    menu.querySelector('.close-switcher').addEventListener('click', () => {
        menu.classList.add('hidden');
    });

    // Закрытие по клику вне меню
    menu.addEventListener('click', (e) => {
        if (e.target === menu) {
            menu.classList.add('hidden');
        }
    });

    // Обновить список аккаунтов
    updateAccountList();
}

// Обновить список аккаунтов
function updateAccountList() {
    const accountList = document.getElementById('accountList');
    if (!accountList) return;

    const accounts = window.accountManager.getAllAccounts();
    const currentAccountId = window.accountManager.currentAccountId;

    accountList.innerHTML = '';

    if (accounts.length === 0) {
        accountList.innerHTML = '<div class="no-accounts">Нет сохраненных аккаунтов</div>';
        return;
    }

    accounts.forEach(account => {
        const isCurrent = account.id === currentAccountId;
        const accountItem = document.createElement('div');
        accountItem.className = `account-item ${isCurrent ? 'current' : ''}`;
        accountItem.innerHTML = `
            <div class="account-avatar">
                ${account.avatar || account.username.charAt(0).toUpperCase()}
            </div>
            <div class="account-info">
                <div class="account-name">${account.username}</div>
                <div class="account-email">${account.email}</div>
            </div>
            ${isCurrent ? '<span class="current-badge">Текущий</span>' : ''}
            ${!isCurrent ? `<button class="remove-account-btn" onclick="removeAccount(${account.id})">×</button>` : ''}
        `;

        if (!isCurrent) {
            accountItem.addEventListener('click', () => switchToAccount(account.id));
        }

        accountList.appendChild(accountItem);
    });
}

// Переключить меню аккаунтов
function toggleAccountSwitcher() {
    const menu = document.getElementById('accountSwitcherMenu');
    if (menu) {
        menu.classList.toggle('hidden');
        if (!menu.classList.contains('hidden')) {
            updateAccountList();
        }
    }
}

// Переключиться на аккаунт
function switchToAccount(accountId) {
    console.log('🔄 Переключение на аккаунт:', accountId);
    
    if (window.accountManager.setCurrentAccount(accountId)) {
        // Перезагрузить страницу
        window.location.reload();
    }
}

// Добавить новый аккаунт
function addNewAccount() {
    console.log('➕ Добавление нового аккаунта');
    
    // Сохранить текущее состояние
    localStorage.setItem('addingNewAccount', 'true');
    
    // Перейти на страницу входа
    window.location.href = 'login.html';
}

// Удалить аккаунт
function removeAccount(accountId) {
    if (confirm('Вы уверены что хотите удалить этот аккаунт?')) {
        window.accountManager.removeAccount(accountId);
        updateAccountList();
    }
}

// Инициализация при загрузке (только на index.html, не на login.html)
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAccountSwitcher);
    } else {
        initializeAccountSwitcher();
    }
}

console.log('✅ Account Switcher загружен');
