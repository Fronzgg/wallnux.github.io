// Settings Modal - Полный функционал

let qrScanner = null;
let twoFactorEnabled = false;
let cloudPasswordEnabled = false;

// Инициализация модального окна настроек
document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsModal();
});

function initializeSettingsModal() {
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsModalClose = document.getElementById('settingsModalClose');
    const settingsCategories = document.querySelectorAll('.settings-category');

    // Открыть настройки
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            loadSettingsCategory('security');
        });
    }

    // Закрыть настройки
    if (settingsModalClose) {
        settingsModalClose.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            stopQRScanner();
        });
    }

    // Закрыть по клику на overlay
    const overlay = settingsModal?.querySelector('.settings-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            stopQRScanner();
        });
    }

    // Переключение категорий
    settingsCategories.forEach(category => {
        category.addEventListener('click', () => {
            const categoryName = category.dataset.category;
            
            settingsCategories.forEach(c => c.classList.remove('active'));
            category.classList.add('active');
            
            loadSettingsCategory(categoryName);
        });
    });
}

// Загрузить категорию настроек
function loadSettingsCategory(category) {
    const content = document.getElementById('settingsContent');
    
    switch(category) {
        case 'security':
            content.innerHTML = getSecurityHTML();
            initSecurityHandlers();
            break;
        case 'privacy':
            content.innerHTML = getPrivacyHTML();
            initPrivacyHandlers();
            break;
        case 'devices':
            content.innerHTML = getDevicesHTML();
            initDevicesHandlers();
            loadDevices();
            break;
        case 'accounts':
            content.innerHTML = getAccountsHTML();
            initAccountsHandlers();
            loadSavedAccounts();
            break;
        case 'qr-scanner':
            content.innerHTML = getQRScannerHTML();
            initQRScannerHandlers();
            break;
    }
}

// HTML для безопасности
function getSecurityHTML() {
    return `
        <div class="settings-section-content">
            <div class="settings-section-title">🔒 Безопасность</div>
            
            <!-- Смена пароля -->
            <div class="settings-group">
                <div class="settings-group-title">Смена пароля</div>
                <form id="changePasswordForm">
                    <div style="margin-bottom: 16px;">
                        <label style="color: #b9bbbe; font-size: 13px; display: block; margin-bottom: 8px;">Текущий пароль</label>
                        <input type="password" id="currentPassword" class="settings-input" required>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="color: #b9bbbe; font-size: 13px; display: block; margin-bottom: 8px;">Новый пароль</label>
                        <input type="password" id="newPassword" class="settings-input" required>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="color: #b9bbbe; font-size: 13px; display: block; margin-bottom: 8px;">Подтвердите новый пароль</label>
                        <input type="password" id="confirmPassword" class="settings-input" required>
                    </div>
                    <button type="submit" class="settings-btn">Сменить пароль</button>
                </form>
            </div>

            <!-- Облачный пароль -->
            <div class="settings-group">
                <div class="settings-group-title">Облачный пароль</div>
                <div class="settings-item">
                    <div class="settings-item-label">
                        <h4>Включить облачный пароль</h4>
                        <p>Дополнительный пароль для входа (второй уровень защиты)</p>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch" id="cloudPasswordToggle"></div>
                    </div>
                </div>
                <div id="cloudPasswordSetup" style="display: none; margin-top: 16px;">
                    <input type="password" id="cloudPasswordInput" class="settings-input" placeholder="Введите облачный пароль" style="margin-bottom: 12px;">
                    <button class="settings-btn" id="saveCloudPassword">Сохранить облачный пароль</button>
                </div>
            </div>

            <!-- Двухфакторная аутентификация -->
            <div class="settings-group">
                <div class="settings-group-title">Двухфакторная аутентификация (2FA)</div>
                <div class="settings-item">
                    <div class="settings-item-label">
                        <h4>Включить 2FA</h4>
                        <p>Код подтверждения от WallNux Support при входе</p>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch" id="twoFactorToggle"></div>
                    </div>
                </div>
                <div id="twoFactorInfo" style="display: none; margin-top: 16px; padding: 12px; background: #202225; border-radius: 6px; color: #b9bbbe; font-size: 13px;">
                    ✅ 2FA включена. При входе вы будете получать 6-значный код от WallNux Support.
                </div>
            </div>
        </div>
    `;
}

// HTML для приватности
function getPrivacyHTML() {
    return `
        <div class="settings-section-content">
            <div class="settings-section-title">🛡️ Приватность</div>
            
            <div class="settings-group">
                <div class="settings-group-title">Настройки приватности</div>
                
                <div class="settings-item">
                    <div class="settings-item-label">
                        <h4>Кто может писать в ЛС</h4>
                        <p>Выберите кто может отправлять вам личные сообщения</p>
                    </div>
                    <div class="settings-item-control">
                        <select id="dmPrivacy" class="settings-select" style="width: 150px;">
                            <option value="everyone">Все</option>
                            <option value="friends">Только друзья</option>
                            <option value="nobody">Никто</option>
                        </select>
                    </div>
                </div>

                <div class="settings-item">
                    <div class="settings-item-label">
                        <h4>Кто может звонить</h4>
                        <p>Выберите кто может звонить вам</p>
                    </div>
                    <div class="settings-item-control">
                        <select id="callPrivacy" class="settings-select" style="width: 150px;">
                            <option value="everyone">Все</option>
                            <option value="friends">Только друзья</option>
                            <option value="nobody">Никто</option>
                        </select>
                    </div>
                </div>

                <div class="settings-item">
                    <div class="settings-item-label">
                        <h4>Показывать онлайн статус</h4>
                        <p>Другие пользователи смогут видеть когда вы онлайн</p>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch active" id="showOnlineStatus"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// HTML для устройств
function getDevicesHTML() {
    return `
        <div class="settings-section-content">
            <div class="settings-section-title">📱 Устройства</div>
            
            <div class="settings-group">
                <div class="settings-group-title">Активные устройства</div>
                <div id="devicesList" class="device-list">
                    <div class="loading">Загрузка устройств...</div>
                </div>
                <button class="settings-btn danger" id="resetAllSessions" style="margin-top: 16px;">
                    Завершить все сеансы
                </button>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Вход с другого устройства</div>
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <button class="settings-btn" id="showQRCode">Показать QR код</button>
                    <button class="settings-btn secondary" id="showAccessCode">Показать код доступа</button>
                </div>
                <div id="loginCodeDisplay" style="display: none;"></div>
            </div>
        </div>
    `;
}

// HTML для аккаунтов
function getAccountsHTML() {
    return `
        <div class="settings-section-content">
            <div class="settings-section-title">👤 Аккаунты</div>
            
            <div class="settings-group">
                <div class="settings-group-title">Сохраненные аккаунты</div>
                <div id="savedAccountsList">
                    <div class="loading">Загрузка аккаунтов...</div>
                </div>
                <button class="settings-btn" id="addNewAccountBtn" style="margin-top: 16px;">
                    ➕ Добавить аккаунт
                </button>
            </div>
        </div>
    `;
}

// HTML для QR сканера
function getQRScannerHTML() {
    return `
        <div class="settings-section-content">
            <div class="settings-section-title">📷 QR Сканер</div>
            
            <div class="settings-group">
                <div class="qr-scanner-container">
                    <p style="color: #b9bbbe; margin-bottom: 20px;">
                        Отсканируйте QR код для входа на другом устройстве
                    </p>
                    <div class="qr-video-container" id="qrVideoContainer" style="display: none;">
                        <video id="qrVideo" autoplay playsinline></video>
                        <div class="qr-scanner-overlay"></div>
                    </div>
                    <div class="qr-scanner-controls">
                        <button class="settings-btn" id="startQRScanner">Начать сканирование</button>
                        <button class="settings-btn danger" id="stopQRScanner" style="display: none;">Остановить</button>
                    </div>
                    <div id="qrScanResult" style="margin-top: 20px;"></div>
                </div>
            </div>
        </div>
    `;
}

console.log('✅ Settings Modal загружен');
