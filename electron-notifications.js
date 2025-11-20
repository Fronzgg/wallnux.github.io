// Интеграция уведомлений с Electron
// Подключи этот файл в index.html после загрузки основного script.js

(function() {
    // Проверяем что мы в Electron
    if (!window.electronAPI || !window.electronAPI.isElectron) {
        console.log('Не Electron, используем веб-уведомления');
        return;
    }

    console.log('🖥️ Electron обнаружен, используем нативные уведомления');

    // Переопределяем функцию показа уведомлений
    const originalShowNotification = window.showNotification || function() {};

    window.showNotification = async function(title, body, options = {}) {
        try {
            // Используем Electron API
            await window.electronAPI.showNotification(title, body);
            console.log('✅ Уведомление отправлено через Electron');
        } catch (error) {
            console.error('❌ Ошибка уведомления Electron:', error);
            // Fallback на веб-уведомления
            originalShowNotification(title, body, options);
        }
    };

    // Показываем версию приложения в консоли
    if (window.electronAPI.getAppVersion) {
        window.electronAPI.getAppVersion().then(version => {
            console.log(`📦 WallNux Messenger v${version} (Electron)`);
        });
    }

    // Добавляем индикатор что мы в десктоп-версии
    document.addEventListener('DOMContentLoaded', () => {
        const body = document.body;
        if (body) {
            body.classList.add('electron-app');
            body.setAttribute('data-platform', window.electronAPI.platform || 'unknown');
        }
    });

    console.log('✅ Electron интеграция активирована');
})();
