// Серверная часть для управления устройствами и QR/Code входа

const crypto = require('crypto');

// Хранилище активных кодов входа (в продакшене использовать Redis)
const loginCodes = new Map(); // code -> { userId, timestamp, type }
const devices = new Map(); // userId -> [devices]

// Генерация 6-значного кода
function generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Генерация уникального кода для QR
function generateQRCode() {
    return crypto.randomBytes(32).toString('hex');
}

// Получить информацию об устройстве
function getDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'Unknown';
    
    // Определить браузер
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Определить ОС
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return {
        browser,
        os,
        ip,
        userAgent,
        lastActive: Date.now()
    };
}

// Добавить устройство
function addDevice(userId, deviceInfo, token) {
    if (!devices.has(userId)) {
        devices.set(userId, []);
    }
    
    const device = {
        id: crypto.randomBytes(16).toString('hex'),
        ...deviceInfo,
        token,
        createdAt: Date.now()
    };
    
    devices.get(userId).push(device);
    return device;
}

// Получить устройства пользователя
function getUserDevices(userId) {
    return devices.get(userId) || [];
}

// Удалить устройство
function removeDevice(userId, deviceId) {
    if (!devices.has(userId)) return false;
    
    const userDevices = devices.get(userId);
    const index = userDevices.findIndex(d => d.id === deviceId);
    
    if (index >= 0) {
        userDevices.splice(index, 1);
        return true;
    }
    
    return false;
}

// Сбросить все устройства
function removeAllDevices(userId) {
    devices.delete(userId);
}

module.exports = {
    generateAccessCode,
    generateQRCode,
    getDeviceInfo,
    addDevice,
    getUserDevices,
    removeDevice,
    removeAllDevices,
    loginCodes,
    devices
};
