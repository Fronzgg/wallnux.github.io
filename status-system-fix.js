// Исправление системы статусов

// Правильные статусы
const STATUS_TYPES = {
    online: { text: 'В сети', color: '#3ba55d', class: 'online' },
    idle: { text: 'Не активен', color: '#faa61a', class: 'idle' },
    dnd: { text: 'Не беспокоить', color: '#f04747', class: 'dnd' },
    offline: { text: 'Не в сети', color: '#747f8d', class: 'offline' }
};

// Функция для создания индикатора статуса
function createStatusIndicator(status) {
    const statusInfo = STATUS_TYPES[status] || STATUS_TYPES.offline;
    return `<span class="status-indicator ${statusInfo.class}" title="${statusInfo.text}"></span>`;
}

// Функция для обновления статуса в UI
function updateUserStatusInUI(userId, status) {
    // Обновить в списке друзей
    const friendElement = document.querySelector(`[data-user-id="${userId}"]`);
    if (friendElement) {
        const statusIndicator = friendElement.querySelector('.status-indicator');
        if (statusIndicator) {
            const statusInfo = STATUS_TYPES[status] || STATUS_TYPES.offline;
            statusIndicator.className = `status-indicator ${statusInfo.class}`;
            statusIndicator.title = statusInfo.text;
        }
        
        const statusText = friendElement.querySelector('.friend-status');
        if (statusText) {
            const statusInfo = STATUS_TYPES[status] || STATUS_TYPES.offline;
            statusText.textContent = statusInfo.text;
            statusText.className = `friend-status ${statusInfo.class}`;
        }
    }
    
    // Обновить в профиле если открыт
    const profileView = document.querySelector('.profile-view');
    if (profileView && profileView.getAttribute('data-user-id') === userId.toString()) {
        const profileStatus = profileView.querySelector('.profile-view-status');
        if (profileStatus) {
            const statusInfo = STATUS_TYPES[status] || STATUS_TYPES.offline;
            profileStatus.innerHTML = `${createStatusIndicator(status)} ${statusInfo.text}`;
        }
    }
    
    // Обновить в аватарах сообщений
    const messageAvatars = document.querySelectorAll(`.message-avatar[data-user-id="${userId}"]`);
    messageAvatars.forEach(avatar => {
        let indicator = avatar.querySelector('.status-indicator');
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'status-indicator';
            avatar.appendChild(indicator);
        }
        const statusInfo = STATUS_TYPES[status] || STATUS_TYPES.offline;
        indicator.className = `status-indicator ${statusInfo.class}`;
        indicator.title = statusInfo.text;
    });
}

// Экспорт
window.STATUS_TYPES = STATUS_TYPES;
window.createStatusIndicator = createStatusIndicator;
window.updateUserStatusInUI = updateUserStatusInUI;

console.log('✅ Система статусов загружена');
