// P2P Server API - локальные endpoints для кэширования
// Добавь в server.js: require('./p2p-server')(app, messageDB);

module.exports = function(app, messageDB) {
    
    // Сохранение сообщения в локальный кэш
    app.post('/api/messages/save', (req, res) => {
        const { from, to, message, timestamp, status } = req.body;
        
        try {
            const stmt = messageDB.prepare(`
                INSERT INTO messages (sender_id, recipient_id, content, timestamp, type, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(
                from,
                to,
                message.content,
                timestamp || Date.now(),
                message.type || 'text',
                status || 'sent'
            );
            
            res.json({
                success: true,
                messageId: result.lastInsertRowid
            });
        } catch (error) {
            console.error('Ошибка сохранения сообщения:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Получение неотправленных сообщений
    app.get('/api/messages/pending/:userId', (req, res) => {
        const { userId } = req.params;
        
        try {
            const messages = messageDB.prepare(`
                SELECT * FROM messages
                WHERE recipient_id = ? AND status = 'pending'
                ORDER BY timestamp ASC
            `).all(userId);
            
            res.json(messages);
        } catch (error) {
            console.error('Ошибка получения pending сообщений:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Обновление статуса сообщения
    app.put('/api/messages/:messageId/status', (req, res) => {
        const { messageId } = req.params;
        const { status } = req.body;
        
        try {
            messageDB.prepare(`
                UPDATE messages SET status = ? WHERE id = ?
            `).run(status, messageId);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Получение истории сообщений с пользователем
    app.get('/api/messages/history/:userId', (req, res) => {
        const { userId } = req.params;
        const currentUserId = req.user?.id; // Из JWT токена
        
        try {
            const messages = messageDB.prepare(`
                SELECT * FROM messages
                WHERE (sender_id = ? AND recipient_id = ?)
                   OR (sender_id = ? AND recipient_id = ?)
                ORDER BY timestamp ASC
                LIMIT 100
            `).all(currentUserId, userId, userId, currentUserId);
            
            res.json(messages);
        } catch (error) {
            console.error('Ошибка получения истории:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Получение списка друзей для P2P подключения
    app.get('/api/friends/list', (req, res) => {
        const userId = req.user?.id;
        
        try {
            const friends = friendDB.prepare(`
                SELECT user_id, friend_id, status
                FROM friends
                WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
            `).all(userId, userId);
            
            // Извлекаем ID друзей
            const friendIds = friends.map(f => 
                f.user_id === userId ? f.friend_id : f.user_id
            );
            
            res.json({ friendIds });
        } catch (error) {
            console.error('Ошибка получения друзей:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Получение информации о пользователе
    app.get('/api/users/:userId', (req, res) => {
        const { userId } = req.params;
        
        try {
            const user = userDB.prepare(`
                SELECT id, username, avatar, status, banner
                FROM users
                WHERE id = ?
            `).get(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            
            res.json(user);
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            res.status(500).json({ error: error.message });
        }
    });

    console.log('✅ P2P Server API endpoints зарегистрированы');
};
