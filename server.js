const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const { initializeDatabase, userDB, messageDB, dmDB, fileDB, reactionDB, friendDB, serverDB, channelDB, nitroDB, adminDB } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow all common file types
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'audio/mpeg', 'audio/mp3', 'video/mp4', 'video/webm', 'video/quicktime',
            'application/zip', 'application/x-rar-compressed'
        ];
        
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx',
                                   '.txt', '.mp3', '.mp4', '.webm', '.mov', '.zip', '.rar'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(null, true); // Allow all files for now, can restrict later
        }
    }
});

// Initialize database
initializeDatabase();

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// API Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if email exists
        const existingEmail = await userDB.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Check if username exists
        const existingUsername = await userDB.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userDB.create(username, email, hashedPassword);
        
        // Automatically add WallNux Support as friend
        try {
            const supportBot = await userDB.findByUsername('WallNux Support');
            if (supportBot) {
                await friendDB.sendRequest(supportBot.id, user.id);
                await friendDB.acceptRequest(user.id, supportBot.id);
            }
        } catch (err) {
            console.log('Could not add support bot as friend:', err);
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: username.charAt(0).toUpperCase()
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const user = await userDB.findByEmail(email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Проверка бана
        const ban = await adminDB.isBanned(user.id);
        if (ban) {
            return res.status(403).json({ 
                error: 'banned',
                reason: ban.reason || 'Нарушение правил сообщества',
                banId: ban.id,
                bannedAt: ban.banned_at
            });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || user.username.charAt(0).toUpperCase(),
                badges: user.badges || '[]'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.user.id);
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || user.username.charAt(0).toUpperCase(),
            bio: user.bio || ''
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, bio } = req.body;
        
        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }
        
        const user = await userDB.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingUser = await userDB.findByEmail(email);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        
        // Update user
        await userDB.update(req.user.id, { username, email, bio: bio || '' });
        
        const updatedUser = await userDB.findById(req.user.id);
        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar || updatedUser.username.charAt(0).toUpperCase(),
            bio: updatedUser.bio || ''
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Upload avatar
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        await userDB.update(req.user.id, { avatar: avatarUrl });
        
        res.json({ avatar: avatarUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await userDB.getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Get specific user by ID
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        let badges = [];
        try {
            badges = user.badges ? JSON.parse(user.badges) : [];
        } catch (e) {
            badges = [];
        }
        
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || user.username.charAt(0).toUpperCase(),
            bio: user.bio || '',
            status: user.status || 'offline',
            created_at: user.created_at || 'Unknown',
            banner: user.banner || null,
            badges: badges
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Failed to get user', details: error.message });
    }
});

// Upload banner
app.post('/api/user/banner', authenticateToken, upload.single('banner'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const bannerUrl = `/uploads/${req.file.filename}`;
        await userDB.update(req.user.id, { banner: bannerUrl });
        
        res.json({ banner: bannerUrl });
    } catch (error) {
        console.error('Banner upload error:', error);
        res.status(500).json({ error: 'Failed to upload banner' });
    }
});

// Check if user is admin
app.get('/api/user/is-admin', authenticateToken, async (req, res) => {
    try {
        const user = await userDB.findById(req.user.id);
        const badges = user.badges ? JSON.parse(user.badges) : [];
        res.json({ isAdmin: badges.includes('admin') || badges.includes('founder') });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check admin status' });
    }
});

// Admin: Give badge
app.post('/api/admin/give-badge', authenticateToken, async (req, res) => {
    try {
        const adminUser = await userDB.findById(req.user.id);
        const adminBadges = adminUser.badges ? JSON.parse(adminUser.badges) : [];
        
        if (!adminBadges.includes('admin') && !adminBadges.includes('founder')) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const { userId, badge } = req.body;
        const user = await userDB.findById(userId);
        const userBadges = user.badges ? JSON.parse(user.badges) : [];
        
        if (!userBadges.includes(badge)) {
            userBadges.push(badge);
            await userDB.update(userId, { badges: JSON.stringify(userBadges) });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Give badge error:', error);
        res.status(500).json({ error: 'Failed to give badge' });
    }
});

// Admin: Ban user
app.post('/api/admin/ban-user', authenticateToken, async (req, res) => {
    try {
        const adminUser = await userDB.findById(req.user.id);
        const adminBadges = adminUser.badges ? JSON.parse(adminUser.badges) : [];
        
        if (!adminBadges.includes('admin') && !adminBadges.includes('founder')) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const { userId, ban } = req.body;
        const user = await userDB.findById(userId);
        let userBadges = user.badges ? JSON.parse(user.badges) : [];
        
        if (ban) {
            if (!userBadges.includes('banned')) {
                userBadges.push('banned');
            }
        } else {
            userBadges = userBadges.filter(b => b !== 'banned');
        }
        
        await userDB.update(userId, { badges: JSON.stringify(userBadges) });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

// Admin: Search users
app.get('/api/admin/search-users', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Query required' });
        }
        
        const users = await userDB.getAll();
        const results = users.filter(u => 
            u.username.toLowerCase().includes(query.toLowerCase())
        ).map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            avatar: u.avatar || u.username.charAt(0).toUpperCase(),
            status: u.status || 'offline',
            badges: u.badges ? JSON.parse(u.badges) : []
        }));
        
        res.json(results);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// File upload
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { channelId } = req.body;
        const fileRecord = await fileDB.create(
            req.file.filename,
            req.file.path,
            req.file.mimetype,
            req.file.size,
            req.user.id,
            channelId
        );
        
        res.json({
            id: fileRecord.id,
            filename: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            type: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get messages by channel
app.get('/api/messages/:channelId', authenticateToken, async (req, res) => {
    try {
        const messages = await messageDB.getByChannel(req.params.channelId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Get direct messages
app.get('/api/dm/:userId', authenticateToken, async (req, res) => {
    try {
        const messages = await dmDB.getConversation(req.user.id, req.params.userId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Server routes
app.post('/api/servers', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Server name must be at least 2 characters' });
        }
        
        const server = await serverDB.create(name.trim(), req.user.id);
        await serverDB.addMember(server.id, req.user.id);
        
        res.json(server);
    } catch (error) {
        console.error('Create server error:', error);
        res.status(500).json({ error: 'Failed to create server' });
    }
});

app.get('/api/servers', authenticateToken, async (req, res) => {
    try {
        const servers = await serverDB.getUserServers(req.user.id);
        res.json(servers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get servers' });
    }
});

app.get('/api/servers/:serverId/members', authenticateToken, async (req, res) => {
    try {
        const members = await serverDB.getMembers(req.params.serverId);
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get server members' });
    }
});

app.get('/api/friends', authenticateToken, async (req, res) => {
    try {
        const friends = await friendDB.getFriends(req.user.id);
        res.json(friends);
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to get friends' });
    }
});

app.get('/api/friends/pending', authenticateToken, async (req, res) => {
    try {
        const requests = await friendDB.getPendingRequests(req.user.id);
        res.json(requests);
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Failed to get pending requests' });
    }
});

// Search users with friendship status
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        console.log('🔍 Search users request:', query, 'from user:', req.user.id);
        
        if (!query) {
            return res.status(400).json({ error: 'Query required' });
        }
        
        const users = await userDB.getAll();
        const results = users.filter(u => 
            u.username.toLowerCase().includes(query.toLowerCase()) && 
            u.id !== req.user.id
        );
        
        console.log('📋 Found', results.length, 'users matching query');
        
        // Добавить информацию о статусе дружбы
        const resultsWithStatus = await Promise.all(results.map(async (user) => {
            // Проверить есть ли запрос в друзья
            const pendingRequest = await new Promise((resolve) => {
                db.get(
                    'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                    [req.user.id, user.id, user.id, req.user.id],
                    (err, row) => {
                        if (err) resolve(null);
                        else resolve(row);
                    }
                );
            });
            
            let friendshipStatus = 'none';
            if (pendingRequest) {
                if (pendingRequest.status === 'accepted') {
                    friendshipStatus = 'friends';
                } else if (pendingRequest.user_id === req.user.id) {
                    friendshipStatus = 'pending_sent';
                } else {
                    friendshipStatus = 'pending_received';
                }
            }
            
            console.log('👤 User:', user.username, 'Status:', friendshipStatus);
            
            return {
                ...user,
                friendshipStatus
            };
        }));
        
        console.log('✅ Sending', resultsWithStatus.length, 'results with status');
        res.json(resultsWithStatus);
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Friend request routes
app.post('/api/friends/request', authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        
        console.log('📨 Friend request from:', req.user.id, 'to:', friendId);
        
        const result = await friendDB.sendRequest(req.user.id, friendId);
        console.log('✅ Friend request saved, changes:', result.changes);

        if (result.changes > 0) {
            // Найти сокет получателя
            const receiverSocket = Array.from(users.values()).find(u => u.id === parseInt(friendId));
            console.log('🔍 Looking for receiver socket, friendId:', friendId);
            console.log('👥 All connected users:', Array.from(users.values()).map(u => ({ id: u.id, socketId: u.socketId })));
            
            if (receiverSocket) {
                console.log('✅ Found receiver socket:', receiverSocket.socketId);
                io.to(receiverSocket.socketId).emit('new-friend-request', {
                    senderId: req.user.id
                });
                console.log('📤 Sent new-friend-request event to:', receiverSocket.socketId);
            } else {
                console.log('⚠️ Receiver not online or socket not found');
            }
        } else {
            console.log('⚠️ No changes made (request already exists?)');
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

app.post('/api/friends/accept', authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        
        console.log('✅ Accepting friend request from:', friendId, 'by:', req.user.id);
        
        await friendDB.acceptRequest(req.user.id, friendId);
        
        // Уведомить отправителя о принятии запроса
        const senderSocket = Array.from(users.values()).find(u => u.id === parseInt(friendId));
        if (senderSocket) {
            console.log('📤 Notifying sender about acceptance:', senderSocket.socketId);
            io.to(senderSocket.socketId).emit('friend-request-accepted', {
                acceptedBy: req.user.id
            });
        }
        
        // Уведомить получателя (того кто принял)
        const receiverSocket = Array.from(users.values()).find(u => u.id === req.user.id);
        if (receiverSocket) {
            io.to(receiverSocket.socketId).emit('friend-added', {
                friendId: friendId
            });
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
});

app.post('/api/friends/reject', authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        await friendDB.rejectRequest(req.user.id, friendId);
        res.sendStatus(200);
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ error: 'Failed to reject friend request' });
    }
});

app.delete('/api/friends/:friendId', authenticateToken, async (req, res) => {
    try {
        await friendDB.removeFriend(req.user.id, req.params.friendId);
        res.sendStatus(200);
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

// Store connected users
const users = new Map();
const rooms = new Map();

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Check if user is admin
app.get('/api/admin/check', authenticateToken, async (req, res) => {
    try {
        const isAdmin = await adminDB.isAdmin(req.user.id);
        res.json({ isAdmin });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Search users (admin only)
app.get('/api/admin/search-users', authenticateToken, async (req, res) => {
    try {
        // ДЛЯ ТЕСТИРОВАНИЯ: Открыто для всех
        const isAdmin = true; // await adminDB.isAdmin(req.user.id);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const query = req.query.q;
        const users = await userDB.getAll();
        const filtered = users.filter(u => 
            u.username.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase())
        );
        
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Ban user (admin only)
app.post('/api/admin/ban', authenticateToken, async (req, res) => {
    try {
        console.log('🚫 Ban user request:', req.body);
        
        // ДЛЯ ТЕСТИРОВАНИЯ: Открыто для всех
        const isAdmin = true; // await adminDB.isAdmin(req.user.id);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { userId, reason } = req.body;
        
        if (!userId) {
            console.error('❌ Missing userId');
            return res.status(400).json({ error: 'Missing userId' });
        }
        
        console.log('🚫 Banning user:', userId, 'Reason:', reason);
        await adminDB.banUser(userId, req.user.id, reason);
        
        // Добавляем бейдж BAN
        const user = await userDB.findById(userId);
        let badges = [];
        try {
            badges = JSON.parse(user.badges || '[]');
        } catch (e) {}
        
        const banBadge = { id: 'banned', name: 'BANNED', icon: '🚫', color: '#ed4245' };
        if (!badges.find(b => b.id === 'banned')) {
            badges.push(banBadge);
            await userDB.update(userId, { badges: JSON.stringify(badges) });
        }
        
        // Отправляем реалтайм уведомление через Socket.IO
        const userSockets = Array.from(users.entries())
            .filter(([socketId, u]) => u.id === userId)
            .map(([socketId]) => socketId);
        
        userSockets.forEach(socketId => {
            io.to(socketId).emit('user-banned', {
                reason: reason || 'Нарушение правил сообщества',
                bannedBy: req.user.username || 'Администратор'
            });
        });
        
        console.log('✅ User banned successfully');
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Unban user (admin only)
app.post('/api/admin/unban', authenticateToken, async (req, res) => {
    try {
        // ДЛЯ ТЕСТИРОВАНИЯ: Открыто для всех
        const isAdmin = true; // await adminDB.isAdmin(req.user.id);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { userId } = req.body;
        await adminDB.unbanUser(userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Give badge (admin only)
app.post('/api/admin/give-badge', authenticateToken, async (req, res) => {
    try {
        console.log('📛 Give badge request:', req.body);
        
        // ДЛЯ ТЕСТИРОВАНИЯ: Открыто для всех
        const isAdmin = true; // await adminDB.isAdmin(req.user.id);
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { userId, badge } = req.body;
        
        if (!userId || !badge) {
            console.error('❌ Missing userId or badge');
            return res.status(400).json({ error: 'Missing userId or badge' });
        }
        
        console.log('👤 Finding user:', userId);
        const user = await userDB.findById(userId);
        
        if (!user) {
            console.error('❌ User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('✅ User found:', user.username);
        
        let badges = [];
        try {
            badges = JSON.parse(user.badges || '[]');
        } catch (e) {
            console.error('❌ Error parsing badges:', e);
            badges = [];
        }
        
        console.log('📋 Current badges:', badges);
        
        if (!badges.find(b => b.id === badge.id)) {
            badges.push(badge);
            console.log('➕ Adding badge:', badge);
            await userDB.update(userId, { badges: JSON.stringify(badges) });
            console.log('✅ Badge added successfully');
        } else {
            console.log('⚠️ Badge already exists');
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// CHANNELS API ENDPOINTS
// ============================================

// Create channel
app.post('/api/channels/create', authenticateToken, async (req, res) => {
    try {
        const { name, username, description, isPrivate } = req.body;
        
        // Check if username is taken
        const existing = await channelDB.findByUsername(username);
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        const channel = await channelDB.create(name, username, req.user.id, description, isPrivate);
        
        // Auto-subscribe owner
        await channelDB.subscribe(channel.id, req.user.id);
        
        res.json(channel);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Search channels
app.get('/api/channels/search', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        const channels = await channelDB.search(query);
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get channel by username
app.get('/api/channels/@:username', authenticateToken, async (req, res) => {
    try {
        const channel = await channelDB.findByUsername(req.params.username);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        const isSubscribed = await channelDB.isSubscribed(channel.id, req.user.id);
        res.json({ ...channel, isSubscribed });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Subscribe to channel
app.post('/api/channels/:id/subscribe', authenticateToken, async (req, res) => {
    try {
        await channelDB.subscribe(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Unsubscribe from channel
app.post('/api/channels/:id/unsubscribe', authenticateToken, async (req, res) => {
    try {
        await channelDB.unsubscribe(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get channel messages
app.get('/api/channels/:id/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await channelDB.getMessages(req.params.id);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Post message to channel
app.post('/api/channels/:id/messages', authenticateToken, async (req, res) => {
    try {
        const channel = await channelDB.findById(req.params.id);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Only owner can post
        if (channel.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only channel owner can post' });
        }
        
        const { content, messageType, mediaData } = req.body;
        const message = await channelDB.postMessage(req.params.id, req.user.id, content, messageType, mediaData);
        
        // Broadcast to subscribers via Socket.IO
        io.emit('channel-message', {
            channelId: req.params.id,
            message: {
                ...message,
                username: req.user.username,
                avatar: req.user.avatar
            }
        });
        
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// NITRO API ENDPOINTS
// ============================================

// Check Nitro status
app.get('/api/nitro/status', authenticateToken, async (req, res) => {
    try {
        const hasNitro = await nitroDB.hasNitro(req.user.id);
        res.json({ hasNitro });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Activate Nitro (for testing)
app.post('/api/nitro/activate', authenticateToken, async (req, res) => {
    try {
        await nitroDB.activate(req.user.id, 30);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// BAN APPEALS API
// ============================================

// Submit appeal
app.post('/api/ban/appeal', authenticateToken, async (req, res) => {
    try {
        const { appealText } = req.body;
        
        // Check if user is banned
        const ban = await adminDB.isBanned(req.user.id);
        if (!ban) {
            return res.status(400).json({ error: 'You are not banned' });
        }
        
        // Create appeal
        const appeal = await adminDB.createAppeal(req.user.id, ban.id, appealText);
        
        // Send DM to DevWallNux from WallNux Support
        const devWallNux = await userDB.findByUsername('DevWallNux');
        const wallNuxSupport = await userDB.findByUsername('WallNux Support');
        
        if (devWallNux && wallNuxSupport) {
            const appealMessage = `📝 Новая апелляция от ${req.user.username}:\n\n${appealText}\n\n[ID апелляции: ${appeal.id}]`;
            
            await dmDB.create(appealMessage, wallNuxSupport.id, devWallNux.id);
            
            // Notify via Socket.IO
            const devSockets = Array.from(users.entries())
                .filter(([socketId, u]) => u.id === devWallNux.id)
                .map(([socketId]) => socketId);
            
            devSockets.forEach(socketId => {
                io.to(socketId).emit('new-appeal', {
                    appealId: appeal.id,
                    userId: req.user.id,
                    username: req.user.username,
                    text: appealText
                });
            });
        }
        
        res.json({ success: true, appealId: appeal.id });
    } catch (error) {
        console.error('Error submitting appeal:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get appeals (admin only)
app.get('/api/ban/appeals', authenticateToken, async (req, res) => {
    try {
        const appeals = await adminDB.getAppeals('pending');
        res.json(appeals);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Review appeal (admin only)
app.post('/api/ban/appeals/:id/review', authenticateToken, async (req, res) => {
    try {
        const { approved } = req.body;
        const appealId = req.params.id;
        
        await adminDB.reviewAppeal(appealId, req.user.id, approved);
        
        // If approved, unban user
        if (approved) {
            // Get appeal to find user
            const appeals = await adminDB.getAppeals('approved');
            const appeal = appeals.find(a => a.id == appealId);
            
            if (appeal) {
                await adminDB.unbanUser(appeal.user_id);
                
                // Remove BAN badge
                const user = await userDB.findById(appeal.user_id);
                let badges = [];
                try {
                    badges = JSON.parse(user.badges || '[]');
                } catch (e) {}
                
                badges = badges.filter(b => b.id !== 'banned');
                await userDB.update(appeal.user_id, { badges: JSON.stringify(badges) });
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error reviewing appeal:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Socket.IO connection handling
io.use((socket, next) => {
    console.log('🔐 Socket.IO authentication attempt');
    const token = socket.handshake.auth.token;
    
    if (!token) {
        console.error('❌ No token provided');
        return next(new Error('Authentication error: No token'));
    }
    
    console.log('✅ Token received, verifying...');
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('❌ Token verification failed:', err.message);
            return next(new Error('Authentication error: Invalid token'));
        }
        console.log('✅ Token verified for user:', decoded.id);
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
    });
});

io.on('connection', async (socket) => {
    console.log('✅ User connected:', socket.userId, 'Socket ID:', socket.id);
    
    try {
        const user = await userDB.findById(socket.userId);
        
        users.set(socket.id, {
            ...user,
            socketId: socket.id
        });
        
        // Update user status
        await userDB.updateStatus(socket.userId, 'Online');
        
        io.emit('user-list-update', Array.from(users.values()));
    } catch (error) {
        console.error('Error loading user:', error);
    }

    // User sends message
    socket.on('send-message', async (messageData) => {
        console.log('📨 Received message from user:', socket.userId);
        console.log('📨 Message data:', messageData);
        
        try {
            const { channelId, message } = messageData;
            
            if (!channelId || !message) {
                console.error('❌ Invalid message data');
                return;
            }
            
            // Get user info
            const user = await userDB.findById(socket.userId);
            console.log('👤 User info:', user?.username);
            
            // Save to database (support voice messages and video circles)
            let messageText = message.text || '';
            let messageType = message.type || 'text';
            let mediaData = null;
            
            if (message.type === 'voice') {
                messageText = '[Voice Message]';
                mediaData = JSON.stringify({
                    audioData: message.audioData,
                    duration: message.duration
                });
            } else if (message.type === 'video-circle') {
                messageText = '[Video Circle]';
                mediaData = JSON.stringify({
                    videoUrl: message.videoUrl
                });
            }
            
            const savedMessage = await messageDB.create(
                messageText,
                socket.userId,
                channelId,
                messageType,
                mediaData
            );
            
            // Parse badges if they exist
            let userBadges = [];
            if (user.badges) {
                try {
                    userBadges = typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges;
                } catch (e) {
                    userBadges = [];
                }
            }
            
            // Broadcast message with full user info and media data
            const broadcastMessage = {
                id: savedMessage.id,
                userId: socket.userId,
                author: user.username,
                avatar: user.avatar || user.username.charAt(0).toUpperCase(),
                badges: userBadges,
                text: message.text || messageText,
                type: message.type || 'text',
                audioData: message.audioData || null,
                duration: message.duration || null,
                videoUrl: message.videoUrl || null,
                timestamp: new Date()
            };
            
            io.emit('new-message', {
                channelId,
                message: broadcastMessage
            });
        } catch (error) {
            console.error('Message error:', error);
        }
    });

    // Direct message
    socket.on('send-dm', async (data) => {
        try {
            const { receiverId, message } = data;
            const sender = await userDB.findById(socket.userId);

            // Support voice messages and video circles
            let messageText = message.text || '';
            let messageType = message.type || 'text';
            let mediaData = null;
            
            if (message.type === 'voice') {
                messageText = '[Voice Message]';
                mediaData = JSON.stringify({
                    audioData: message.audioData,
                    duration: message.duration
                });
            } else if (message.type === 'video-circle') {
                messageText = '[Video Circle]';
                mediaData = JSON.stringify({
                    videoUrl: message.videoUrl
                });
            }
            
            const savedMessage = await dmDB.create(
                messageText,
                socket.userId,
                receiverId,
                messageType,
                mediaData
            );

            // Parse badges if they exist
            let senderBadges = [];
            if (sender.badges) {
                try {
                    senderBadges = typeof sender.badges === 'string' ? JSON.parse(sender.badges) : sender.badges;
                } catch (e) {
                    senderBadges = [];
                }
            }
            
            const messagePayload = {
                id: savedMessage.id,
                userId: socket.userId,
                author: sender.username,
                avatar: sender.avatar || sender.username.charAt(0).toUpperCase(),
                badges: senderBadges,
                text: message.text || messageText,
                type: message.type || 'text',
                audioData: message.audioData || null,
                duration: message.duration || null,
                videoUrl: message.videoUrl || null,
                timestamp: new Date()
            };

            // Send to receiver
            const receiverSocket = Array.from(users.values())
                .find(u => u.id === receiverId);
            
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit('new-dm', {
                    senderId: socket.userId,
                    message: messagePayload
                });
            }
            
            // Send back to sender
            socket.emit('dm-sent', {
                receiverId,
                message: messagePayload
            });
        } catch (error) {
            console.error('DM error:', error);
        }
    });

    // Add reaction
    socket.on('add-reaction', async (data) => {
        try {
            const { messageId, emoji } = data;
            await reactionDB.add(emoji, messageId, socket.userId);
            
            const reactions = await reactionDB.getByMessage(messageId);
            io.emit('reaction-update', { messageId, reactions });
        } catch (error) {
            console.error('Reaction error:', error);
        }
    });

    // Remove reaction
    socket.on('remove-reaction', async (data) => {
        try {
            const { messageId, emoji } = data;
            await reactionDB.remove(emoji, messageId, socket.userId);
            
            const reactions = await reactionDB.getByMessage(messageId);
            io.emit('reaction-update', { messageId, reactions });
        } catch (error) {
            console.error('Reaction error:', error);
        }
    });

    // Voice activity detection
    socket.on('voice-activity', (data) => {
        socket.broadcast.emit('user-speaking', {
            userId: socket.userId,
            speaking: data.speaking
        });
    });

    // Join voice channel (supports group calls)
    socket.on('join-voice-channel', (channelData) => {
        const { channelName, userId, isGroupCall } = channelData;
        
        socket.join(`voice-${channelName}`);
        
        if (!rooms.has(channelName)) {
            rooms.set(channelName, new Set());
        }
        rooms.get(channelName).add(socket.id);
        
        const userInfo = users.get(socket.id);
        
        // Notify others in the room
        socket.to(`voice-${channelName}`).emit('user-joined-voice', {
            userId: userId || socket.userId,
            socketId: socket.id,
            username: userInfo?.username,
            avatar: userInfo?.avatar,
            isGroupCall: isGroupCall || false
        });
        
        // Send existing users to the new joiner
        const existingUsers = Array.from(rooms.get(channelName))
            .filter(id => id !== socket.id)
            .map(id => {
                const user = users.get(id);
                return {
                    ...user,
                    socketId: id
                };
            });
        
        socket.emit('existing-voice-users', existingUsers);
        
        // For group calls, broadcast to all participants
        if (isGroupCall) {
            io.to(`voice-${channelName}`).emit('group-call-update', {
                participants: Array.from(rooms.get(channelName)).map(id => {
                    const user = users.get(id);
                    return {
                        ...user,
                        socketId: id
                    };
                })
            });
        }
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
        socket.to(data.to).emit('offer', {
            offer: data.offer,
            from: socket.id
        });
    });

    socket.on('answer', (data) => {
        socket.to(data.to).emit('answer', {
            answer: data.answer,
            from: socket.id
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.to).emit('ice-candidate', {
            candidate: data.candidate,
            from: socket.id
        });
    });

    socket.on('leave-voice-channel', (data) => {
        const channelName = typeof data === 'string' ? data : data.channelName;
        const isGroupCall = typeof data === 'object' ? data.isGroupCall : false;
        
        socket.leave(`voice-${channelName}`);
        
        if (rooms.has(channelName)) {
            rooms.get(channelName).delete(socket.id);
            socket.to(`voice-${channelName}`).emit('user-left-voice', {
                socketId: socket.id,
                isGroupCall: isGroupCall
            });
            
            // For group calls, broadcast updated participant list
            if (isGroupCall) {
                io.to(`voice-${channelName}`).emit('group-call-update', {
                    participants: Array.from(rooms.get(channelName)).map(id => {
                        const user = users.get(id);
                        return {
                            ...user,
                            socketId: id
                        };
                    })
                });
            }
        }
    });
    
    // Start group call (stream)
    socket.on('start-group-call', (data) => {
        const { channelId, channelName, type } = data;
        const roomName = `group-call-${channelId || channelName}`;
        
        socket.join(roomName);
        
        if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
        }
        rooms.get(roomName).add(socket.id);
        
        const userInfo = users.get(socket.id);
        
        // Notify all members of the channel/group about the group call
        io.emit('group-call-started', {
            channelId,
            channelName,
            type: type || 'video',
            startedBy: {
                id: socket.userId,
                username: userInfo?.username,
                avatar: userInfo?.avatar,
                socketId: socket.id
            },
            roomName: roomName
        });
    });
    
    // Join group call
    socket.on('join-group-call', (data) => {
        const { roomName } = data;
        
        socket.join(roomName);
        
        if (!rooms.has(roomName)) {
            rooms.set(roomName, new Set());
        }
        rooms.get(roomName).add(socket.id);
        
        const userInfo = users.get(socket.id);
        
        // Notify others
        socket.to(roomName).emit('user-joined-group-call', {
            userId: socket.userId,
            socketId: socket.id,
            username: userInfo?.username,
            avatar: userInfo?.avatar
        });
        
        // Send existing participants
        const participants = Array.from(rooms.get(roomName))
            .filter(id => id !== socket.id)
            .map(id => {
                const user = users.get(id);
                return {
                    ...user,
                    socketId: id
                };
            });
        
        socket.emit('group-call-participants', participants);
    });

    // Handle call initiation
    socket.on('initiate-call', (data) => {
        const { to, type, from } = data;
        console.log(`Call initiated from ${from.id} to ${to}, type: ${type}`);
        
        // Find receiver socket
        const receiverSocket = Array.from(users.values()).find(u => u.id === to);
        if (receiverSocket) {
            // Send incoming call notification to receiver
            io.to(receiverSocket.socketId).emit('incoming-call', {
                from: {
                    id: from.id,
                    username: from.username,
                    socketId: socket.id,
                    avatar: from.username?.charAt(0).toUpperCase()
                },
                type: type
            });
        } else {
            // User is offline
            socket.emit('call-rejected', { message: 'User is offline' });
        }
    });

    socket.on('accept-call', (data) => {
        const { to, from } = data;
        console.log(`Call accepted by ${from.id}, connecting to ${to}`);
        
        // Notify the caller that call was accepted
        io.to(to).emit('call-accepted', {
            from: {
                id: from.id,
                username: from.username,
                socketId: socket.id
            }
        });
    });

    socket.on('reject-call', (data) => {
        const { to } = data;
        console.log(`Call rejected, notifying ${to}`);
        
        // Notify the caller that call was rejected
        io.to(to).emit('call-rejected', {
            from: socket.id,
            message: 'Call was declined'
        });
    });
    
    // Video toggle handler
    socket.on('video-toggle', (data) => {
        const { to, enabled } = data;
        if (to) {
            io.to(to).emit('video-toggle', {
                from: socket.id,
                enabled: enabled
            });
        }
    });
    
    // End call
    socket.on('end-call', (data) => {
        const { to } = data;
        if (to) {
            io.to(to).emit('call-ended', { from: socket.id });
        }
    });

    // Status change
    socket.on('status-change', async (data) => {
        try {
            await userDB.updateStatus(socket.userId, data.status);
            const user = users.get(socket.id);
            if (user) {
                user.status = data.status;
                users.set(socket.id, user);
            }
            // Broadcast status change to all users
            io.emit('user-status-changed', {
                userId: socket.userId,
                status: data.status
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        const user = users.get(socket.id);
        
        if (user) {
            console.log(`${user.username} disconnected`);
            
            // Update status in database
            try {
                await userDB.updateStatus(socket.userId, 'Offline');
                // Broadcast offline status
                io.emit('user-status-changed', {
                    userId: socket.userId,
                    status: 'Offline'
                });
            } catch (error) {
                console.error('Error updating status:', error);
            }
            
            rooms.forEach((members, roomName) => {
                if (members.has(socket.id)) {
                    members.delete(socket.id);
                    io.to(`voice-${roomName}`).emit('user-left-voice', socket.id);
                }
            });
            
            users.delete(socket.id);
            io.emit('user-list-update', Array.from(users.values()));
        }
    });
});

// P2P Server API
require('./p2p-server')(app, messageDB);

// Start server
server.listen(PORT, () => {
    console.log(`Discord Clone server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/login.html in your browser`);
    console.log(`🌐 P2P режим активирован - сообщения отправляются напрямую между пользователями`);
});