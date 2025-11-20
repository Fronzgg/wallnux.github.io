// Интеграция уведомлений и значков
// Добавь этот код в script.js

// ============================================
// УВЕДОМЛЕНИЯ ПРИ ПОЛУЧЕНИИ СООБЩЕНИЯ
// ============================================
// Найди socket.on('new-message') и добавь после получения сообщения:

/*
socket.on('new-message', (data) => {
    console.log('Received message:', data);
    const channelId = data.channelId;
    
    // ... существующий код ...
    
    // ДОБАВИТЬ ЭТО:
    // Уведомление если сообщение не от текущего пользователя
    if (data.sender_id !== currentUserId && window.notificationManager) {
        window.notificationManager.show(
            data.sender_name || 'Новое сообщение',
            {
                body: data.content.substring(0, 100),
                type: 'message',
                icon: data.sender_avatar || '/uploads/default-avatar.png',
                onClick: () => {
                    window.focus();
                    // Открыть канал с сообщением
                    if (channelId) {
                        loadChannel(channelId);
                    }
                }
            }
        );
    }
});
*/

// ============================================
// ЗНАЧКИ В ПРОФИЛЕ
// ============================================
// Найди функцию showProfile или где загружается профиль и добавь:

/*
async function showProfile(userId) {
    // ... существующий код загрузки профиля ...
    
    // ДОБАВИТЬ ЭТО после получения данных пользователя:
    if (user.badges && window.renderBadges) {
        // Создать контейнер для значков если его нет
        let badgesContainer = document.querySelector('.profile-badges');
        if (!badgesContainer) {
            badgesContainer = document.createElement('div');
            badgesContainer.className = 'profile-badges';
            // Вставить после имени пользователя
            const profileName = document.querySelector('.profile-view-name');
            if (profileName) {
                profileName.parentNode.insertBefore(badgesContainer, profileName.nextSibling);
            }
        }
        
        // Отрисовать значки
        window.renderBadges(user.badges, badgesContainer);
    }
}
*/

// ============================================
// ЗНАЧКИ В СПИСКЕ ДРУЗЕЙ
// ============================================
// Найди где отрисовываются друзья (renderFriendsList) и добавь:

/*
function renderFriendsList(friends) {
    // ... существующий код ...
    
    friends.forEach(friend => {
        const div = document.createElement('div');
        // ... существующий код создания элемента ...
        
        // ДОБАВИТЬ ЭТО:
        // Добавить значки к имени
        if (friend.badges && friend.badges.length > 0 && window.addBadgesToUsername) {
            const nameElement = div.querySelector('.friend-name');
            if (nameElement) {
                const badgesHTML = friend.badges
                    .map(badgeId => {
                        const badge = window.BADGES[badgeId];
                        return badge ? `<span class="user-badge" style="color: ${badge.color}" title="${badge.name}">${badge.icon}</span>` : '';
                    })
                    .join('');
                nameElement.innerHTML = `${friend.username} ${badgesHTML}`;
            }
        }
    });
}
*/

// ============================================
// ЗНАЧКИ В СООБЩЕНИЯХ
// ============================================
// Найди где отрисовываются сообщения и добавь значки к имени отправителя:

/*
function displayMessage(message) {
    // ... существующий код ...
    
    // ДОБАВИТЬ ЭТО к имени отправителя:
    if (message.sender_badges && window.addBadgesToUsername) {
        const senderName = addBadgesToUsername(message.sender_name, message.sender_badges);
        messageElement.querySelector('.message-author').innerHTML = senderName;
    }
}
*/

console.log('📝 Инструкции по интеграции готовы!');
console.log('Смотри комментарии в этом файле');
