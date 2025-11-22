// Устройства и QR функционал

// Обработчики приватности
function initPrivacyHandlers() {
    const dmPrivacy = document.getElementById('dmPrivacy');
    const callPrivacy = document.getElementById('callPrivacy');
    const showOnlineStatus = document.getElementById('showOnlineStatus');

    // Загрузить текущие настройки
    loadPrivacySettings();

    if (dmPrivacy) dmPrivacy.addEventListener('change', savePrivacySettings);
    if (callPrivacy) callPrivacy.addEventListener('change', savePrivacySettings);
    if (showOnlineStatus) {
        showOnlineStatus.addEventListener('click', () => {
            showOnlineStatus.classList.toggle('active');
            savePrivacySettings();
        });
    }
}

async function loadPrivacySettings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const settings = await response.json();
            
            const dmPrivacy = document.getElementById('dmPrivacy');
            const callPrivacy = document.getElementById('callPrivacy');
            const showOnlineStatus = document.getElementById('showOnlineStatus');
            
            if (dmPrivacy && settings.dmPrivacy) dmPrivacy.value = settings.dmPrivacy;
            if (callPrivacy && settings.callPrivacy) callPrivacy.value = settings.callPrivacy;
            if (showOnlineStatus && settings.showOnlineStatus) {
                if (settings.showOnlineStatus) {
                    showOnlineStatus.classList.add('active');
                } else {
                    showOnlineStatus.classList.remove('active');
                }
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек приватности:', error);
    }
}

async function savePrivacySettings() {
    const dmPrivacy = document.getElementById('dmPrivacy');
    const callPrivacy = document.getElementById('callPrivacy');
    const showOnlineStatus = document.getElementById('showOnlineStatus');

    const settings = {
        dmPrivacy: dmPrivacy?.value || 'friends',
        callPrivacy: callPrivacy?.value || 'friends',
        showOnlineStatus: showOnlineStatus?.classList.contains('active') || false
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
            showSettingsNotification('Настройки сохранены', 'success');
        }
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
    }
}

// Обработчики устройств
function initDevicesHandlers() {
    const resetAllSessions = document.getElementById('resetAllSessions');
    const showQRCode = document.getElementById('showQRCode');
    const showAccessCode = document.getElementById('showAccessCode');

    if (resetAllSessions) {
        resetAllSessions.addEventListener('click', handleResetAllSessions);
    }

    if (showQRCode) {
        showQRCode.addEventListener('click', () => displayLoginQRCode());
    }

    if (showAccessCode) {
        showAccessCode.addEventListener('click', () => displayAccessCode());
    }
}

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
                    IP: ${device.ip} • ${formatDate(device.lastActive)}
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

async function removeDevice(deviceId) {
    if (!confirm('Вы уверены что хотите удалить это устройство?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/devices/${deviceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showSettingsNotification('Устройство удалено', 'success');
            loadDevices();
        } else {
            showSettingsNotification('Ошибка удаления устройства', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления устройства:', error);
        showSettingsNotification('Ошибка сети', 'error');
    }
}

async function handleResetAllSessions() {
    if (!confirm('Вы уверены? Это выйдет из всех устройств кроме текущего.')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/devices/reset-all', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showSettingsNotification('Все сеансы сброшены', 'success');
            loadDevices();
        } else {
            showSettingsNotification('Ошибка сброса сеансов', 'error');
        }
    } catch (error) {
        console.error('Ошибка сброса сеансов:', error);
        showSettingsNotification('Ошибка сети', 'error');
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
    
    return date.toLocaleDateString('ru-RU');
}

async function displayLoginQRCode() {
    const display = document.getElementById('loginCodeDisplay');
    display.style.display = 'block';
    display.innerHTML = '<div class="loading">Генерация QR кода...</div>';

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
            
            display.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #2f3136; border-radius: 8px;">
                    <div id="qrCodeContainer"></div>
                    <p style="color: #b9bbbe; margin-top: 12px; font-size: 13px;">
                        Отсканируйте QR код в мобильном приложении
                    </p>
                    <p style="color: #72767d; font-size: 12px;">
                        Код действителен 5 минут
                    </p>
                </div>
            `;

            if (typeof QRCode !== 'undefined') {
                new QRCode(document.getElementById('qrCodeContainer'), {
                    text: `wallnux://login?code=${data.code}`,
                    width: 200,
                    height: 200,
                    colorDark: "#ffffff",
                    colorLight: "#2f3136"
                });
            }
        }
    } catch (error) {
        console.error('Ошибка генерации QR:', error);
        display.innerHTML = '<div style="color: #ed4245;">Ошибка генерации QR кода</div>';
    }
}

async function displayAccessCode() {
    const display = document.getElementById('loginCodeDisplay');
    display.style.display = 'block';
    display.innerHTML = '<div class="loading">Генерация кода...</div>';

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
            
            display.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #2f3136; border-radius: 8px;">
                    <div style="font-size: 32px; font-weight: 700; color: #fff; letter-spacing: 8px; margin: 20px 0;">
                        ${data.code}
                    </div>
                    <p style="color: #b9bbbe; font-size: 13px;">
                        Введите этот код на другом устройстве
                    </p>
                    <p style="color: #72767d; font-size: 12px;">
                        Код действителен 5 минут
                    </p>
                    <button class="settings-btn secondary" onclick="displayAccessCode()" style="margin-top: 12px;">
                        Обновить код
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка генерации кода:', error);
        display.innerHTML = '<div style="color: #ed4245;">Ошибка генерации кода</div>';
    }
}
