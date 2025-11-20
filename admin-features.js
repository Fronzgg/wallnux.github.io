// ============================================
// ADMIN PANEL & BADGES SYSTEM - FULL VERSION
// ============================================

let selectedUserId = null;
let currentUserBadges = [];

function initializeAdminPanel() {
    const adminPanelClose = document.getElementById('adminPanelClose');
    const adminSearchBtn = document.getElementById('adminSearchBtn');
    const giveBadgeBtn = document.getElementById('giveBadgeBtn');
    const banUserBtn = document.getElementById('banUserBtn');
    const unbanUserBtn = document.getElementById('unbanUserBtn');
    
    if (adminPanelClose) {
        adminPanelClose.addEventListener('click', () => {
            document.getElementById('adminPanel').classList.remove('open');
        });
    }
    
    if (adminSearchBtn) {
        adminSearchBtn.addEventListener('click', searchUsersForAdmin);
    }
    
    if (giveBadgeBtn) {
        giveBadgeBtn.addEventListener('click', giveBadgeToUser);
    }
    
    if (banUserBtn) {
        banUserBtn.addEventListener('click', () => banUser(true));
    }
    
    if (unbanUserBtn) {
        unbanUserBtn.addEventListener('click', () => banUser(false));
    }
    
    // Check if current user is admin
    checkAdminStatus();
}

async function checkAdminStatus() {
    // ДЛЯ ТЕСТИРОВАНИЯ: Открыто для всех
    addAdminButton();
    
    /* Раскомментируйте для продакшена:
    try {
        const response = await fetch('/api/admin/check', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
                addAdminButton();
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
    */
}

function addAdminButton() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    
    const settingsBody = settingsPanel.querySelector('.settings-body');
    if (!settingsBody) return;
    
    // Check if already added
    if (document.getElementById('openAdminPanel')) return;
    
    const adminSection = document.createElement('div');
    adminSection.className = 'settings-section';
    adminSection.innerHTML = `
        <div class="settings-section-title">АДМИНИСТРИРОВАНИЕ</div>
        <div class="settings-item" id="openAdminPanel" style="cursor: pointer;">
            <div class="settings-item-label">
                <h3>🛡️ Админ панель</h3>
                <p>Управление пользователями и бейджами</p>
            </div>
        </div>
    `;
    
    settingsBody.appendChild(adminSection);
    
    document.getElementById('openAdminPanel').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('open');
        document.getElementById('adminPanel').classList.add('open');
    });
}

async function searchUsersForAdmin() {
    const searchInput = document.getElementById('adminUserSearch');
    const query = searchInput.value.trim();
    
    if (!query) {
        showCustomNotification('warning', 'Внимание', 'Введите имя пользователя');
        return;
    }
    
    // Получаем токен из localStorage
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
        showCustomNotification('error', 'Ошибка', 'Токен авторизации не найден. Войдите заново.');
        return;
    }
    
    console.log('🔍 Searching for:', query);
    console.log('🔑 Token exists:', !!authToken);
    
    try {
        const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const users = await response.json();
        displayAdminSearchResults(users);
    } catch (error) {
        console.error('Error searching users:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось найти пользователей');
    }
}

function displayAdminSearchResults(users) {
    const resultsDiv = document.getElementById('adminSearchResults');
    resultsDiv.innerHTML = '';
    
    if (users.length === 0) {
        resultsDiv.innerHTML = '<div class="admin-empty">Пользователи не найдены</div>';
        return;
    }
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'admin-user-card';
        userCard.onclick = () => selectUser(user);
        
        let badges = [];
        try {
            badges = JSON.parse(user.badges || '[]');
        } catch (e) {}
        
        const badgesHTML = badges.map(b => 
            `<span class="user-badge" style="background: ${b.color}20; color: ${b.color};">${b.icon} ${b.name}</span>`
        ).join('');
        
        userCard.innerHTML = `
            <div class="admin-user-avatar">${user.avatar || user.username.charAt(0).toUpperCase()}</div>
            <div class="admin-user-info">
                <div class="admin-user-name">${user.username}</div>
                <div class="admin-user-email">${user.email}</div>
                <div class="admin-user-badges">${badgesHTML || '<span class="no-badges">Нет бейджей</span>'}</div>
            </div>
        `;
        
        resultsDiv.appendChild(userCard);
    });
}

function selectUser(user) {
    selectedUserId = user.id;
    
    try {
        currentUserBadges = JSON.parse(user.badges || '[]');
    } catch (e) {
        currentUserBadges = [];
    }
    
    // Highlight selected
    document.querySelectorAll('.admin-user-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.admin-user-card').classList.add('selected');
    
    // Update selected user info
    document.getElementById('selectedUserInfo').innerHTML = `
        <strong>Выбран:</strong> ${user.username} (ID: ${user.id})
    `;
    
    showCustomNotification('success', 'Выбран', `Пользователь ${user.username} выбран`);
}

async function giveBadgeToUser() {
    if (!selectedUserId) {
        showCustomNotification('warning', 'Внимание', 'Сначала выберите пользователя');
        return;
    }
    
    const badgeSelect = document.getElementById('badgeSelect');
    const badgeId = badgeSelect.value;
    
    if (!badgeId) {
        showCustomNotification('warning', 'Внимание', 'Выберите бейдж');
        return;
    }
    
    const badges = {
        'verified': { id: 'verified', name: 'Verified', icon: '✓', color: '#1DA1F2' },
        'developer': { id: 'developer', name: 'Developer', icon: '⚙️', color: '#5865f2' },
        'founder': { id: 'founder', name: 'Founder', icon: '👑', color: '#ffd700' },
        'admin': { id: 'admin', name: 'Admin', icon: '🛡️', color: '#ed4245' },
        'nitro': { id: 'nitro', name: 'Nitro', icon: '💎', color: '#ff73fa' },
        'partner': { id: 'partner', name: 'Partner', icon: '🤝', color: '#4f545c' },
        'moderator': { id: 'moderator', name: 'Moderator', icon: '🔨', color: '#3ba55d' },
        'supporter': { id: 'supporter', name: 'Supporter', icon: '❤️', color: '#f04747' }
    };
    
    const badge = badges[badgeId];
    
    // Получаем токен из localStorage
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
        showCustomNotification('error', 'Ошибка', 'Токен авторизации не найден. Войдите заново.');
        return;
    }
    
    console.log('🔑 Token exists:', !!authToken);
    console.log('👤 Selected user:', selectedUserId);
    console.log('🏅 Badge:', badge);
    
    try {
        const response = await fetch('/api/admin/give-badge', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: selectedUserId, badge })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error response:', errorData);
            throw new Error(errorData.error || 'Failed to give badge');
        }
        
        showCustomNotification('success', 'Успех', `Бейдж ${badge.name} выдан!`);
        
        // Refresh search
        searchUsersForAdmin();
    } catch (error) {
        console.error('Error giving badge:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось выдать бейдж');
    }
}

async function banUser(shouldBan) {
    if (!selectedUserId) {
        showCustomNotification('warning', 'Внимание', 'Сначала выберите пользователя');
        return;
    }
    
    const action = shouldBan ? 'забанить' : 'разбанить';
    const confirmed = confirm(`Вы уверены, что хотите ${action} этого пользователя?`);
    
    if (!confirmed) return;
    
    // Получаем токен из localStorage
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
        showCustomNotification('error', 'Ошибка', 'Токен авторизации не найден. Войдите заново.');
        return;
    }
    
    console.log('🔑 Token exists:', !!authToken);
    console.log('👤 Selected user:', selectedUserId);
    console.log('🚫 Action:', shouldBan ? 'BAN' : 'UNBAN');
    
    try {
        const endpoint = shouldBan ? '/api/admin/ban' : '/api/admin/unban';
        const body = shouldBan 
            ? { userId: selectedUserId, reason: 'Banned by admin' }
            : { userId: selectedUserId };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Ban/unban failed');
        }
        
        showCustomNotification('success', 'Успех', `Пользователь ${shouldBan ? 'забанен' : 'разбанен'}!`);
    } catch (error) {
        console.error('Error banning user:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось выполнить действие');
    }
}

// Custom notification system
function showCustomNotification(type, title, message) {
    const container = document.getElementById('customNotifications') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'customNotifications';
    container.className = 'custom-notifications-container';
    document.body.appendChild(container);
    return container;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminPanel);
} else {
    initializeAdminPanel();
}

console.log('✅ Admin panel initialized');
