// Settings Handlers - Обработчики для всех функций настроек

// Обработчики безопасности
function initSecurityHandlers() {
    // Смена пароля
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }

    // Облачный пароль
    const cloudPasswordToggle = document.getElementById('cloudPasswordToggle');
    const cloudPasswordSetup = document.getElementById('cloudPasswordSetup');
    const saveCloudPassword = document.getElementById('saveCloudPassword');

    if (cloudPasswordToggle) {
        // Загрузить текущее состояние
        loadCloudPasswordState();

        cloudPasswordToggle.addEventListener('click', () => {
            cloudPasswordToggle.classList.toggle('active');
            if (cloudPasswordToggle.classList.contains('active')) {
                cloudPasswordSetup.style.display = 'block';
            } else {
                cloudPasswordSetup.style.display = 'none';
                disableCloudPassword();
            }
        });
    }

    if (saveCloudPassword) {
        saveCloudPassword.addEventListener('click', handleSaveCloudPassword);
    }

    // 2FA
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    const twoFactorInfo = document.getElementById('twoFactorInfo');

    if (twoFactorToggle) {
        // Загрузить текущее состояние
        loadTwoFactorState();

        twoFactorToggle.addEventListener('click', () => {
            twoFactorToggle.classList.toggle('active');
            if (twoFactorToggle.classList.contains('active')) {
                twoFactorInfo.style.display = 'block';
                enableTwoFactor();
            } else {
                twoFactorInfo.style.display = 'none';
                disableTwoFactor();
            }
        });
    }
}

// Смена пароля
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showSettingsNotification('Пароли не совпадают', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showSettingsNotification('Пароль должен быть минимум 6 символов', 'error');
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
            showSettingsNotification('Пароль успешно изменен', 'success');
            document.getElementById('changePasswordForm').reset();
        } else {
            showSettingsNotification(data.error || 'Ошибка смены пароля', 'error');
        }
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        showSettingsNotification('Ошибка сети', 'error');
    }
}

// Облачный пароль
async function loadCloudPasswordState() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const settings = await response.json();
            const toggle = document.getElementById('cloudPasswordToggle');
            const setup = document.getElementById('cloudPasswordSetup');
            
            if (settings.cloudPasswordEnabled) {
                toggle.classList.add('active');
                setup.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния облачного пароля:', error);
    }
}

async function handleSaveCloudPassword() {
    const cloudPassword = document.getElementById('cloudPasswordInput').value;

    if (!cloudPassword || cloudPassword.length < 6) {
        showSettingsNotification('Облачный пароль должен быть минимум 6 символов', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/cloud-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cloudPassword })
        });

        if (response.ok) {
            showSettingsNotification('Облачный пароль сохранен', 'success');
            document.getElementById('cloudPasswordInput').value = '';
        } else {
            showSettingsNotification('Ошибка сохранения облачного пароля', 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения облачного пароля:', error);
        showSettingsNotification('Ошибка сети', 'error');
    }
}

async function disableCloudPassword() {
    try {
        const token = localStorage.getItem('token');
        await fetch('/api/user/cloud-password/disable', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showSettingsNotification('Облачный пароль отключен', 'success');
    } catch (error) {
        console.error('Ошибка отключения облачного пароля:', error);
    }
}

// 2FA
async function loadTwoFactorState() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const settings = await response.json();
            const toggle = document.getElementById('twoFactorToggle');
            const info = document.getElementById('twoFactorInfo');
            
            if (settings.twoFactorEnabled) {
                toggle.classList.add('active');
                info.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки состояния 2FA:', error);
    }
}

async function enableTwoFactor() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/2fa/enable', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showSettingsNotification('2FA включена', 'success');
        } else {
            showSettingsNotification('Ошибка включения 2FA', 'error');
        }
    } catch (error) {
        console.error('Ошибка включения 2FA:', error);
        showSettingsNotification('Ошибка сети', 'error');
    }
}

async function disableTwoFactor() {
    try {
        const token = localStorage.getItem('token');
        await fetch('/api/user/2fa/disable', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showSettingsNotification('2FA отключена', 'success');
    } catch (error) {
        console.error('Ошибка отключения 2FA:', error);
    }
}
