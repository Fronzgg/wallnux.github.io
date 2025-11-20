const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'discord_clone.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            bio TEXT,
            status TEXT DEFAULT 'Online',
            banner TEXT,
            badges TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Try to add columns if they don't exist (ignore errors)
    try { db.exec(`ALTER TABLE users ADD COLUMN bio TEXT`); } catch(e) {}
    try { db.exec(`ALTER TABLE users ADD COLUMN banner TEXT`); } catch(e) {}
    try { db.exec(`ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'`); } catch(e) {}
    
    // Servers table
    db.exec(`
        CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            icon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    `);

    // Channels table
    db.exec(`
        CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'text',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (server_id) REFERENCES servers(id)
        )
    `);

    // Messages table
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            media_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_id) REFERENCES channels(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
    
    try { db.exec(`ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'`); } catch(e) {}
    try { db.exec(`ALTER TABLE messages ADD COLUMN media_data TEXT`); } catch(e) {}

    // Direct messages table
    db.exec(`
        CREATE TABLE IF NOT EXISTS direct_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            media_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'sent',
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (recipient_id) REFERENCES users(id)
        )
    `);
    
    try { db.exec(`ALTER TABLE direct_messages ADD COLUMN message_type TEXT DEFAULT 'text'`); } catch(e) {}
    try { db.exec(`ALTER TABLE direct_messages ADD COLUMN media_data TEXT`); } catch(e) {}
    try { db.exec(`ALTER TABLE direct_messages ADD COLUMN status TEXT DEFAULT 'sent'`); } catch(e) {}

    // Friends table
    db.exec(`
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (friend_id) REFERENCES users(id)
        )
    `);

    // Files table
    db.exec(`
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            mimetype TEXT,
            size INTEGER,
            uploader_id INTEGER NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploader_id) REFERENCES users(id)
        )
    `);

    // Reactions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            emoji TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Nitro subscriptions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS nitro_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tier TEXT NOT NULL,
            start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_date DATETIME,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Admin actions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            target_user_id INTEGER,
            reason TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES users(id),
            FOREIGN KEY (target_user_id) REFERENCES users(id)
        )
    `);

    // User bans table
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_bans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            banned_by INTEGER NOT NULL,
            reason TEXT,
            ban_type TEXT DEFAULT 'permanent',
            banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (banned_by) REFERENCES users(id)
        )
    `);

    console.log('✅ Database initialized successfully (better-sqlite3)');
}

// Export database instances
module.exports = {
    initializeDatabase,
    userDB: db,
    messageDB: db,
    dmDB: db,
    fileDB: db,
    reactionDB: db,
    friendDB: db,
    serverDB: db,
    channelDB: db,
    nitroDB: db,
    adminDB: db
};
