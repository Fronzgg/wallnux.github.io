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
        
        // Сохраняем данные
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
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
