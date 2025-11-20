// Система уведомлений WallNux Messenger
class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.sounds = {
            message: new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3'),
            call: new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1149-when.mp3'),
            mention: new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1151-juntos.mp3')
        };
        this.init();
    }

    async init() {
        // Запрос разрешения на уведомления
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    // Показать уведомление
    show(title, options = {}) {
        const defaultOptions = {
            icon: '/uploads/default-avatar.png',
            badge: '/uploads/default-avatar.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options
        };

        // Браузерное уведомление
        if (this.permission === 'granted') {
            const notification = new Notification(title, defaultOptions);
            
            notification.onclick = () => {
                window.focus();
                if (options.onClick) options.onClick();
                notification.close();
            };
        }

        // Внутреннее уведомление
        this.showInApp(title, options.body, options.type);

        // Звук
        this.playSound(options.type || 'message');
    }

    // Внутреннее уведомление
    showInApp(title, body, type = 'info') {
        const container = document.getElementById('notifications-container') || this.createContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${body}</p>
            </div>
            <button class="notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 10);

        // Автоудаление через 5 секунд
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        // Закрытие по клику
        notification.querySelector('.notification-close').onclick = () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        };
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notifications-container';
        document.body.appendChild(container);
        return container;
    }

    // Воспроизвести звук
    playSound(type = 'message') {
        const sound = this.sounds[type] || this.sounds.message;
        sound.currentTime = 0;
        sound.volume = 0.5;
        sound.play().catch(e => console.log('Звук заблокирован браузером'));
    }
}

// Глобальный экземпляр
window.notificationManager = new NotificationManager();
