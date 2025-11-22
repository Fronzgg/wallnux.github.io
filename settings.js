// Настройки - полный функционал

let currentQRCode = null;
let currentAccessCode = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    loadUserSettings();
    loadDevices();
    loadSavedAccounts();
});

// Инициализация настроек
function initializeSettings() {
    // Переключение категорий
    const categories = document.querySelectorAll('.settings-category');
    categories.forEach(category => {
        category.addEventListener('click', () => {
            const categoryName = category.dataset.category;
            switchCategory(categoryName);
        });
    });

    // Вкладки устройств
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchDeviceTab(tabName);
        });
    });

    // Форма смены пароля
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }

    // Настройки приватности
    const dmPrivacy = document.getElementById('dmPrivacy');
    const callPrivacy = document.getElementById('callPrivacy');
    const showOnlineStatus = document.getElementById('showOnlineStatus');

    if (dmPrivacy) dmPrivacy.addEventListener('change', savePrivacySettings);
    if (callPrivacy) callPrivacy.addEventListener('change', savePrivacySettings);
    if (showOnlineStatus) showOnlineStatus.addEventListener('change', savePrivacySettings);

    // Генерировать первый QR код
    generateQRCode();
}

// Переключение категорий
function switchCategory(categoryName) {
    // Обновить активную категорию
    document.querySelectorAll('.settings-category').forEach(cat => {
        cat.classList.remove('active');
    });
    document.querySelector(`[data-category="${categoryName}"]`).classList.add('active');

    // Показать соответствующую секцию
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${categoryName}-section`).classList.add('active');

    // Специальные действия для категорий
    if (categoryName === 'devices') {
        loadDevices();
        generateQRCode();
    } else if (categoryName === 'accounts') {
        loadSavedAccounts();
    }
}

// Переключение вкладок устройств
function switchDeviceTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');

    if (tabName === 'qr') {
        generateQRCode();
    } else if (tabName === 'code') {
        generateAccessCode();
    }
}

// Загрузить настройки пользователя
async function loadUserSettings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const settings = await response.json();
            
            // Применить настройки приватности
            if (settings.dmPrivacy) {
                document.getElementById('dmPrivacy').value = settings.dmPrivacy;
            }
            if (settings.callPrivacy) {
                document.getElementById('callPrivacy').value = settings.callPrivacy;
            }
            if (typeof settings.showOnlineStatus === 'boolean') {
                document.getElementById('showOnlineStatus').checked = settings.showOnlineStatus;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}

// Сохранить настройки приватности
async function savePrivacySettings() {
    const settings = {
        dmPrivacy: document.getElementById('dmPrivacy').value,
        callPrivacy: document.getElementById('callPrivacy').value,
        showOnlineStatus: document.getElementById('showOnlineStatus').checked
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            showNotification('Настройки сохранены', 'success');
        } else {
            showNotification('Ошибка сохранения настроек', 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        showNotification('Ошибка сети', 'error');
    }
}

// Смена пароля
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Пароль должен быть минимум 6 символов', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Пароль успешно изменен', 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            showNotification(data.error || 'Ошибка смены пароля', 'error');
        }
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        showNotification('Ошибка сети', 'error');
    }
}

// Загрузить устройства
async function loadDevices() {
    const devicesList = document.getElementById('devicesList');
    if (!devicesList) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/devices', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const devices = await response.json();
            displayDevices(devices);
        } else {
            devicesList.innerHTML = '<div class="loading">Ошибка загрузки устройств</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки устройств:', error);
        devicesList.innerHTML = '<div class="loading">Ошибка сети</div>';
    }
}

// Отобразить устройства
function displayDevices(devices) {
    const devicesList = document.getElementById('devicesList');
    
    if (devices.length === 0) {
        devicesList.innerHTML = '<div class="loading">Нет активных устройств</div>';
        return;
    }

    devicesList.innerHTML = '';

    devices.forEach(device => {
        const deviceEl = document.createElement('div');
        deviceEl.className = 'device-item';
        
        const isCurrentDevice = device.token === localStorage.getItem('token');
        
        deviceEl.innerHTML = `
            <div class="device-icon">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/>
                </svg>
            </div>
            <div class="device-info">
                <div class="device-name">${device.browser} на ${device.os}</div>
                <div class="device-details">
                    IP: ${device.ip} • Последняя активность: ${formatDate(device.lastActive)}
                </div>
            </div>
            ${isCurrentDevice ? 
                '<span class="device-current">Текущее устройство</span>' : 
                `<button class="device-remove" onclick="removeDevice('${device.id}')">Удалить</button>`
            }
        `;
        
        devicesList.appendChild(deviceEl);
    });
}

// Удалить устройство
async function removeDevice(deviceId) {
    if (!confirm('Вы уверены что хотите удалить это устройство?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/devices/${deviceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showNotification('Устройство удалено', 'success');
            loadDevices();
        } else {
            showNotification('Ошибка удаления устройства', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления устройства:', error);
        showNotification('Ошибка сети', 'error');
    }
}

// Сбросить все сеансы
async function resetAllSessions() {
    if (!confirm('Вы уверены? Это выйдет из всех устройств кроме текущего.')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/devices/reset-all', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showNotification('Все сеансы сброшены', 'success');
            loadDevices();
        } else {
            showNotification('Ошибка сброса сеансов', 'error');
        }
    } catch (error) {
        console.error('Ошибка сброса сеансов:', error);
        showNotification('Ошибка сети', 'error');
    }
}

// Генерировать QR код
async function generateQRCode() {
    const qrContainer = document.getElementById('deviceQRCode');
    if (!qrContainer) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/generate-login-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type: 'qr' })
        });

        if (response.ok) {
            const data = await response.json();
            currentQRCode = data.code;

            // Очистить предыдущий QR
            qrContainer.innerHTML = '';

            // Создать новый QR
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: `wallnux://login?code=${data.code}`,
                    width: 170,
                    height: 170,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                
                // Добавить текст под QR
                const infoText = document.createElement('p');
                infoText.style.cssText = 'margin-top: 10px; color: #b9bbbe; font-size: 12px; text-align: center;';
                infoText.textContent = 'Отсканируйте QR код в мобильном приложении';
                qrContainer.appendChild(infoText);
            } else {
                qrContainer.innerHTML = '<p style="color: #ed4245;">QR библиотека не загружена</p>';
            }

            // Обновлять QR каждые 5 минут
            setTimeout(() => {
                if (document.querySelector('.tab-content.active')?.id === 'qr-content') {
                    generateQRCode();
                }
            }, 300000);
        } else {
            qrContainer.innerHTML = '<p style="color: #ed4245;">Ошибка генерации QR</p>';
        }
    } catch (error) {
        console.error('Ошибка генерации QR:', error);
        qrContainer.innerHTML = '<p style="color: #ed4245;">Ошибка генерации QR</p>';
    }
}

// Генерировать код доступа
async function generateAccessCode() {
    const codeDisplay = document.getElementById('accessCodeDisplay');
    if (!codeDisplay) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/generate-login-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type: 'access' })
        });

        if (response.ok) {
            const data = await response.json();
            currentAccessCode = data.code;
            codeDisplay.textContent = data.code;

            // Обновлять код каждые 5 минут
            setTimeout(() => {
                if (document.querySelector('.tab-content.active')?.id === 'code-content') {
                    generateAccessCode();
                }
            }, 300000);
        } else {
            codeDisplay.textContent = 'ОШИБКА';
        }
    } catch (error) {
        console.error('Ошибка генерации кода:', error);
        codeDisplay.textContent = 'ОШИБКА';
    }
}

// Обновить код доступа
function generateNewCode() {
    generateAccessCode();
}

// Загрузить сохраненные аккаунты
function loadSavedAccounts() {
    const accountsList = document.getElementById('savedAccountsList');
    if (!accountsList) return;

    const accounts = window.accountManager ? window.accountManager.getAllAccounts() : [];
    const currentAccountId = localStorage.getItem('currentAccountId');

    if (accounts.length === 0) {
        accountsList.innerHTML = '<div class="loading">Нет сохраненных аккаунтов</div>';
        return;
    }

    accountsList.innerHTML = '';

    accounts.forEach(account => {
        const isCurrent = account.id == currentAccountId;
        const accountEl = document.createElement('div');
        accountEl.className = `saved-account-card ${isCurrent ? 'current' : ''}`;
        
        accountEl.innerHTML = `
            <div class="account-avatar-large">
                ${account.avatar || account.username.charAt(0).toUpperCase()}
            </div>
            <div class="account-info-large">
                <div class="account-name-large">${account.username}</div>
                <div class="account-email-large">${account.email}</div>
            </div>
            <div class="account-actions">
                ${!isCurrent ? 
                    `<button class="switch-btn" onclick="switchToAccount(${account.id})">Переключиться</button>` : 
                    '<span class="device-current">Текущий</span>'
                }
                ${!isCurrent ? 
                    `<button class="remove-btn" onclick="removeAccount(${account.id})">Удалить</button>` : ''
                }
            </div>
        `;
        
        accountsList.appendChild(accountEl);
    });
}

// Переключиться на аккаунт
function switchToAccount(accountId) {
    if (window.accountManager && window.accountManager.setCurrentAccount(accountId)) {
        window.location.href = 'index.html';
    }
}

// Удалить аккаунт
function removeAccount(accountId) {
    if (confirm('Вы уверены что хотите удалить этот аккаунт?')) {
        if (window.accountManager) {
            window.accountManager.removeAccount(accountId);
            loadSavedAccounts();
        }
    }
}

// Добавить новый аккаунт
function addNewAccount() {
    localStorage.setItem('addingNewAccount', 'true');
    window.location.href = 'login.html';
}

// Форматирование даты
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// Уведомления
function showNotification(message, type = 'info') {
    // Создать уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Стили для уведомления
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: '500',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease'
    });
    
    if (type === 'success') {
        notification.style.background = '#248046';
    } else if (type === 'error') {
        notification.style.background = '#ed4245';
    } else {
        notification.style.background = '#5865f2';
    }
    
    document.body.appendChild(notification);
    
    // Удалить через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

console.log('✅ Settings загружены');
