// P2P Manager для WallNux Messenger
// Использует PeerJS для прямых соединений между пользователями

class P2PManager {
    constructor() {
        this.peer = null;
        this.connections = new Map(); // userId -> connection
        this.userId = null;
        this.onMessageCallback = null;
        this.onUserStatusCallback = null;
        this.isConnected = false;
    }

    // Инициализация P2P
    async init(userId) {
        return new Promise((resolve, reject) => {
            this.userId = userId;
            
            // Создаем Peer с уникальным ID
            this.peer = new Peer(`wallnux-${userId}`, {
                // Используем бесплатный PeerJS Cloud сервер
                host: 'peerjs-server.herokuapp.com',
                secure: true,
                port: 443,
                path: '/',
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            // Успешное подключение
            this.peer.on('open', (id) => {
                console.log('✅ P2P подключен! Peer ID:', id);
                this.isConnected = true;
                resolve(id);
            });

            // Ошибка подключения
            this.peer.on('error', (error) => {
                console.error('❌ P2P ошибка:', error);
                this.isConnected = false;
                reject(error);
            });

            // Входящее соединение
            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            // Входящий звонок
            this.peer.on('call', (call) => {
                this.handleIncomingCall(call);
            });

            // Отключение
            this.peer.on('disconnected', () => {
                console.log('⚠️ P2P отключен');
                this.isConnected = false;
            });
        });
    }

    // Обработка входящего соединения
    handleConnection(conn) {
        const userId = conn.peer.replace('wallnux-', '');
        console.log('📥 Входящее соединение от:', userId);

        conn.on('open', () => {
            this.connections.set(userId, conn);
            console.log('✅ Соединение установлено с:', userId);
            
            if (this.onUserStatusCallback) {
                this.onUserStatusCallback(userId, 'online');
            }
        });

        conn.on('data', (data) => {
            this.handleIncomingMessage(userId, data);
        });

        conn.on('close', () => {
            this.connections.delete(userId);
            console.log('❌ Соединение закрыто с:', userId);
            
            if (this.onUserStatusCallback) {
                this.onUserStatusCallback(userId, 'offline');
            }
        });

        conn.on('error', (error) => {
            console.error('❌ Ошибка соединения с', userId, error);
        });
    }

    // Подключение к пользователю
    async connectToUser(userId) {
        if (this.connections.has(userId)) {
            console.log('ℹ️ Уже подключен к:', userId);
            return this.connections.get(userId);
        }

        const peerId = `wallnux-${userId}`;
        console.log('📤 Подключение к:', peerId);

        const conn = this.peer.connect(peerId, {
            reliable: true,
            serialization: 'json'
        });

        return new Promise((resolve, reject) => {
            conn.on('open', () => {
                this.connections.set(userId, conn);
                console.log('✅ Подключен к:', userId);
                
                if (this.onUserStatusCallback) {
                    this.onUserStatusCallback(userId, 'online');
                }
                
                resolve(conn);
            });

            conn.on('error', (error) => {
                console.error('❌ Не удалось подключиться к', userId, error);
                reject(error);
            });

            conn.on('data', (data) => {
                this.handleIncomingMessage(userId, data);
            });

            conn.on('close', () => {
                this.connections.delete(userId);
                if (this.onUserStatusCallback) {
                    this.onUserStatusCallback(userId, 'offline');
                }
            });

            // Таймаут подключения
            setTimeout(() => {
                if (!this.connections.has(userId)) {
                    reject(new Error('Timeout: пользователь не в сети'));
                }
            }, 10000);
        });
    }

    // Отправка сообщения
    async sendMessage(userId, message) {
        let conn = this.connections.get(userId);

        // Если нет соединения - создаем
        if (!conn) {
            try {
                conn = await this.connectToUser(userId);
            } catch (error) {
                console.error('❌ Не удалось отправить сообщение:', error);
                throw error;
            }
        }

        // Отправляем данные
        const data = {
            type: 'message',
            from: this.userId,
            to: userId,
            message: message,
            timestamp: Date.now()
        };

        conn.send(data);
        console.log('📤 Сообщение отправлено:', userId);
    }

    // Обработка входящего сообщения
    handleIncomingMessage(userId, data) {
        console.log('📥 Получено сообщение от:', userId, data);

        if (this.onMessageCallback) {
            this.onMessageCallback(userId, data);
        }
    }

    // Звонок пользователю
    async callUser(userId, stream) {
        const peerId = `wallnux-${userId}`;
        console.log('📞 Звоним:', peerId);

        const call = this.peer.call(peerId, stream);

        return new Promise((resolve, reject) => {
            call.on('stream', (remoteStream) => {
                console.log('✅ Получен поток от:', userId);
                resolve({ call, remoteStream });
            });

            call.on('error', (error) => {
                console.error('❌ Ошибка звонка:', error);
                reject(error);
            });

            call.on('close', () => {
                console.log('📴 Звонок завершен с:', userId);
            });

            setTimeout(() => {
                reject(new Error('Timeout: пользователь не отвечает'));
            }, 30000);
        });
    }

    // Обработка входящего звонка
    handleIncomingCall(call) {
        const userId = call.peer.replace('wallnux-', '');
        console.log('📞 Входящий звонок от:', userId);

        // Показываем уведомление о звонке
        if (window.showIncomingCall) {
            window.showIncomingCall(userId, call);
        }
    }

    // Ответ на звонок
    answerCall(call, stream) {
        call.answer(stream);
        
        return new Promise((resolve) => {
            call.on('stream', (remoteStream) => {
                console.log('✅ Звонок принят');
                resolve(remoteStream);
            });
        });
    }

    // Проверка онлайн статуса
    async checkUserOnline(userId) {
        return this.connections.has(userId);
    }

    // Получить список онлайн друзей
    getOnlineUsers() {
        return Array.from(this.connections.keys());
    }

    // Отключение от пользователя
    disconnectFromUser(userId) {
        const conn = this.connections.get(userId);
        if (conn) {
            conn.close();
            this.connections.delete(userId);
            console.log('❌ Отключен от:', userId);
        }
    }

    // Полное отключение
    destroy() {
        // Закрываем все соединения
        this.connections.forEach((conn) => {
            conn.close();
        });
        this.connections.clear();

        // Закрываем Peer
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.isConnected = false;
        console.log('🛑 P2P Manager остановлен');
    }

    // Установка callback для сообщений
    onMessage(callback) {
        this.onMessageCallback = callback;
    }

    // Установка callback для статусов
    onUserStatus(callback) {
        this.onUserStatusCallback = callback;
    }
}

// Глобальный экземпляр
window.p2pManager = new P2PManager();
