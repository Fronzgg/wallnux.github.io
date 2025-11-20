// Адаптер для интеграции P2P с существующим кодом
// Заменяет Socket.IO на P2P соединения

class P2PAdapter {
    constructor() {
        this.localServer = null; // Локальный сервер для UI
        this.p2pManager = window.p2pManager;
        this.currentUserId = null;
    }

    // Инициализация
    async init(userId) {
        this.currentUserId = userId;

        // Подключаем локальный сервер (для UI)
        this.localServer = io('http://localhost:3000');

        // Инициализируем P2P
        try {
            await this.p2pManager.init(userId);
            console.log('✅ P2P адаптер инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации P2P:', error);
            throw error;
        }

        // Настраиваем обработчики
        this.setupHandlers();
    }

    // Настройка обработчиков
    setupHandlers() {
        // Входящие сообщения через P2P
        this.p2pManager.onMessage((userId, data) => {
            if (data.type === 'message') {
                this.handleP2PMessage(userId, data);
            }
        });

        // Статусы пользователей
        this.p2pManager.onUserStatus((userId, status) => {
            this.updateUserStatus(userId, status);
        });

        // Локальные события (для UI)
        this.localServer.on('connect', () => {
            console.log('✅ Локальный сервер подключен');
        });
    }

    // Обработка P2P сообщения
    handleP2PMessage(userId, data) {
        console.log('📥 P2P сообщение от:', userId, data);

        // Сохраняем в локальную БД
        this.saveMessageToLocal(data);

        // Обновляем UI
        if (window.addMessageToChat) {
            window.addMessageToChat({
                id: Date.now(),
                sender_id: userId,
                content: data.message.content,
                timestamp: data.timestamp,
                type: data.message.type || 'text'
            });
        }

        // Показываем уведомление
        if (window.showNotification) {
            this.getUserName(userId).then(name => {
                window.showNotification(name, data.message.content);
            });
        }
    }

    // Отправка сообщения
    async sendMessage(recipientId, content, type = 'text') {
        const message = {
            content: content,
            type: type,
            timestamp: Date.now()
        };

        try {
            // Отправляем через P2P
            await this.p2pManager.sendMessage(recipientId, message);

            // Сохраняем локально
            await this.saveMessageToLocal({
                from: this.currentUserId,
                to: recipientId,
                message: message,
                timestamp: message.timestamp
            });

            console.log('✅ Сообщение отправлено через P2P');
            return true;
        } catch (error) {
            console.error('❌ Ошибка отправки P2P:', error);
            
            // Сохраняем как неотправленное
            await this.saveMessageToLocal({
                from: this.currentUserId,
                to: recipientId,
                message: message,
                timestamp: message.timestamp,
                status: 'pending'
            });

            return false;
        }
    }

    // Сохранение сообщения в локальную БД
    async saveMessageToLocal(data) {
        return fetch('http://localhost:3000/api/messages/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });
    }

    // Получение имени пользователя
    async getUserName(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            return data.username || `User ${userId}`;
        } catch (error) {
            return `User ${userId}`;
        }
    }

    // Обновление статуса пользователя
    updateUserStatus(userId, status) {
        console.log(`👤 ${userId} теперь ${status}`);

        // Обновляем UI
        const userElement = document.querySelector(`[data-user-id="${userId}"]`);
        if (userElement) {
            const statusIndicator = userElement.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.className = `status-indicator ${status}`;
            }
        }

        // Пробуем отправить неотправленные сообщения
        if (status === 'online') {
            this.retrySendPendingMessages(userId);
        }
    }

    // Повторная отправка неотправленных сообщений
    async retrySendPendingMessages(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/messages/pending/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const messages = await response.json();

            for (const msg of messages) {
                await this.sendMessage(userId, msg.content, msg.type);
            }
        } catch (error) {
            console.error('Ошибка повторной отправки:', error);
        }
    }

    // Подключение к друзьям
    async connectToFriends(friendIds) {
        console.log('🔗 Подключение к друзьям:', friendIds);

        for (const friendId of friendIds) {
            try {
                await this.p2pManager.connectToUser(friendId);
            } catch (error) {
                console.log(`⚠️ Друг ${friendId} не в сети`);
            }
        }
    }

    // Звонок
    async startCall(userId, stream) {
        try {
            const { call, remoteStream } = await this.p2pManager.callUser(userId, stream);
            return { call, remoteStream };
        } catch (error) {
            console.error('❌ Ошибка звонка:', error);
            throw error;
        }
    }

    // Ответ на звонок
    async answerCall(call, stream) {
        const remoteStream = await this.p2pManager.answerCall(call, stream);
        return remoteStream;
    }

    // Получить онлайн друзей
    getOnlineFriends() {
        return this.p2pManager.getOnlineUsers();
    }

    // Отключение
    destroy() {
        if (this.p2pManager) {
            this.p2pManager.destroy();
        }
        if (this.localServer) {
            this.localServer.disconnect();
        }
    }
}

// Глобальный экземпляр
window.p2pAdapter = new P2PAdapter();
