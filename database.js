const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'discord_clone.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT,
                bio TEXT,
                status TEXT DEFAULT 'Online',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add bio column if it doesn't exist (for existing databases)
        db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {
            // Ignore error if column already exists
        });
        
        // Add banner column if it doesn't exist
        db.run(`ALTER TABLE users ADD COLUMN banner TEXT`, (err) => {
            // Ignore error if column already exists
        });
        
        // Add settings column if it doesn't exist
        db.run(`ALTER TABLE users ADD COLUMN settings TEXT`, (err) => {
            // Ignore error if column already exists
        });
        
        // Add badges column if it doesn't exist
        db.run(`ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'`, (err) => {
            // Ignore error if column already exists
        });
        
        // Add media fields to messages table
        db.run(`ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'`, (err) => {});
        db.run(`ALTER TABLE messages ADD COLUMN media_data TEXT`, (err) => {});
        
        // Add media fields to direct_messages table
        db.run(`ALTER TABLE direct_messages ADD COLUMN message_type TEXT DEFAULT 'text'`, (err) => {});
        db.run(`ALTER TABLE direct_messages ADD COLUMN media_data TEXT`, (err) => {});

        // Servers table
        db.run(`
            CREATE TABLE IF NOT EXISTS servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT,
                owner_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )
        `);

        // Channels table
        db.run(`
            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                server_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (server_id) REFERENCES servers(id)
            )
        `);

        // Messages table
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                user_id INTEGER,
                channel_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (channel_id) REFERENCES channels(id)
            )
        `);

        // Direct messages table
        db.run(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                sender_id INTEGER,
                receiver_id INTEGER,
                message_type TEXT DEFAULT 'text',
                media_data TEXT,
                read BOOLEAN DEFAULT 0,
                edited BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id),
                FOREIGN KEY (receiver_id) REFERENCES users(id)
            )
        `);

        // Добавить колонку edited если её нет (миграция)
        db.run(`
            ALTER TABLE direct_messages ADD COLUMN edited BOOLEAN DEFAULT 0
        `, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                // Игнорируем ошибку если колонка уже существует
            }
        });

        // File uploads table
        db.run(`
            CREATE TABLE IF NOT EXISTS file_uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                filetype TEXT,
                filesize INTEGER,
                user_id INTEGER,
                channel_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (channel_id) REFERENCES channels(id)
            )
        `);

        // Reactions table
        db.run(`
            CREATE TABLE IF NOT EXISTS reactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                emoji TEXT NOT NULL,
                message_id INTEGER,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (message_id) REFERENCES messages(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(message_id, user_id, emoji)
            )
        `);

        // Server members table
        db.run(`
            CREATE TABLE IF NOT EXISTS server_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER,
                user_id INTEGER,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (server_id) REFERENCES servers(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(server_id, user_id)
            )
        `);

        // Friends table
        db.run(`
            CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                friend_id INTEGER,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (friend_id) REFERENCES users(id),
                UNIQUE(user_id, friend_id)
            )
        `);

        // Public Channels table (like Telegram channels)
        db.run(`
            CREATE TABLE IF NOT EXISTS public_channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT UNIQUE,
                description TEXT,
                avatar TEXT,
                banner TEXT,
                owner_id INTEGER,
                is_private BOOLEAN DEFAULT 0,
                is_verified BOOLEAN DEFAULT 0,
                subscribers_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )
        `);

        // Channel subscribers table
        db.run(`
            CREATE TABLE IF NOT EXISTS channel_subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id INTEGER,
                user_id INTEGER,
                subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES public_channels(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(channel_id, user_id)
            )
        `);

        // Channel messages table
        db.run(`
            CREATE TABLE IF NOT EXISTS channel_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                channel_id INTEGER,
                user_id INTEGER,
                message_type TEXT DEFAULT 'text',
                media_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES public_channels(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Nitro subscriptions table
        db.run(`
            CREATE TABLE IF NOT EXISTS nitro_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // User bans table
        db.run(`
            CREATE TABLE IF NOT EXISTS user_bans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                banned_by INTEGER,
                reason TEXT,
                banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (banned_by) REFERENCES users(id)
            )
        `);

        // Admin users table
        db.run(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                granted_by INTEGER,
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (granted_by) REFERENCES users(id)
            )
        `);

        // Ban appeals table
        db.run(`
            CREATE TABLE IF NOT EXISTS ban_appeals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                ban_id INTEGER,
                appeal_text TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reviewed_by INTEGER,
                reviewed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (ban_id) REFERENCES user_bans(id),
                FOREIGN KEY (reviewed_by) REFERENCES users(id)
            )
        `);

        // Blocked users table
        db.run(`
            CREATE TABLE IF NOT EXISTS blocked_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                blocked_user_id INTEGER NOT NULL,
                blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (blocked_user_id) REFERENCES users(id),
                UNIQUE(user_id, blocked_user_id)
            )
        `);

        console.log('Database initialized successfully');
        
        // Create WallNux Support bot if it doesn't exist
        db.get('SELECT id FROM users WHERE username = ?', ['WallNux Support'], (err, row) => {
            if (!row) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = bcrypt.hashSync('wallnux_support_bot_2024', 10);
                db.run(
                    'INSERT INTO users (username, email, password, avatar, bio, status, badges) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        'WallNux Support',
                        'support@wallnux.com',
                        hashedPassword,
                        '🛡️',
                        'Официальная поддержка WallNux Messenger. Мы здесь, чтобы помочь вам! 💬',
                        'Online',
                        '["verified"]'
                    ],
                    function(err) {
                        if (!err) {
                            console.log('WallNux Support bot created with ID:', this.lastID);
                        }
                    }
                );
            }
        });
    });
}

// User operations
const userDB = {
    create: (username, email, hashedPassword) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
            db.run(sql, [username, email, hashedPassword], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, username, email });
            });
        });
    },

    findByEmail: (email) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            db.get(sql, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    
    findByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username = ?';
            db.get(sql, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    findById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, username, email, avatar, bio, status, banner, badges, created_at FROM users WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    update: (id, data) => {
        return new Promise((resolve, reject) => {
            const updates = [];
            const values = [];
            
            if (data.username !== undefined) {
                updates.push('username = ?');
                values.push(data.username);
            }
            if (data.email !== undefined) {
                updates.push('email = ?');
                values.push(data.email);
            }
            if (data.avatar !== undefined) {
                updates.push('avatar = ?');
                values.push(data.avatar);
            }
            if (data.bio !== undefined) {
                updates.push('bio = ?');
                values.push(data.bio);
            }
            if (data.banner !== undefined) {
                updates.push('banner = ?');
                values.push(data.banner);
            }
            if (data.badges !== undefined) {
                updates.push('badges = ?');
                values.push(data.badges);
            }
            
            if (updates.length === 0) {
                return resolve();
            }
            
            values.push(id);
            const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            db.run(sql, values, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    updateStatus: (id, status) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET status = ? WHERE id = ?';
            db.run(sql, [status, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    updatePassword: (id, hashedPassword) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE users SET password = ? WHERE id = ?';
            db.run(sql, [hashedPassword, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    getAll: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, username, email, avatar, status, badges FROM users';
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse badges for each user
                    const users = rows.map(row => {
                        let badges = [];
                        if (row.badges) {
                            try {
                                badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges;
                            } catch (e) {
                                badges = [];
                            }
                        }
                        return { ...row, badges };
                    });
                    resolve(users);
                }
            });
        });
    }
};

// Message operations
const messageDB = {
    create: (content, userId, channelId, messageType = 'text', mediaData = null) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO messages (content, user_id, channel_id, message_type, media_data) VALUES (?, ?, ?, ?, ?)';
            db.run(sql, [content, userId, channelId, messageType, mediaData], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, content, userId, channelId, messageType, mediaData });
            });
        });
    },

    getByChannel: (channelId, limit = 50) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT m.*, u.username, u.avatar, u.badges 
                FROM messages m 
                JOIN users u ON m.user_id = u.id 
                WHERE m.channel_id = ? 
                ORDER BY m.created_at DESC 
                LIMIT ?
            `;
            db.all(sql, [channelId, limit], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse badges for each message
                    const messages = rows.map(row => {
                        let badges = [];
                        if (row.badges) {
                            try {
                                badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges;
                            } catch (e) {
                                badges = [];
                            }
                        }
                        return { ...row, badges };
                    });
                    resolve(messages.reverse());
                }
            });
        });
    },

    update: (messageId, newContent) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE messages SET content = ?, edited = 1 WHERE id = ?';
            db.run(sql, [newContent, messageId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    delete: (messageId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM messages WHERE id = ?';
            db.run(sql, [messageId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

// Direct message operations
const dmDB = {
    create: (content, senderId, receiverId, messageType = 'text', mediaData = null) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO direct_messages (content, sender_id, receiver_id, message_type, media_data) VALUES (?, ?, ?, ?, ?)';
            db.run(sql, [content, senderId, receiverId, messageType, mediaData], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, content, senderId, receiverId, messageType, mediaData });
            });
        });
    },

    getConversation: (userId1, userId2, limit = 50) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT dm.*, u.username, u.avatar, u.badges 
                FROM direct_messages dm 
                JOIN users u ON dm.sender_id = u.id 
                WHERE (dm.sender_id = ? AND dm.receiver_id = ?) 
                   OR (dm.sender_id = ? AND dm.receiver_id = ?)
                ORDER BY dm.created_at DESC 
                LIMIT ?
            `;
            db.all(sql, [userId1, userId2, userId2, userId1, limit], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse badges for each message
                    const messages = rows.map(row => {
                        let badges = [];
                        if (row.badges) {
                            try {
                                badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges;
                            } catch (e) {
                                badges = [];
                            }
                        }
                        return { ...row, badges };
                    });
                    resolve(messages.reverse());
                }
            });
        });
    },

    markAsRead: (messageId) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE direct_messages SET read = 1 WHERE id = ?';
            db.run(sql, [messageId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    update: (messageId, newContent) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE direct_messages SET content = ?, edited = 1 WHERE id = ?';
            db.run(sql, [newContent, messageId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    delete: (messageId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM direct_messages WHERE id = ?';
            db.run(sql, [messageId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    deleteConversation: (userId1, userId2) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM direct_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
            db.run(sql, [userId1, userId2, userId2, userId1], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
};

// File operations
const fileDB = {
    create: (filename, filepath, filetype, filesize, userId, channelId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO file_uploads (filename, filepath, filetype, filesize, user_id, channel_id) VALUES (?, ?, ?, ?, ?, ?)';
            db.run(sql, [filename, filepath, filetype, filesize, userId, channelId], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, filename, filepath });
            });
        });
    },

    getByChannel: (channelId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT f.*, u.username 
                FROM file_uploads f 
                JOIN users u ON f.user_id = u.id 
                WHERE f.channel_id = ? 
                ORDER BY f.created_at DESC
            `;
            db.all(sql, [channelId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Reaction operations
const reactionDB = {
    add: (emoji, messageId, userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR IGNORE INTO reactions (emoji, message_id, user_id) VALUES (?, ?, ?)';
            db.run(sql, [emoji, messageId, userId], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, emoji, messageId, userId });
            });
        });
    },

    remove: (emoji, messageId, userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM reactions WHERE emoji = ? AND message_id = ? AND user_id = ?';
            db.run(sql, [emoji, messageId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    getByMessage: (messageId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.emoji, COUNT(*) as count, GROUP_CONCAT(u.username) as users
                FROM reactions r
                JOIN users u ON r.user_id = u.id
                WHERE r.message_id = ?
                GROUP BY r.emoji
            `;
            db.all(sql, [messageId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Friend operations
const friendDB = {
    sendRequest: (userId, friendId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")';
            db.run(sql, [userId, friendId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    acceptRequest: (userId, friendId) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Update the request status
                const sql1 = 'UPDATE friends SET status = "accepted" WHERE user_id = ? AND friend_id = ?';
                db.run(sql1, [friendId, userId], (err) => {
                    if (err) return reject(err);
                });

                // Create reverse relationship
                const sql2 = 'INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, "accepted")';
                db.run(sql2, [userId, friendId], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    },

    rejectRequest: (userId, friendId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM friends WHERE user_id = ? AND friend_id = ?';
            db.run(sql, [friendId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    removeFriend: (userId, friendId) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const sql1 = 'DELETE FROM friends WHERE user_id = ? AND friend_id = ?';
                const sql2 = 'DELETE FROM friends WHERE user_id = ? AND friend_id = ?';
                
                db.run(sql1, [userId, friendId], (err) => {
                    if (err) return reject(err);
                });
                
                db.run(sql2, [friendId, userId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    },

    getFriends: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.username, u.email, u.avatar, u.status, u.badges, f.status as friendship_status
                FROM friends f
                JOIN users u ON f.friend_id = u.id
                WHERE f.user_id = ? AND f.status = 'accepted'
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse badges for each friend
                    const friends = rows.map(row => {
                        let badges = [];
                        if (row.badges) {
                            try {
                                badges = typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges;
                            } catch (e) {
                                badges = [];
                            }
                        }
                        return { ...row, badges };
                    });
                    resolve(friends);
                }
            });
        });
    },

    getPendingRequests: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.username, u.email, u.avatar, u.status
                FROM friends f
                JOIN users u ON f.user_id = u.id
                WHERE f.friend_id = ? AND f.status = 'pending'
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    checkFriendship: (userId, friendId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = "accepted"';
            db.get(sql, [userId, friendId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    }
};

// Server operations
const serverDB = {
    create: (name, ownerId) => {
        return new Promise((resolve, reject) => {
            const icon = name.charAt(0).toUpperCase();
            const sql = 'INSERT INTO servers (name, icon, owner_id) VALUES (?, ?, ?)';
            db.run(sql, [name, icon, ownerId], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, name, icon, ownerId });
            });
        });
    },

    getUserServers: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT s.* FROM servers s
                JOIN server_members sm ON s.id = sm.server_id
                WHERE sm.user_id = ?
                ORDER BY s.created_at ASC
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    addMember: (serverId, userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR IGNORE INTO server_members (server_id, user_id) VALUES (?, ?)';
            db.run(sql, [serverId, userId], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    getMembers: (serverId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.id, u.username, u.avatar, u.status
                FROM users u
                JOIN server_members sm ON u.id = sm.user_id
                WHERE sm.server_id = ?
            `;
            db.all(sql, [serverId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// Экспорт перенесен в конец файла

// Public Channels operations
const channelDB = {
    create: (name, username, ownerId, description = '', isPrivate = false) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO public_channels (name, username, description, owner_id, is_private) VALUES (?, ?, ?, ?, ?)';
            db.run(sql, [name, username, description, ownerId, isPrivate ? 1 : 0], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, name, username, ownerId });
            });
        });
    },

    findByUsername: (username) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM public_channels WHERE username = ?';
            db.get(sql, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    findById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM public_channels WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    search: (query) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM public_channels 
                WHERE (name LIKE ? OR username LIKE ?) AND is_private = 0
                ORDER BY subscribers_count DESC
                LIMIT 20
            `;
            db.all(sql, [`%${query}%`, `%${query}%`], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    subscribe: (channelId, userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO channel_subscribers (channel_id, user_id) VALUES (?, ?)';
            db.run(sql, [channelId, userId], function(err) {
                if (err) reject(err);
                else {
                    // Update subscribers count
                    db.run('UPDATE public_channels SET subscribers_count = subscribers_count + 1 WHERE id = ?', [channelId]);
                    resolve();
                }
            });
        });
    },

    unsubscribe: (channelId, userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM channel_subscribers WHERE channel_id = ? AND user_id = ?';
            db.run(sql, [channelId, userId], function(err) {
                if (err) reject(err);
                else {
                    // Update subscribers count
                    db.run('UPDATE public_channels SET subscribers_count = subscribers_count - 1 WHERE id = ?', [channelId]);
                    resolve();
                }
            });
        });
    },

    isSubscribed: (channelId, userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM channel_subscribers WHERE channel_id = ? AND user_id = ?';
            db.get(sql, [channelId, userId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    },

    getMessages: (channelId, limit = 50) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT cm.*, u.username, u.avatar, u.badges
                FROM channel_messages cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.channel_id = ?
                ORDER BY cm.created_at DESC
                LIMIT ?
            `;
            db.all(sql, [channelId, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.reverse());
            });
        });
    },

    postMessage: (channelId, userId, content, messageType = 'text', mediaData = null) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO channel_messages (channel_id, user_id, content, message_type, media_data) VALUES (?, ?, ?, ?, ?)';
            db.run(sql, [channelId, userId, content, messageType, mediaData], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, channelId, userId, content });
            });
        });
    }
};

// Nitro operations
const nitroDB = {
    hasNitro: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM nitro_subscriptions WHERE user_id = ? AND is_active = 1';
            db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    },

    activate: (userId, durationDays = 30) => {
        return new Promise((resolve, reject) => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);
            
            const sql = `
                INSERT INTO nitro_subscriptions (user_id, expires_at) 
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET 
                    expires_at = ?,
                    is_active = 1
            `;
            db.run(sql, [userId, expiresAt.toISOString(), expiresAt.toISOString()], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    deactivate: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE nitro_subscriptions SET is_active = 0 WHERE user_id = ?';
            db.run(sql, [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

// Admin operations
const adminDB = {
    isAdmin: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM admin_users WHERE user_id = ?';
            db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    },

    grantAdmin: (userId, grantedBy) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO admin_users (user_id, granted_by) VALUES (?, ?)';
            db.run(sql, [userId, grantedBy], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    banUser: (userId, bannedBy, reason = '') => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO user_bans (user_id, banned_by, reason) VALUES (?, ?, ?)';
            db.run(sql, [userId, bannedBy, reason], function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    unbanUser: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE user_bans SET is_active = 0 WHERE user_id = ? AND is_active = 1';
            db.run(sql, [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    isBanned: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM user_bans WHERE user_id = ? AND is_active = 1';
            db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row : null);
            });
        });
    },

    createAppeal: (userId, banId, appealText) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO ban_appeals (user_id, ban_id, appeal_text) VALUES (?, ?, ?)';
            db.run(sql, [userId, banId, appealText], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    },

    getAppeals: (status = 'pending') => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT ba.*, u.username, u.avatar, ub.reason as ban_reason
                FROM ban_appeals ba
                JOIN users u ON ba.user_id = u.id
                LEFT JOIN user_bans ub ON ba.ban_id = ub.id
                WHERE ba.status = ?
                ORDER BY ba.created_at DESC
            `;
            db.all(sql, [status], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    reviewAppeal: (appealId, reviewedBy, approved) => {
        return new Promise((resolve, reject) => {
            const status = approved ? 'approved' : 'rejected';
            const sql = 'UPDATE ban_appeals SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?';
            db.run(sql, [status, reviewedBy, appealId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

// Blocked users operations
const blockDB = {
    block: (userId, blockedUserId) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT OR IGNORE INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)';
            db.run(sql, [userId, blockedUserId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    unblock: (userId, blockedUserId) => {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?';
            db.run(sql, [userId, blockedUserId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    isBlocked: (userId, blockedUserId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?';
            db.get(sql, [userId, blockedUserId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    },

    getBlockedUsers: (userId) => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT u.* FROM users u
                JOIN blocked_users b ON u.id = b.blocked_user_id
                WHERE b.user_id = ?
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

module.exports = {
    initializeDatabase,
    userDB,
    messageDB,
    dmDB,
    fileDB,
    reactionDB,
    friendDB,
    serverDB,
    channelDB,
    nitroDB,
    adminDB,
    blockDB
};
