// Система значков (бейджей) WallNux Messenger

const BADGES = {
    founder: {
        name: 'Основатель',
        icon: '👑',
        color: '#FFD700',
        description: 'Основатель WallNux Messenger'
    },
    admin: {
        name: 'Администратор',
        icon: '🛡️',
        color: '#ED4245',
        description: 'Администратор сервера'
    },
    moderator: {
        name: 'Модератор',
        icon: '⚔️',
        color: '#5865F2',
        description: 'Модератор сервера'
    },
    verified: {
        name: 'Подтвержденный',
        icon: '✓',
        color: '#1DA1F2',
        description: 'Официальный аккаунт'
    },
    developer: {
        name: 'Разработчик',
        icon: '</>',
        color: '#00D9FF',
        description: 'Разработчик'
    },
    team: {
        name: 'Команда проекта',
        icon: '✓',
        color: '#1DA1F2',
        description: 'Официальный аккаунт команды проекта'
    },
    support: {
        name: 'Поддержка',
        icon: '🎧',
        color: '#43B581',
        description: 'Официальная поддержка'
    },
    supporter: {
        name: 'Спонсор',
        icon: '💎',
        color: '#9B59B6',
        description: 'Поддержал проект'
    },
    early: {
        name: 'Ранний пользователь',
        icon: '🌟',
        color: '#FAA81A',
        description: 'Один из первых пользователей'
    },
    banned: {
        name: 'Заблокирован',
        icon: '🚫',
        color: '#747F8D',
        description: 'Пользователь заблокирован'
    },
    nitro: {
        name: 'Nitro',
        icon: '⚡',
        color: '#FF73FA',
        description: 'Подписка Nitro активна'
    },
    booster: {
        name: 'Бустер',
        icon: '🚀',
        color: '#F47FFF',
        description: 'Бустит сервер'
    }
};

// Отрисовка значков
function renderBadges(badges, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!badges || badges.length === 0) return;
    
    badges.forEach(badgeId => {
        const badge = BADGES[badgeId];
        if (!badge) return;
        
        const badgeEl = document.createElement('span');
        badgeEl.className = 'user-badge';
        badgeEl.setAttribute('data-badge', badgeId);
        badgeEl.setAttribute('title', badge.description);
        badgeEl.style.color = badge.color;
        badgeEl.textContent = badge.icon;
        
        container.appendChild(badgeEl);
    });
}

// Добавить галочку verified рядом с именем
function addVerifiedBadge(username, badges) {
    if (!badges || !Array.isArray(badges)) return username;
    
    if (badges.includes('verified') || badges.includes('team')) {
        return `${username}<span class="verified-badge" title="Официальный аккаунт"></span>`;
    }
    
    return username;
}

// Добавить значки к имени пользователя
function addBadgesToUsername(username, badges) {
    if (!badges || badges.length === 0) return username;
    
    const badgeIcons = badges
        .map(badgeId => BADGES[badgeId]?.icon)
        .filter(Boolean)
        .join(' ');
    
    return `${username} ${badgeIcons}`;
}

// Отображение бейджей в профиле (большие карточки)
function displayUserBadges(badges, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!badges || badges.length === 0) {
        container.innerHTML = '<div class="no-badges">Нет значков</div>';
        return;
    }
    
    badges.forEach(badgeId => {
        const badge = BADGES[badgeId];
        if (!badge) return;
        
        const badgeCard = document.createElement('div');
        badgeCard.className = 'profile-badge';
        badgeCard.setAttribute('title', badge.description);
        badgeCard.style.borderColor = badge.color;
        
        badgeCard.innerHTML = `
            <span class="profile-badge-icon" style="color: ${badge.color}">${badge.icon}</span>
            <span class="profile-badge-name">${badge.name}</span>
        `;
        
        container.appendChild(badgeCard);
    });
}

// Экспорт
window.BADGES = BADGES;
window.renderBadges = renderBadges;
window.addBadgesToUsername = addBadgesToUsername;
window.addVerifiedBadge = addVerifiedBadge;
window.displayUserBadges = displayUserBadges;
