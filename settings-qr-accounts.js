// QR Сканер и Аккаунты

// Обработчики аккаунтов
function initAccountsHandlers() {
    const addNewAccountBtn = document.getElementById('addNewAccountBtn');
    
    if (addNewAccountBtn) {
        addNewAccountBtn.addEventListener('click', () => {
            localStorage.setItem('addingNewAccount', 'true');
            window.location.href = 'login.html';
        });
    }
}

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

function switchToAccount(accountId) {
    if (window.accountManager && window.accountManager.setCurrentAccount(accountId)) {
        window.location.reload();
    }
}

function removeAccount(accountId) {
    if (confirm('Вы уверены что хотите удалить этот аккаунт?')) {
        if (window.accountManager) {
            window.accountManager.removeAccount(accountId);
            loadSavedAccounts();
        }
    }
}

// QR Сканер
function initQRScannerHandlers() {
    const startQRScanner = document.getElementById('startQRScanner');
    const stopQRScanner = document.getElementById('stopQRScanner');

    if (startQRScanner) {
        startQRScanner.addEventListener('click', startQRScannerFunc);
    }

    if (stopQRScanner) {
        stopQRScanner.addEventListener('click', stopQRScanner);
    }
}

async function startQRScannerFunc() {
    const videoContainer = document.getElementById('qrVideoContainer');
    const video = document.getElementById('qrVideo');
    const startBtn = document.getElementById('startQRScanner');
    const stopBtn = document.getElementById('stopQRScanner');
    const resultDiv = document.getElementById('qrScanResult');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        video.srcObject = stream;
        videoContainer.style.display = 'block';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        // Используем jsQR для сканирования
        if (typeof jsQR !== 'undefined') {
            scanQRCode(video, resultDiv);
        } else {
            resultDiv.innerHTML = '<div style="color: #ed4245;">Библиотека jsQR не загружена</div>';
        }
    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        resultDiv.innerHTML = '<div style="color: #ed4245;">Ошибка доступа к камере. Разрешите доступ в настройках браузера.</div>';
    }
}

function scanQRCode(video, resultDiv) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const scan = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                handleQRCodeScanned(code.data, resultDiv);
                return;
            }
        }
        
        requestAnimationFrame(scan);
    };

    scan();
}

async function handleQRCodeScanned(qrData, resultDiv) {
    console.log('QR код отсканирован:', qrData);

    // Проверить что это наш QR код
    if (!qrData.startsWith('wallnux://login?code=')) {
        resultDiv.innerHTML = '<div style="color: #ed4245;">Это не QR код WallNux</div>';
        return;
    }

    const code = qrData.split('code=')[1];

    // Показать окно подтверждения
    resultDiv.innerHTML = `
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #fff; margin-bottom: 16px;">Подтвердите вход</h3>
            <p style="color: #b9bbbe; margin-bottom: 20px;">
                Вы хотите войти в аккаунт на другом устройстве?
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="settings-btn" onclick="confirmQRLogin('${code}')">Подтвердить</button>
                <button class="settings-btn danger" onclick="cancelQRLogin()">Отмена</button>
            </div>
        </div>
    `;

    stopQRScanner();
}

async function confirmQRLogin(code) {
    const resultDiv = document.getElementById('qrScanResult');
    resultDiv.innerHTML = '<div class="loading">Подтверждение входа...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/confirm-qr-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code })
        });

        if (response.ok) {
            resultDiv.innerHTML = `
                <div style="background: #3ba55d; padding: 16px; border-radius: 8px; color: #fff; text-align: center;">
                    ✅ Вход подтвержден! Устройство авторизовано.
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: #ed4245; padding: 16px; border-radius: 8px; color: #fff; text-align: center;">
                    ❌ Ошибка подтверждения. Код истек или недействителен.
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка подтверждения входа:', error);
        resultDiv.innerHTML = `
            <div style="background: #ed4245; padding: 16px; border-radius: 8px; color: #fff; text-align: center;">
                ❌ Ошибка сети
            </div>
        `;
    }
}

function cancelQRLogin() {
    const resultDiv = document.getElementById('qrScanResult');
    resultDiv.innerHTML = `
        <div style="background: #f0b232; padding: 16px; border-radius: 8px; color: #000; text-align: center;">
            ⚠️ Вход отменен. Рекомендуем проверить безопасность вашего аккаунта.
        </div>
    `;
}

function stopQRScanner() {
    const video = document.getElementById('qrVideo');
    const videoContainer = document.getElementById('qrVideoContainer');
    const startBtn = document.getElementById('startQRScanner');
    const stopBtn = document.getElementById('stopQRScanner');

    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    videoContainer.style.display = 'none';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
}

// Уведомления
function showSettingsNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: '500',
        zIndex: '10001',
        animation: 'slideIn 0.3s ease'
    });
    
    if (type === 'success') {
        notification.style.background = '#3ba55d';
    } else if (type === 'error') {
        notification.style.background = '#ed4245';
    } else {
        notification.style.background = '#5865f2';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

console.log('✅ Settings QR & Accounts загружены');
