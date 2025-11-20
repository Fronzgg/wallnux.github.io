let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const switchLink = document.getElementById('switchLink');
    
    authForm.addEventListener('submit', handleSubmit);
    switchLink.addEventListener('click', toggleMode);
});

function toggleMode(e) {
    e.preventDefault();
    
    isLoginMode = !isLoginMode;
    
    const usernameGroup = document.getElementById('usernameGroup');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    const subtitle = document.getElementById('subtitle');
    
    if (isLoginMode) {
        usernameGroup.style.display = 'none';
        submitBtn.textContent = 'Войти';
        switchText.textContent = 'Нужен аккаунт?';
        switchLink.textContent = 'Зарегистрироваться';
        subtitle.textContent = 'С возвращением!';
    } else {
        usernameGroup.style.display = 'block';
        submitBtn.textContent = 'Зарегистрироваться';
        switchText.textContent = 'Уже есть аккаунт?';
        switchLink.textContent = 'Войти';
        subtitle.textContent = 'Создайте аккаунт';
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value.trim();
    
    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (!isLoginMode && !username) {
        showNotification('Введите имя пользователя', 'error');
        return;
    }
    
    if (isLoginMode) {
        await login(email, password);
    } else {
        await register(username, email, password);
    }
}

async function login(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showNotification(data.error || 'Ошибка входа', 'error');
            return;
        }
        
        // Добавить аккаунт в Account Manager
        if (window.accountManager) {
            window.accountManager.addAccount(data.user, data.token);
        } else {
            // Fallback если Account Manager не загружен
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        
        showNotification('Вход выполнен!', 'success');
        
        // Редирект
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка сети', 'error');
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showNotification(data.error || 'Ошибка регистрации', 'error');
            return;
        }
        
        // Сохраняем данные
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        showNotification('Регистрация успешна!', 'success');
        
        // Редирект
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Ошибка сети', 'error');
    }
}

function showNotification(message, type = 'error') {
    // Удаляем старые уведомления
    const old = document.querySelector('.notification');
    if (old) old.remove();
    
    // Создаем новое
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


// Обработчики вкладок
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.auth-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Переключить активную вкладку
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показать соответствующий контент
            tabContents.forEach(content => {
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
            
            // Инициализировать QR код если нужно
            if (tabName === 'qr') {
                generateQRCode();
            }
        });
    });
    
    // Обработчик формы кода доступа
    const codeForm = document.getElementById('codeForm');
    if (codeForm) {
        codeForm.addEventListener('submit', handleCodeLogin);
    }
    
    // Автоматический ввод кода (только цифры)
    const accessCodeInput = document.getElementById('accessCode');
    if (accessCodeInput) {
        accessCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
});

// Генерация QR кода
function generateQRCode() {
    const qrContainer = document.getElementById('qrCode');
    if (!qrContainer) return;
    
    // Очистить предыдущий QR
    qrContainer.innerHTML = '';
    
    // Генерировать уникальный код для входа
    const loginCode = generateLoginCode();
    
    // Создать QR код
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: `wallnux://login?code=${loginCode}`,
            width: 170,
            height: 170,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        qrContainer.innerHTML = '<p style="color: #b9bbbe;">QR библиотека не загружена</p>';
    }
    
    // Сохранить код для проверки
    localStorage.setItem('pendingLoginCode', loginCode);
    
    // Проверять статус входа каждые 2 секунды
    const checkInterval = setInterval(async () => {
        const success = await checkLoginStatus(loginCode);
        if (success) {
            clearInterval(checkInterval);
            window.location.href = 'index.html';
        }
    }, 2000);
    
    // Остановить проверку через 5 минут
    setTimeout(() => clearInterval(checkInterval), 300000);
}

// Генерация кода для входа
function generateLoginCode() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Проверка статуса входа по QR/коду
async function checkLoginStatus(code) {
    try {
        const response = await fetch(`/api/check-login-code/${code}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Сохранить токен и данные
                if (window.accountManager) {
                    window.accountManager.addAccount(data.user, data.token);
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                }
                return true;
            }
        }
    } catch (error) {
        console.error('Check login status error:', error);
    }
    return false;
}

// Вход по коду доступа
async function handleCodeLogin(e) {
    e.preventDefault();
    
    const code = document.getElementById('accessCode').value.trim();
    
    if (code.length !== 6) {
        showNotification('Код должен содержать 6 цифр', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/login-by-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showNotification(data.error || 'Неверный код', 'error');
            return;
        }
        
        // Сохранить данные
        if (window.accountManager) {
            window.accountManager.addAccount(data.user, data.token);
        } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        
        showNotification('Вход выполнен!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Code login error:', error);
        showNotification('Ошибка сети', 'error');
    }
}
