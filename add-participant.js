// Добавление участников в звонок

let currentCallParticipants = new Set(); // ID участников в текущем звонке
let currentCallRoomName = null; // Название комнаты текущего звонка

// Инициализация
function initializeAddParticipant() {
    const addParticipantBtn = document.getElementById('addParticipantBtn');
    const addParticipantModal = document.getElementById('addParticipantModal');
    const addParticipantCloseBtn = document.getElementById('addParticipantCloseBtn');
    const addParticipantSearch = document.getElementById('addParticipantSearch');
    
    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', () => {
            openAddParticipantModal();
        });
    }
    
    if (addParticipantCloseBtn) {
        addParticipantCloseBtn.addEventListener('click', () => {
            closeAddParticipantModal();
        });
    }
    
    if (addParticipantSearch) {
        addParticipantSearch.addEventListener('input', (e) => {
            filterParticipantList(e.target.value);
        });
    }
    
    // Закрытие по клику вне модального окна
    if (addParticipantModal) {
        addParticipantModal.addEventListener('click', (e) => {
            if (e.target === addParticipantModal) {
                closeAddParticipantModal();
            }
        });
    }
}

// Открыть модальное окно
async function openAddParticipantModal() {
    console.log('📋 Открываем модальное окно добавления участника');
    
    const modal = document.getElementById('addParticipantModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Загрузить список друзей
    await loadFriendsForCall();
}

// Закрыть модальное окно
function closeAddParticipantModal() {
    const modal = document.getElementById('addParticipantModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    const searchInput = document.getElementById('addParticipantSearch');
    if (searchInput) {
        searchInput.value = '';
    }
}

// Загрузить список пользователей из ЛС
async function loadFriendsForCall() {
    try {
        console.log('📋 Загружаем список пользователей из ЛС...');
        
        // Получаем список всех пользователей
        const usersResponse = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usersResponse.ok) {
            console.error('❌ Не удалось загрузить пользователей');
            return;
        }
        
        const allUsers = await usersResponse.json();
        const currentUserId = currentUser.id;
        
        console.log(`📋 Всего пользователей: ${allUsers.length}`);
        
        // Проверяем с кем есть переписка
        const usersWithDMs = [];
        for (const user of allUsers) {
            if (user.id === currentUserId) continue;
            
            try {
                const dmResponse = await fetch(`/api/dm/${user.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (dmResponse.ok) {
                    const messages = await dmResponse.json();
                    if (messages && messages.length > 0) {
                        usersWithDMs.push(user);
                    }
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
        
        console.log(`✅ Найдено пользователей с ЛС: ${usersWithDMs.length}`);
        
        displayFriendsForCall(usersWithDMs);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки ЛС:', error);
    }
}

// Показать список друзей
function displayFriendsForCall(friends) {
    const list = document.getElementById('addParticipantList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (friends.length === 0) {
        list.innerHTML = `
            <div class="add-participant-empty">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                <div>Нет друзей для добавления</div>
            </div>
        `;
        return;
    }
    
    friends.forEach(friend => {
        const isInCall = currentCallParticipants.has(friend.id);
        const item = createFriendItemForCall(friend, isInCall);
        list.appendChild(item);
    });
}

// Создать элемент друга
function createFriendItemForCall(friend, isInCall) {
    const div = document.createElement('div');
    div.className = 'add-participant-item';
    if (isInCall) {
        div.classList.add('disabled');
    }
    
    const avatarHTML = friend.avatar && (friend.avatar.startsWith('http') || friend.avatar.startsWith('/uploads'))
        ? `<img src="${friend.avatar}" alt="${friend.username}">`
        : (friend.avatar || friend.username.charAt(0).toUpperCase());
    
    const statusClass = friend.status === 'Online' ? 'online' : '';
    const statusText = isInCall ? 'Уже в звонке' : friend.status;
    const statusExtraClass = isInCall ? 'in-call' : '';
    
    div.innerHTML = `
        <div class="add-participant-avatar">${avatarHTML}</div>
        <div class="add-participant-info">
            <div class="add-participant-name">${friend.username}</div>
            <div class="add-participant-status ${statusClass} ${statusExtraClass}">${statusText}</div>
        </div>
        <button class="add-participant-btn" ${isInCall ? 'disabled' : ''}>
            ${isInCall ? 'В звонке' : 'Добавить'}
        </button>
    `;
    
    if (!isInCall) {
        const btn = div.querySelector('.add-participant-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addParticipantToCall(friend);
        });
    }
    
    return div;
}

// Добавить участника в звонок
async function addParticipantToCall(friend) {
    console.log('➕ Добавляем участника в звонок:', friend.username);
    
    // Если это первый добавляемый участник (звонок 1-на-1 превращается в групповой)
    if (!currentGroupCall) {
        console.log('🔄 Превращаем звонок 1-на-1 в групповой');
        
        // Создать комнату для группового звонка
        currentCallRoomName = `group-call-dm-${Date.now()}`;
        
        // Уведомить сервер о создании группового звонка
        if (socket && socket.connected) {
            socket.emit('create-group-call-from-dm', {
                roomName: currentCallRoomName,
                participants: [currentUser.id, callRemoteUser?.id].filter(Boolean)
            });
        }
        
        // Обновить currentGroupCall
        currentGroupCall = {
            roomName: currentCallRoomName,
            type: 'video',
            isDM: true
        };
        
        // Показать кнопку добавления участника
        const addBtn = document.getElementById('addParticipantBtn');
        if (addBtn) {
            addBtn.style.display = 'flex';
        }
        
        // Переключиться на групповой интерфейс
        if (typeof showGroupCallInterface === 'function') {
            showGroupCallInterface();
        }
    }
    
    // Добавить участника в список
    currentCallParticipants.add(friend.id);
    
    // Отправить приглашение
    if (socket && socket.connected) {
        socket.emit('invite-to-group-call', {
            roomName: currentCallRoomName || currentGroupCall?.roomName,
            userId: friend.id,
            invitedBy: {
                id: currentUser.id,
                username: currentUser.username,
                avatar: currentUser.avatar
            }
        });
    }
    
    // Закрыть модальное окно
    closeAddParticipantModal();
    
    // Показать уведомление
    if (window.notificationManager) {
        window.notificationManager.show('Участник добавлен', {
            body: `${friend.username} приглашен в звонок`,
            type: 'success'
        });
    }
}

// Фильтровать список
function filterParticipantList(query) {
    const items = document.querySelectorAll('.add-participant-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
        const name = item.querySelector('.add-participant-name').textContent.toLowerCase();
        if (name.includes(lowerQuery)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Показать кнопку добавления участника
function showAddParticipantButton() {
    const btn = document.getElementById('addParticipantBtn');
    if (btn) {
        btn.style.display = 'flex';
    }
}

// Скрыть кнопку добавления участника
function hideAddParticipantButton() {
    const btn = document.getElementById('addParticipantBtn');
    if (btn) {
        btn.style.display = 'none';
    }
}

// Обновить список участников в звонке
function updateCallParticipants(participants) {
    currentCallParticipants.clear();
    participants.forEach(p => {
        if (p.id) {
            currentCallParticipants.add(p.id);
        }
    });
}

// Сбросить состояние при завершении звонка
function resetAddParticipantState() {
    currentCallParticipants.clear();
    currentCallRoomName = null;
    hideAddParticipantButton();
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAddParticipant);
} else {
    initializeAddParticipant();
}

// Сделать функции глобальными
window.showAddParticipantButton = showAddParticipantButton;
window.hideAddParticipantButton = hideAddParticipantButton;
window.updateCallParticipants = updateCallParticipants;
window.resetAddParticipantState = resetAddParticipantState;

console.log('✅ Модуль добавления участников загружен');
