// Global state
let currentChannel = 'general';
let channels = { 'general': [], 'random': [] };
let servers = [];
let inCall = false;
let localStream = null;
let screenStream = null;
let peerConnections = {};
let isVideoEnabled = true;
let isAudioEnabled = true;
let isMuted = false;
let isDeafened = false;
let currentUser = null;
let socket = null;
let token = null;
let currentView = 'friends';
let currentServerId = null;
let currentDMUserId = null;

// Сделать переменные доступными глобально для других скриптов
window.currentUser = null;
window.socket = null;
window.currentChannel = 'general';
window.currentDMUserId = null;

// Проверка загрузки Socket.IO при загрузке скрипта
console.log('📜 script.js loaded');
console.log('🔌 Socket.IO available:', typeof io !== 'undefined');
if (typeof io === 'undefined') {
    console.error('❌ Socket.IO library NOT loaded! Check if server is running.');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');
    
    // Проверка авторизации
    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }
    
    // Парсинг данных пользователя
    try {
        currentUser = JSON.parse(userStr);
        window.currentUser = currentUser; // Сделать доступным глобально
        if (!currentUser || !currentUser.id) {
            throw new Error('Invalid user data');
        }
        
        // Инициализация приложения в отдельном try-catch
        try {
            initializeApp();
        } catch (initError) {
            console.error('❌ Error during app initialization:', initError);
            console.error('Stack:', initError.stack);
            // Не останавливаем выполнение, продолжаем работу
        }
    } catch (e) {
        console.error('❌ Auth error:', e);
        console.error('Stack:', e.stack);
        localStorage.clear();
        // window.location.href = 'login.html';
    }
});

function initializeApp() {
    console.log('🚀 Initializing app...');
    console.log('📋 Current user:', currentUser);
    console.log('🔑 Token exists:', !!token);
    
    // Функция для безопасного вызова инициализации
    const safeInit = (fn, name) => {
        try {
            fn();
        } catch (error) {
            console.error(`❌ Error in ${name}:`, error);
        }
    };
    
    // Simulate loading screen
    safeInit(simulateLoading, 'simulateLoading');
    
    safeInit(updateUserInfo, 'updateUserInfo');
    safeInit(initializeFriendsTabs, 'initializeFriendsTabs');
    safeInit(initializeChannels, 'initializeChannels');
    safeInit(initializeMessageInput, 'initializeMessageInput');
    safeInit(initializeUserControls, 'initializeUserControls');
    safeInit(initializeCallControls, 'initializeCallControls');
    safeInit(initializeServerManagement, 'initializeServerManagement');
    safeInit(initializeFileUpload, 'initializeFileUpload');
    safeInit(initializeEmojiPicker, 'initializeEmojiPicker');
    safeInit(initializeDraggableCallWindow, 'initializeDraggableCallWindow');
    
    console.log('🔌 About to connect to Socket.IO...');
    safeInit(connectToSocketIO, 'connectToSocketIO');
    console.log('✅ connectToSocketIO() called');
    
    safeInit(requestNotificationPermission, 'requestNotificationPermission');
    safeInit(loadUserServers, 'loadUserServers');
    safeInit(showFriendsView, 'showFriendsView');
    
    // Initialize adaptive layout after loading
    setTimeout(() => {
        initAdaptiveLayout();
    }, 500);
    
    // Проверка через 2 секунды
    setTimeout(() => {
        console.log('🔍 Socket check after 2 seconds:');
        console.log('  - Socket exists:', !!socket);
        console.log('  - Socket connected:', socket ? socket.connected : 'no socket');
        console.log('  - Socket ID:', socket ? socket.id : 'no socket');
        
        if (!socket) {
            console.error('❌ Socket was not initialized!');
            alert('Socket connection failed. Please check:\n1. Is server running? (node server.js)\n2. Check browser console for errors\n3. Try refreshing the page');
        } else if (!socket.connected) {
            console.error('❌ Socket exists but not connected!');
            alert('Socket not connected. Server might be down. Check if "node server.js" is running.');
        }
    }, 2000);
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/icon.png' });
    }
}

function updateUserInfo() {
    const userAvatar = document.querySelector('.user-panel .user-avatar');
    const username = document.querySelector('.username');
    
    if (userAvatar && currentUser) {
        if (currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('/uploads'))) {
            userAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            userAvatar.textContent = currentUser.avatar || currentUser.username.charAt(0).toUpperCase();
        }
    }
    if (username) username.textContent = currentUser.username;
}

function connectToSocketIO() {
    console.log('🔌 Connecting to Socket.IO...');
    console.log('Token:', token ? 'exists' : 'missing');
    console.log('Token value:', token);
    
    if (typeof io === 'undefined') {
        console.error('❌ Socket.IO library not loaded!');
        alert('Socket.IO library not loaded! Please refresh the page.');
        return;
    }
    
    // Подключение с правильными параметрами
    socket = io({
        auth: {
            token: token
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
    });
    
    window.socket = socket; // Сделать доступным глобально
    
    console.log('✅ Socket instance created');
    
    socket.on('connect', () => {
        console.log('✅ Connected to server! Socket ID:', socket.id);
        console.log('✅ Socket connected:', socket.connected);
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        console.error('❌ Full error:', error);
        alert('Failed to connect to server. Please check if server is running on port 3000.');
    });
    
    socket.on('disconnect', (reason) => {
        console.log('⚠️ Disconnected from server. Reason:', reason);
    });
    
    // Принудительный выход (сеанс завершен)
    socket.on('force-logout', (data) => {
        console.log('🚫 Принудительный выход:', data.reason);
        
        // Показать модальное окно
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        `;
        
        modal.innerHTML = `
            <div style="background: #2f3136; padding: 32px; border-radius: 12px; text-align: center; max-width: 400px;">
                <h2 style="color: #fff; margin-bottom: 16px;">🚫 Сеанс завершен</h2>
                <p style="color: #b9bbbe; margin-bottom: 24px;">${data.reason}</p>
                <button onclick="window.location.href='login.html'" style="
                    background: #5865f2;
                    color: #fff;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                ">Хорошо</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Через 5 секунд принудительно перенаправить
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 5000);
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });
    
    socket.on('reconnect_attempt', () => {
        console.log('🔄 Attempting to reconnect...');
    });
    
    socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error);
    });
    
    socket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed');
        alert('Cannot connect to server. Please check if server is running.');
    });
        
        socket.on('new-message', (data) => {
            console.log('Received message:', data); // Debug
            const channelId = data.channelId;
            const channelName = getChannelNameById(channelId);

            if (!channels[channelName]) {
                channels[channelName] = [];
            }
            channels[channelName].push(data.message);
            
            if (channelName === currentChannel && currentView === 'server') {
                addMessageToUI(data.message);
                scrollToBottom();
            }
            
            // Уведомления через новую систему
            if (window.notificationManager && data.message.author !== currentUser.username) {
                const notificationText = data.message.type === 'voice' 
                    ? 'Голосовое сообщение'
                    : data.message.type === 'video-circle'
                    ? 'Видео кружок'
                    : data.message.text;
                
                window.notificationManager.show(
                    data.message.author,
                    {
                        body: notificationText,
                        type: 'message',
                        onClick: () => {
                            window.focus();
                        }
                    }
                );
            }
            
            // Старая система (fallback)
            if (document.hidden) {
                const notificationText = data.message.type === 'voice' 
                    ? `${data.message.author}: Голосовое сообщение`
                    : data.message.type === 'video-circle'
                    ? `${data.message.author}: Видео кружок`
                    : `${data.message.author}: ${data.message.text}`;
                showNotification('Новое сообщение', notificationText);
            }
        });
        
        socket.on('reaction-update', (data) => {
            updateMessageReactions(data.messageId, data.reactions);
        });

        // WebRTC Signaling
        socket.on('user-joined-voice', (data) => {
            console.log('User joined voice:', data);
            createPeerConnection(data.socketId, true);
        });

        socket.on('existing-voice-users', (users) => {
            users.forEach(user => {
                createPeerConnection(user.socketId, false);
            });
        });

        socket.on('user-left-voice', (data) => {
            const socketId = typeof data === 'string' ? data : data.socketId;
            if (peerConnections[socketId]) {
                peerConnections[socketId].close();
                delete peerConnections[socketId];
            }
            const remoteVideo = document.getElementById(`remote-${socketId}`);
            if (remoteVideo) remoteVideo.remove();
        });
        
        // Group call handlers
        socket.on('group-call-started', (data) => {
            console.log('📢 Групповой звонок начат:', data);
            const { channelId, channelName, type, startedBy, roomName } = data;
            
            // Показать уведомление если это не мы начали
            if (startedBy.id !== currentUser.id) {
                showGroupCallNotification(data);
            }
        });
        
        socket.on('user-joined-group-call', (data) => {
            console.log('👤 Пользователь присоединился к групповому звонку:', data);
            
            // Добавить участника в список
            if (typeof addGroupParticipant === 'function') {
                addGroupParticipant(data.socketId, {
                    id: data.userId,
                    username: data.username,
                    avatar: data.avatar,
                    socketId: data.socketId,
                    isLocal: false
                });
            }
            
            // Создать peer connection
            if (inCall && currentGroupCall) {
                createPeerConnection(data.socketId, true);
            }
        });
        
        socket.on('group-call-participants', (participants) => {
            console.log('👥 Участники группового звонка:', participants);
            
            participants.forEach(participant => {
                // Добавить участника
                if (typeof addGroupParticipant === 'function') {
                    addGroupParticipant(participant.socketId, {
                        id: participant.id,
                        username: participant.username,
                        avatar: participant.avatar,
                        socketId: participant.socketId,
                        isLocal: false
                    });
                }
                
                // Создать peer connection
                if (!peerConnections[participant.socketId]) {
                    createPeerConnection(participant.socketId, false);
                }
            });
        });
        
        socket.on('group-call-update', (data) => {
            console.log('🔄 Обновление группового звонка:', data);
            if (typeof updateGroupCallParticipants === 'function') {
                updateGroupCallParticipants(data.participants);
            }
        });
        
        socket.on('user-left-group-call', (data) => {
            console.log('👋 Пользователь покинул групповой звонок:', data);
            
            // Удалить участника
            if (typeof removeGroupParticipant === 'function') {
                removeGroupParticipant(data.socketId);
            }
            
            // Закрыть peer connection
            if (peerConnections[data.socketId]) {
                peerConnections[data.socketId].close();
                delete peerConnections[data.socketId];
            }
        });
        
        socket.on('group-call-invitation', (data) => {
            console.log('📨 Приглашение в групповой звонок:', data);
            showGroupCallInvitation(data);
        });

        socket.on('offer', async (data) => {
            if (!peerConnections[data.from]) {
                createPeerConnection(data.from, false);
            }
            const pc = peerConnections[data.from];
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { to: data.from, answer: answer });
        });

        socket.on('answer', async (data) => {
            const pc = peerConnections[data.from];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        socket.on('ice-candidate', async (data) => {
            const pc = peerConnections[data.from];
            if (pc && data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });
        
        socket.on('video-toggle', (data) => {
            // Update UI when peer toggles video
            const participantDiv = document.getElementById(`participant-${data.from}`);
            if (participantDiv) {
                if (data.enabled) {
                    participantDiv.style.opacity = '1';
                } else {
                    participantDiv.style.opacity = '0.7';
                }
            }
        });
        socket.on('new-dm', (data) => {
            console.log('Received DM:', data); // Debug
            
            // Добавить отправителя в список ЛС (если его там еще нет)
            addUserToDMList(data.senderId);
            
            if (data.senderId === currentDMUserId) {
                addMessageToUI({
                    id: data.message.id,
                    userId: data.senderId,
                    author: data.message.author,
                    avatar: data.message.avatar,
                    text: data.message.text,
                    type: data.message.type || 'text',
                    audioData: data.message.audioData || null,
                    duration: data.message.duration || null,
                    videoUrl: data.message.videoUrl || null,
                    fileUrl: data.message.fileUrl || null,
                    fileName: data.message.fileName || null,
                    fileSize: data.message.fileSize || null,
                    timestamp: data.message.timestamp
                });
                scrollToBottom();
            }
        });

        socket.on('dm-sent', (data) => {
            console.log('📨 DM sent:', data);
            console.log('🔍 Message data:', data.message);
            console.log('🔍 Message type:', data.message.type);
            console.log('🔍 File URL:', data.message.fileUrl);
            console.log('🔍 Receiver ID:', data.receiverId, 'Current DM User:', currentDMUserId);
            console.log('🔍 Match:', data.receiverId === currentDMUserId);
            
            // Добавить получателя в список ЛС (если его там еще нет)
            addUserToDMList(data.receiverId);
            
            if (data.receiverId === currentDMUserId) {
                console.log('✅ Добавляем сообщение в UI');
                const messageToAdd = {
                    id: data.message.id,
                    userId: currentUser.id,
                    author: currentUser.username,
                    avatar: currentUser.avatar,
                    text: data.message.text,
                    type: data.message.type || 'text',
                    audioData: data.message.audioData || null,
                    duration: data.message.duration || null,
                    videoUrl: data.message.videoUrl || null,
                    fileUrl: data.message.fileUrl || null,
                    fileName: data.message.fileName || null,
                    fileSize: data.message.fileSize || null,
                    timestamp: data.message.timestamp
                };
                console.log('📦 Prepared message:', messageToAdd);
                addMessageToUI(messageToAdd);
                scrollToBottom();
            } else {
                console.log('❌ Не добавляем - не тот чат');
            }
        });

        socket.on('new-friend-request', (data) => {
            console.log('📨 New friend request received:', data);
            loadPendingRequests();
            showNotification('Новый запрос в друзья', 'У вас новый запрос в друзья!');
            
            // Показать уведомление через notificationManager
            if (window.notificationManager) {
                window.notificationManager.show('Новый запрос в друзья', {
                    body: 'У вас новый запрос в друзья!',
                    type: 'info'
                });
            }
        });

        socket.on('friend-request-accepted', (data) => {
            console.log('✅ Friend request accepted by:', data.acceptedBy);
            loadFriends();
            loadAllDMs();
            showNotification('Запрос принят', 'Ваш запрос в друзья был принят!');
            
            if (window.notificationManager) {
                window.notificationManager.show('Запрос принят', {
                    body: 'Ваш запрос в друзья был принят!',
                    type: 'success'
                });
            }
        });

        socket.on('friend-added', (data) => {
            console.log('👥 Friend added:', data.friendId);
            loadFriends();
            loadAllDMs();
        });

        socket.on('incoming-call', (data) => {
            const { from, type } = data;
            if (from) {
                showIncomingCall(from, type);
            }
        });

        socket.on('call-accepted', (data) => {
            console.log('Call accepted by:', data.from);
            
            // Update Discord UI with remote user info
            updateDiscordCallUI(currentUser, {
                id: data.from.id,
                username: data.from.username
            });
            
            // Create peer connection as initiator
            if (!peerConnections[data.from.socketId]) {
                createPeerConnection(data.from.socketId, true);
            }
            
            // Показать кнопку добавления участника для звонков 1-на-1
            if (typeof showAddParticipantButton === 'function') {
                showAddParticipantButton();
            }
            
            // Сохранить информацию о собеседнике
            if (typeof window !== 'undefined') {
                window.callRemoteUser = {
                    id: data.from.id,
                    username: data.from.username
                };
            }
        });

        socket.on('call-rejected', (data) => {
            alert('Call was declined');
            // Close call interface
            const callInterface = document.getElementById('callInterface');
            callInterface.classList.add('hidden');
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localStream = null;
            }
            inCall = false;
        });
        
        socket.on('call-ended', (data) => {
            // Handle when other party ends the call
            if (peerConnections[data.from]) {
                peerConnections[data.from].close();
                delete peerConnections[data.from];
            }
            const remoteVideo = document.getElementById(`remote-${data.from}`);
            if (remoteVideo) remoteVideo.remove();
            
            // If no more connections, end the call
            if (Object.keys(peerConnections).length === 0) {
                leaveVoiceChannel(true);
            }
        });
        
        // User status changed
        socket.on('user-status-changed', (data) => {
            updateUserStatusInUI(data.userId, data.status);
        });
        
        // Message edited
        socket.on('message-edited', (data) => {
            console.log('✏️ Message edited event:', data);
            const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageEl) {
                const textEl = messageEl.querySelector('.message-text');
                if (textEl) {
                    textEl.textContent = data.newText;
                    
                    // Добавить метку "изменено"
                    if (!textEl.querySelector('.message-edited')) {
                        const editedLabel = document.createElement('span');
                        editedLabel.className = 'message-edited';
                        editedLabel.textContent = ' (изменено)';
                        textEl.appendChild(editedLabel);
                    }
                }
            }
        });
        
        // Message deleted
        socket.on('message-deleted', (data) => {
            console.log('🗑️ Message deleted event:', data);
            const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageEl) {
                messageEl.remove();
            }
        });
}

function updateUserStatusInUI(userId, status) {
    console.log('Updating status for user', userId, 'to', status);
    
    // Update in friends list
    const friendItems = document.querySelectorAll(`.friend-item[data-user-id="${userId}"]`);
    friendItems.forEach(item => {
        const statusEl = item.querySelector('.friend-status');
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.className = 'friend-status';
            if (status !== 'Online') {
                statusEl.classList.add('offline');
            }
        }
    });
    
    // Update in profile modal if open
    const profileModal = document.getElementById('profileViewModal');
    if (profileModal && !profileModal.classList.contains('hidden')) {
        const profileUserId = profileModal.getAttribute('data-user-id');
        if (profileUserId == userId) {
            const profileStatus = document.getElementById('viewUserStatus');
            if (profileStatus) {
                profileStatus.textContent = status;
                profileStatus.className = 'profile-view-status';
                if (status !== 'Online') {
                    profileStatus.classList.add('offline');
                }
            }
        }
    }
    
    // Reload friends list to update online/all tabs
    if (typeof loadFriends === 'function') {
        loadFriends();
    }
}

// Initialize friends tabs
function initializeFriendsTabs() {
    const tabs = document.querySelectorAll('.friends-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchFriendsTab(tabName);
        });
    });
    
    const searchInput = document.getElementById('searchUserInput');
    
    if (searchInput) {
        // Поиск в реальном времени (как в Telegram)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchUsers();
            }, 300); // Задержка 300мс для оптимизации
        });
    }
    
    loadFriends();
}

function switchFriendsTab(tabName) {
    document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.friends-list').forEach(l => l.classList.remove('active-tab'));
    const contentMap = {
        'online': 'friendsOnline',
        'all': 'friendsAll',
        'pending': 'friendsPending',
        'add': 'friendsAdd'
    };
    
    const targetElement = document.getElementById(contentMap[tabName]);
    if (targetElement) {
        targetElement.classList.add('active-tab');
    }
    
    if (tabName === 'pending') {
        loadPendingRequests();
    }
}

async function loadFriends() {
    try {
        const response = await fetch('/api/friends', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await response.json();
        displayFriends(friends);
        populateDMList(friends);
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

function displayFriends(friends) {
    const onlineList = document.getElementById('friendsOnline');
    const allList = document.getElementById('friendsAll');
    
    onlineList.innerHTML = '';
    allList.innerHTML = '';
    
    if (friends.length === 0) {
        onlineList.innerHTML = '<div class="friends-empty">No friends yet</div>';
        allList.innerHTML = '<div class="friends-empty">No friends yet</div>';
        return;
    }
    
    const onlineFriends = friends.filter(f => f.status === 'Online');
    
    if (onlineFriends.length === 0) {
        onlineList.innerHTML = '<div class="friends-empty">No one is online</div>';
    } else {
        onlineFriends.forEach(friend => {
            onlineList.appendChild(createFriendItem(friend));
        });
    }
    
    friends.forEach(friend => {
        allList.appendChild(createFriendItem(friend));
    });
}

function createFriendItem(friend) {
    const div = document.createElement('div');
    div.className = 'friend-item';
    div.setAttribute('data-user-id', friend.id);
    
    const statusClass = friend.status === 'Online' ? '' : 'offline';
    
    div.innerHTML = `
        <div class="friend-avatar">
            ${friend.avatar || friend.username.charAt(0).toUpperCase()}
            <span class="status-indicator ${statusClass}"></span>
        </div>
        <div class="friend-info">
            <div class="friend-name">${friend.username}</div>
            <div class="friend-status ${statusClass}">${friend.status}</div>
        </div>
        <div class="friend-actions">
            <button class="friend-action-btn message" title="Написать">💬</button>
            <button class="friend-action-btn audio-call" title="Голосовой звонок">📞</button>
            <button class="friend-action-btn video-call" title="Видео звонок">📹</button>
            <button class="friend-action-btn remove" title="Удалить">🗑️</button>
        </div>
    `;

    div.querySelector('.message').addEventListener('click', () => startDM(friend.id, friend.username, friend.avatar));
    div.querySelector('.audio-call').addEventListener('click', () => initiateCall(friend.id, 'audio'));
    div.querySelector('.video-call').addEventListener('click', () => initiateCall(friend.id, 'video'));
    div.querySelector('.remove').addEventListener('click', () => removeFriend(friend.id));
    
    return div;
}

async function searchUsers() {
    const searchInput = document.getElementById('searchUserInput');
    const query = searchInput.value.trim();
    
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    if (!query) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;
        
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Server error');
        
        const users = await response.json();
        const results = users.filter(u => 
            u.username.toLowerCase().includes(query.toLowerCase()) && 
            u.id !== currentUser.id
        );
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

function displaySearchResults(users) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '';
    
    if (users.length === 0) {
        resultsDiv.innerHTML = '<div class="friends-empty">Пользователи не найдены</div>';
        return;
    }
    
    users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-search-item';
        
        // Аватар
        let avatarHTML = '';
        if (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads'))) {
            avatarHTML = `<img src="${user.avatar}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarHTML = user.avatar || user.username.charAt(0).toUpperCase();
        }
        
        // Бейджи
        let badgesHTML = '';
        if (user.badges && Array.isArray(user.badges)) {
            const badgeIcons = user.badges.map(badge => {
                if (badge === 'verified' || badge.id === 'verified') return '<span class="verified-badge" title="Официальный аккаунт">✓</span>';
                return '';
            }).join('');
            badgesHTML = badgeIcons;
        }
        
        div.innerHTML = `
            <div class="user-avatar">${avatarHTML}</div>
            <div class="user-info">
                <div class="user-name">${user.username}${badgesHTML}</div>
                <div class="user-status">${user.status || 'Offline'}</div>
            </div>
            <button class="message-btn" data-user-id="${user.id}" data-username="${user.username}" data-avatar="${user.avatar || ''}">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                Написать
            </button>
        `;
        
        // Обработчик кнопки "Написать"
        const messageBtn = div.querySelector('.message-btn');
        messageBtn.addEventListener('click', () => {
            const userId = parseInt(messageBtn.dataset.userId);
            const username = messageBtn.dataset.username;
            const avatar = messageBtn.dataset.avatar;
            
            startDM(userId, username, avatar);
        });
        
        resultsDiv.appendChild(div);
    });
}

window.sendFriendRequest = async function(friendId) {
    console.log('Отправка запроса в друзья:', friendId);
    
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            console.error('Токен не найден!');
            if (window.notificationManager) {
                window.notificationManager.show('Ошибка', {
                    body: 'Необходимо войти в аккаунт',
                    type: 'error'
                });
            } else {
                alert('Необходимо войти в аккаунт');
            }
            return;
        }
        
        const response = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId })
        });
        
        if (response.ok) {
            console.log('Запрос в друзья отправлен!');
            
            // Обновить кнопку
            const buttons = document.querySelectorAll(`.add-friend-btn[data-user-id="${friendId}"]`);
            buttons.forEach(btn => {
                btn.textContent = 'Запрос отправлен';
                btn.disabled = true;
                btn.style.backgroundColor = '#747f8d';
                btn.style.cursor = 'not-allowed';
            });
            
            if (window.notificationManager) {
                window.notificationManager.show('Успех', {
                    body: 'Запрос в друзья отправлен!',
                    type: 'success'
                });
            } else {
                alert('Friend request sent!');
            }
        } else {
            const error = await response.json();
            console.error('Ошибка:', error);
            if (window.notificationManager) {
                window.notificationManager.show('Ошибка', {
                    body: error.error || 'Не удалось отправить запрос',
                    type: 'error'
                });
            } else {
                alert(error.error || 'Failed to send request');
            }
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
        if (window.notificationManager) {
            window.notificationManager.show('Ошибка', {
                body: 'Не удалось отправить запрос в друзья',
                type: 'error'
            });
        } else {
            alert('Failed to send friend request');
        }
    }
};

async function loadPendingRequests() {
    try {
        const response = await fetch('/api/friends/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await response.json();
        
        const pendingList = document.getElementById('friendsPending');
        pendingList.innerHTML = '';
        
        if (requests.length === 0) {
            pendingList.innerHTML = '<div class="friends-empty">No pending requests</div>';
            return;
        }
        
        requests.forEach(request => {
            const div = document.createElement('div');
            div.className = 'friend-item';
            
            div.innerHTML = `
                <div class="friend-avatar">${request.avatar || request.username.charAt(0).toUpperCase()}</div>
                <div class="friend-info">
                    <div class="friend-name">${request.username}</div>
                    <div class="friend-status">Incoming Friend Request</div>
                </div>
                <div class="friend-actions">
                    <button class="friend-action-btn accept" onclick="acceptFriendRequest(${request.id})">✓</button>
                    <button class="friend-action-btn reject" onclick="rejectFriendRequest(${request.id})">✕</button>
                </div>
            `;
            
            pendingList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading pending requests:', error);
    }
}

window.acceptFriendRequest = async function(friendId) {
    try {
        console.log('✅ Accepting friend request from:', friendId);
        
        const response = await fetch('/api/friends/accept', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId })
        });
        
        if (response.ok) {
            console.log('✅ Friend request accepted successfully');
            
            // Обновить списки
            loadPendingRequests();
            loadFriends();
            loadAllDMs();
            
            // Показать уведомление
            if (window.notificationManager) {
                window.notificationManager.show('Запрос принят', {
                    body: 'Вы добавили пользователя в друзья!',
                    type: 'success'
                });
            }
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
};

window.rejectFriendRequest = async function(friendId) {
    try {
        const response = await fetch('/api/friends/reject', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendId })
        });
        
        if (response.ok) {
            loadPendingRequests();
        }
    } catch (error) {
        console.error('Error rejecting friend request:', error);
    }
};

window.removeFriend = async function(friendId) {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
        const response = await fetch(`/api/friends/${friendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadFriends();
        }
    } catch (error) {
        console.error('Error removing friend:', error);
    }
};

// Initiate call function
async function initiateCall(friendId, type) {
    try {
        // Always request both video and audio, but disable video if it's audio call
        const constraints = { video: true, audio: true };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // If audio call, disable video track initially
        if (type === 'audio') {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = false;
            });
        }
        
        // Show call interface
        const callInterface = document.getElementById('callInterface');
        callInterface.classList.remove('hidden');
        
        // Set local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Update Discord UI
        updateDiscordCallUI(currentUser, null);
        
        // Store call details
        window.currentCallDetails = {
            friendId: friendId,
            type: type,
            isInitiator: true,
            originalType: type
        };
        
        // Emit call request via socket
        if (socket && socket.connected) {
            socket.emit('initiate-call', {
                to: friendId,
                type: type,
                from: {
                    id: currentUser.id,
                    username: currentUser.username,
                    socketId: socket.id
                }
            });
        }
        
        inCall = true;
        isVideoEnabled = type === 'video';
        isAudioEnabled = true;
        updateCallButtons();
        
        // Initialize resizable functionality after a short delay
        setTimeout(() => {
            if (typeof initializeResizableVideos === 'function') {
                initializeResizableVideos();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error initiating call:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
    }
}

// Show incoming call notification (Full Screen)
function showIncomingCall(caller, type) {
    const incomingCallDiv = document.getElementById('incomingCall');
    const callerNameFullscreen = document.getElementById('callerNameFullscreen');
    const callerAvatarFullscreen = document.getElementById('callerAvatarFullscreen');
    const callerStatusFullscreen = document.getElementById('callerStatusFullscreen');
    
    if (!incomingCallDiv || !callerNameFullscreen) return;
    
    const callerName = caller.username || 'Unknown User';
    const callerAvatar = caller.avatar || caller.username?.charAt(0).toUpperCase() || 'U';
    const callType = type === 'video' ? 'Video' : 'Voice';
    
    callerNameFullscreen.textContent = callerName;
    callerStatusFullscreen.textContent = `${callType} call`;
    
    // Set avatar
    if (caller.avatar && caller.avatar.startsWith('http')) {
        callerAvatarFullscreen.innerHTML = `<img src="${caller.avatar}" alt="${callerName}"><div class="caller-avatar-pulse"></div>`;
    } else {
        callerAvatarFullscreen.innerHTML = `<span>${callerAvatar}</span><div class="caller-avatar-pulse"></div>`;
    }
    
    incomingCallDiv.classList.remove('hidden');
    
    // Request notification permission and show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${callerName} is calling you`, {
            body: `${callType} call`,
            icon: caller.avatar || undefined,
            tag: 'incoming-call',
            requireInteraction: true
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(`${callerName} is calling you`, {
                    body: `${callType} call`,
                    icon: caller.avatar || undefined,
                    tag: 'incoming-call',
                    requireInteraction: true
                });
            }
        });
    }
    
    // Set up accept/reject handlers
    const acceptBtn = document.getElementById('acceptCallBtn');
    const rejectBtn = document.getElementById('rejectCallBtn');
    
    if (acceptBtn) {
        acceptBtn.onclick = async () => {
            incomingCallDiv.classList.add('hidden');
            await acceptCall(caller, type);
        };
    }
    
    if (rejectBtn) {
        rejectBtn.onclick = () => {
            incomingCallDiv.classList.add('hidden');
            rejectCall(caller);
        };
    }
    
    // Auto-reject after 30 seconds
    setTimeout(() => {
        if (!incomingCallDiv.classList.contains('hidden')) {
            incomingCallDiv.classList.add('hidden');
            rejectCall(caller);
        }
    }, 30000);
}

// Accept incoming call
async function acceptCall(caller, type) {
    try {
        // Always request both video and audio
        const constraints = { video: true, audio: true };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // If audio call, disable video track initially
        if (type === 'audio') {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = false;
            });
        }
        
        // Show call interface
        const callInterface = document.getElementById('callInterface');
        callInterface.classList.remove('hidden');
        
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Update Discord UI with caller info
        updateDiscordCallUI(currentUser, {
            id: caller.id,
            username: caller.username
        });
        
        // Store call details
        window.currentCallDetails = {
            peerId: caller.socketId,
            type: type,
            isInitiator: false,
            originalType: type
        };
        
        if (socket && socket.connected) {
            socket.emit('accept-call', {
                to: caller.socketId,
                from: {
                    id: currentUser.id,
                    username: currentUser.username,
                    socketId: socket.id
                }
            });
        }
        
        inCall = true;
        isVideoEnabled = type === 'video';
        isAudioEnabled = true;
        updateCallButtons();
        
        // Create peer connection as receiver (not initiator)
        if (!peerConnections[caller.socketId]) {
            createPeerConnection(caller.socketId, false);
        }
        
        // Initialize resizable functionality after a short delay
        setTimeout(() => {
            if (typeof initializeResizableVideos === 'function') {
                initializeResizableVideos();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error accepting call:', error);
        alert('Failed to access camera/microphone. Please check permissions.');
    }
}

// Reject incoming call
function rejectCall(caller) {
    if (socket && socket.connected) {
        socket.emit('reject-call', { to: caller.socketId });
    }
}

window.startDM = async function(friendId, friendUsername, friendAvatar) {
    currentView = 'dm';
    currentDMUserId = friendId;
    window.currentDMUserId = friendId; // Обновить глобальную переменную
    currentServerId = null;

    document.getElementById('friendsView').style.display = 'none';
    document.getElementById('chatView').style.display = 'flex';
    document.getElementById('channelsView').style.display = 'none';
    document.getElementById('dmListView').style.display = 'block';

    const chatHeaderInfo = document.getElementById('chatHeaderInfo');
    
    let avatarHTML = '';
    if (friendAvatar && (friendAvatar.startsWith('http') || friendAvatar.startsWith('/uploads'))) {
        avatarHTML = `<div class="friend-avatar" onclick="showUserProfile(${friendId})" style="cursor: pointer;"><img src="${friendAvatar}" alt="${friendUsername}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"></div>`;
    } else {
        avatarHTML = `<div class="friend-avatar" onclick="showUserProfile(${friendId})" style="cursor: pointer;">${friendAvatar || friendUsername.charAt(0).toUpperCase()}</div>`;
    }
    
    chatHeaderInfo.innerHTML = `
        ${avatarHTML}
        <span class="channel-name">${friendUsername}</span>
    `;
    
    // Show DM call buttons
    document.getElementById('dmAudioCallBtn').style.display = 'flex';
    document.getElementById('dmVideoCallBtn').style.display = 'flex';
    document.getElementById('dmProfileBtn').style.display = 'flex';
    
    // Hide group call buttons
    document.getElementById('startGroupCallBtn').style.display = 'none';
    document.getElementById('membersBtn').style.display = 'none';
    
    document.getElementById('messageInput').placeholder = `Написать @${friendUsername}`;
    
    await loadDMHistory(friendId);
};

// Show friends view
function showFriendsView() {
    currentView = 'friends';
    currentDMUserId = null;
    window.currentDMUserId = null; // Обновить глобальную переменную
    currentServerId = null;

    document.getElementById('friendsView').style.display = 'flex';
    document.getElementById('chatView').style.display = 'none';
    document.getElementById('channelsView').style.display = 'none';
    document.getElementById('dmListView').style.display = 'block';
    document.getElementById('groupsView').style.display = 'none';
    
    document.getElementById('serverName').textContent = 'Контакты';
    
    document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
    document.getElementById('friendsBtn').classList.add('active');
    
    // Hide all call buttons
    document.getElementById('dmAudioCallBtn').style.display = 'none';
    document.getElementById('dmVideoCallBtn').style.display = 'none';
    document.getElementById('dmProfileBtn').style.display = 'none';
    document.getElementById('startGroupCallBtn').style.display = 'none';
    document.getElementById('membersBtn').style.display = 'none';
    
    // Загрузка списка ЛС
    loadAllDMs();
    
    // Загрузка друзей и ожидающих запросов
    loadFriends();
    loadPendingRequests();
    
    // Инициализация Telegram-style поиска
    if (window.initTelegramSearch) {
        setTimeout(() => window.initTelegramSearch(), 100);
    }
}

// Кеш пользователей с которыми есть переписка
let dmUsersCache = new Set();

// Функция загрузки всех ЛС
async function loadAllDMs() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Получаем список всех пользователей
        const usersResponse = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usersResponse.ok) return;
        
        const allUsers = await usersResponse.json();
        const currentUserId = currentUser.id;
        
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
                        dmUsersCache.add(user.id);
                    }
                }
            } catch (e) {
                // Игнорируем ошибки
            }
        }
        
        populateDMList(usersWithDMs);
        
        // Пометить заблокированных пользователей
        await markBlockedUsers();
    } catch (error) {
        console.error('Ошибка загрузки ЛС:', error);
    }
}

// Пометить заблокированных пользователей в UI
async function markBlockedUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/blocked', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blocked = await response.json();
            blocked.forEach(user => {
                const dmElement = document.querySelector(`[data-dm-id="${user.id}"]`);
                if (dmElement) {
                    dmElement.classList.add('blocked-user');
                }
                
                // Применить статус и скрыть медиа
                if (typeof window.hideBlockedUserMedia === 'function') {
                    window.hideBlockedUserMedia(user.id);
                }
                if (typeof window.setBlockedStatus === 'function') {
                    window.setBlockedStatus(user.id);
                }
            });
        }
    } catch (error) {
        console.error('Error marking blocked users:', error);
    }
}

// Добавить пользователя в список ЛС (если его там еще нет)
async function addUserToDMList(userId) {
    if (dmUsersCache.has(userId)) return; // Уже есть в списке
    
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const user = await response.json();
            dmUsersCache.add(userId);
            
            // Добавить в DOM
            const dmList = document.getElementById('dmList');
            if (!dmList) return;
            
            // Проверить что пользователя еще нет в списке
            const existing = dmList.querySelector(`[data-dm-id="${userId}"]`);
            if (existing) return;
            
            const dmItem = document.createElement('div');
            dmItem.className = 'channel';
            dmItem.setAttribute('data-dm-id', user.id);
            
            let avatarHTML = '';
            if (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads'))) {
                avatarHTML = `<div class="friend-avatar"><img src="${user.avatar}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"></div>`;
            } else {
                avatarHTML = `<div class="friend-avatar">${user.avatar || user.username.charAt(0).toUpperCase()}</div>`;
            }
            
            let verifiedBadge = '';
            if (user.badges && Array.isArray(user.badges)) {
                if (user.badges.includes('verified') || user.badges.includes('team')) {
                    verifiedBadge = '<span class="verified-badge" title="Официальный аккаунт">✓</span>';
                }
            }
            
            dmItem.innerHTML = `
                ${avatarHTML}
                <span>${user.username}${verifiedBadge}</span>
            `;
            dmItem.addEventListener('click', (e) => {
                // Не открывать чат если заблокирован (но ПКМ работает)
                if (dmItem.classList.contains('blocked-user')) {
                    e.preventDefault();
                    alert('Разблокируйте пользователя чтобы открыть чат (ПКМ → Разблокировать)');
                    return;
                }
                startDM(user.id, user.username, user.avatar);
            });
            
            // Добавить контекстное меню (ПКМ)
            if (typeof window.addDMContextMenu === 'function') {
                window.addDMContextMenu(dmItem, {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar
                });
            }
            
            dmList.appendChild(dmItem);
        }
    } catch (error) {
        console.error('Ошибка добавления пользователя в ЛС:', error);
    }
}

// Show server view
function showServerView(server) {
    currentView = 'server';
    currentServerId = server.id;
    currentDMUserId = null;

    document.getElementById('friendsView').style.display = 'none';
    document.getElementById('chatView').style.display = 'flex';
    document.getElementById('channelsView').style.display = 'block';
    document.getElementById('dmListView').style.display = 'none';

    document.getElementById('serverName').textContent = server.name;
    switchChannel('general');
}

async function loadUserServers() {
    try {
        const response = await fetch('/api/servers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        servers = await response.json();
        servers.forEach(server => addServerToUI(server, false));
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

function initializeServerManagement() {
    const friendsBtn = document.getElementById('friendsBtn');
    const addServerBtn = document.getElementById('addServerBtn');
    
    friendsBtn.addEventListener('click', () => {
        showFriendsView();
    });
    
    addServerBtn.addEventListener('click', () => {
        createNewServer();
    });
}

async function createNewServer() {
    const serverName = prompt('Enter server name:');
    
    if (!serverName || serverName.trim() === '') return;
    
    try {
        const response = await fetch('/api/servers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: serverName.trim() })
        });
        
        if (response.ok) {
            const server = await response.json();
            servers.push(server);
            addServerToUI(server, true);
        }
    } catch (error) {
        console.error('Error creating server:', error);
        alert('Failed to create server');
    }
}

function addServerToUI(server, switchTo = false) {
    const serverList = document.querySelector('.server-list');
    const addServerBtn = document.getElementById('addServerBtn');
    
    const serverIcon = document.createElement('div');
    serverIcon.className = 'server-icon';
    serverIcon.textContent = server.icon;
    serverIcon.title = server.name;
    serverIcon.setAttribute('data-server-id', server.id);
    
    serverIcon.addEventListener('click', () => {
        document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
        serverIcon.classList.add('active');
        showServerView(server);
    });
    
    serverList.insertBefore(serverIcon, addServerBtn);
    
    if (switchTo) {
        serverIcon.click();
    }
}

function initializeChannels() {
    const channelElements = document.querySelectorAll('.channel');
    
    channelElements.forEach(channel => {
        channel.addEventListener('click', () => {
            const channelName = channel.getAttribute('data-channel');
            const isVoiceChannel = channel.classList.contains('voice-channel');
            
            if (isVoiceChannel) {
                joinVoiceChannel(channelName);
            } else {
                switchChannel(channelName);
            }
        });
    });
}

function switchChannel(channelName) {
    currentChannel = channelName;
    
    document.querySelectorAll('.text-channel').forEach(ch => ch.classList.remove('active'));
    const channelEl = document.querySelector(`[data-channel="${channelName}"]`);
    if (channelEl) channelEl.classList.add('active');
    
    const currentChannelNameEl = document.getElementById('currentChannelName');
    if (currentChannelNameEl) currentChannelNameEl.textContent = channelName;
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.placeholder = `Message #${channelName}`;
    
    // Show group call button for channels
    const startGroupCallBtn = document.getElementById('startGroupCallBtn');
    if (startGroupCallBtn) {
        startGroupCallBtn.style.display = 'flex';
        startGroupCallBtn.onclick = () => {
            const channelId = channelName === 'general' ? 1 : 2;
            startGroupCall(channelId, channelName, 'video');
        };
    }
    
    loadChannelMessages(channelName);
}

async function loadChannelMessages(channelName) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';

    // For now, we'll use a hardcoded channel ID. This needs to be improved.
    const channelId = channelName === 'general' ? 1 : 2;

    try {
        const response = await fetch(`/api/messages/${channelId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const messages = await response.json();
            messages.forEach(message => {
                let mediaData = null;
                if (message.media_data) {
                    try {
                        mediaData = JSON.parse(message.media_data);
                    } catch (e) {}
                }
                
                addMessageToUI({
                    id: message.id,
                    userId: message.user_id,
                    author: message.username,
                    avatar: message.avatar || message.username.charAt(0).toUpperCase(),
                    badges: message.badges || [],
                    text: message.content,
                    type: message.message_type || 'text',
                    audioData: mediaData?.audioData || null,
                    duration: mediaData?.duration || null,
                    videoUrl: mediaData?.videoUrl || null,
                    timestamp: message.created_at
                });
            });
        } else {
            console.error('Failed to load messages');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }

    scrollToBottom();
}

function initializeMessageInput() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (!messageInput) {
        console.error('Message input not found!');
        return;
    }
    
    // Enter key handler
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button handler
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            sendMessage();
        });
    }
    
    console.log('Message input initialized');
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    const text = messageInput.value.trim();
    if (text === '') return;
    
    // Проверить блокировку если это ЛС
    if (currentView === 'dm' && currentDMUserId) {
        const isBlocked = await checkIfBlockedBy(currentDMUserId);
        if (isBlocked) {
            alert('❌ Этот пользователь вас заблокировал');
            return;
        }
    }
    
    // Проверить режим редактирования
    if (messageInput.dataset.editingMessageId) {
        editMessage(messageInput.dataset.editingMessageId, text);
        messageInput.value = '';
        delete messageInput.dataset.editingMessageId;
        
        const indicator = document.getElementById('editIndicator');
        if (indicator) indicator.remove();
        return;
    }

    // Детальная проверка подключения
    console.log('Socket exists:', !!socket);
    console.log('Socket connected:', socket ? socket.connected : 'no socket');
    console.log('Socket ID:', socket ? socket.id : 'no socket');
    
    if (!socket) {
        console.error('❌ Socket not initialized!');
        alert('Connection not initialized. Please refresh the page.');
        return;
    }
    
    if (!socket.connected) {
        console.error('❌ Socket not connected!');
        alert('Not connected to server. Please check if server is running and refresh the page.');
        return;
    }

    const message = {
        text: text,
        timestamp: new Date()
    };

    console.log('Current view:', currentView);
    console.log('Current DM user:', currentDMUserId);
    console.log('Current channel:', currentChannel);

    if (currentView === 'dm' && currentDMUserId) {
        console.log('Sending DM to:', currentDMUserId);
        socket.emit('send-dm', {
            receiverId: currentDMUserId,
            message: message
        });
    } else if (currentView === 'server') {
        const channelId = getChannelIdByName(currentChannel);
        console.log('Sending to channel:', channelId);
        socket.emit('send-message', {
            channelId: channelId,
            message: message
        });
    } else {
        console.error('Unknown view or no recipient!');
    }
    
    messageInput.value = '';
    console.log('Message sent, input cleared');
}

function addMessageToUI(message) {
    console.log('🎨 addMessageToUI called with:', message);
    console.log('🔍 Message type:', message.type);
    console.log('🔍 Has fileUrl:', !!message.fileUrl);
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group message';
    messageGroup.setAttribute('data-message-id', message.id || Date.now());
    messageGroup.setAttribute('data-user-id', message.userId || message.id);
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.style.cursor = 'pointer';
    avatar.title = 'Посмотреть профиль';
    
    if (message.avatar && typeof message.avatar === 'string' && message.avatar.length === 1) {
        avatar.textContent = message.avatar;
    } else if (message.avatar && (message.avatar.startsWith('http') || message.avatar.startsWith('/uploads'))) {
        avatar.innerHTML = `<img src="${message.avatar}" alt="${message.author}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        avatar.textContent = (message.author || 'U').charAt(0).toUpperCase();
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const header = document.createElement('div');
    header.className = 'message-header';
    
    const author = document.createElement('span');
    author.className = 'message-author';
    author.innerHTML = message.author || 'Unknown';
    
    // Добавляем галочку если есть verified или team badge
    if (message.badges && Array.isArray(message.badges)) {
        console.log('🔍 Message badges:', message.badges);
        const hasVerified = message.badges.some(b => 
            b === 'verified' || b.id === 'verified' || b === 'team' || b.id === 'team'
        );
        console.log('🔍 Has verified:', hasVerified);
        if (hasVerified) {
            author.innerHTML += ' <span class="verified-badge" title="Официальный аккаунт">✓</span>';
        }
    }
    
    const timestamp = document.createElement('span');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = formatTimestamp(message.timestamp);
    
    header.appendChild(author);
    header.appendChild(timestamp);
    content.appendChild(header);
    
    // Handle different message types
    if (message.type === 'voice' && message.audioData) {
        const voiceMessage = document.createElement('div');
        voiceMessage.className = 'voice-message';
        voiceMessage.onclick = () => playVoiceMessage(message.audioData);
        voiceMessage.innerHTML = `
            <button class="voice-play-btn">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            </button>
            <div class="voice-waveform"></div>
            <span class="voice-duration">${message.duration || '0:00'}</span>
        `;
        content.appendChild(voiceMessage);
    } else if (message.type === 'video-circle' && message.videoUrl) {
        const videoCircle = document.createElement('div');
        videoCircle.className = 'video-circle-message';
        videoCircle.innerHTML = `
            <video class="video-circle-thumbnail" src="${message.videoUrl}" onclick="playVideoCircle('${message.videoUrl}')"></video>
            <div class="video-circle-play-overlay">
                <svg width="40" height="40" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            </div>
        `;
        content.appendChild(videoCircle);
    } else if (message.type === 'image' && message.fileUrl) {
        // Отображение изображения
        const imageContainer = document.createElement('div');
        imageContainer.className = 'message-image-container';
        imageContainer.innerHTML = `
            <img src="${message.fileUrl}" alt="${message.text || 'Image'}" class="message-image" onclick="openImageModal('${message.fileUrl}')">
            ${message.text && message.text !== message.fileName ? `<div class="message-text">${message.text}</div>` : ''}
        `;
        content.appendChild(imageContainer);
    } else if (message.type === 'video' && message.fileUrl) {
        // Отображение видео
        const videoContainer = document.createElement('div');
        videoContainer.className = 'message-video-container';
        videoContainer.innerHTML = `
            <video src="${message.fileUrl}" controls class="message-video"></video>
            ${message.text && message.text !== message.fileName ? `<div class="message-text">${message.text}</div>` : ''}
        `;
        content.appendChild(videoContainer);
    } else if (message.type === 'file' && message.fileUrl) {
        // Отображение файла
        const fileContainer = document.createElement('div');
        fileContainer.className = 'message-file-container';
        fileContainer.innerHTML = `
            <a href="${message.fileUrl}" download="${message.fileName || 'file'}" class="message-file-link">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>
                <div class="file-info">
                    <div class="file-name">${message.fileName || 'file'}</div>
                    <div class="file-size">${formatFileSize(message.fileSize || 0)}</div>
                </div>
            </a>
        `;
        content.appendChild(fileContainer);
    } else {
        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message.text || '';
        content.appendChild(text);
    }
    
    const reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'message-reactions';
    
    const addReactionBtn = document.createElement('button');
    addReactionBtn.className = 'add-reaction-btn';
    addReactionBtn.textContent = '😊';
    addReactionBtn.title = 'Add reaction';
    addReactionBtn.onclick = () => showEmojiPickerForMessage(message.id || Date.now());
    
    content.appendChild(reactionsContainer);
    content.appendChild(addReactionBtn);
    
    // Добавить кнопку меню (3 точки) - показывается при наведении
    if (typeof window.addMessageMenu === 'function') {
        const menuBtn = window.addMessageMenu(messageGroup, {
            id: message.id || Date.now(),
            userId: message.userId,
            text: message.text,
            type: message.type
        });
        content.appendChild(menuBtn);
    }
    
    // Добавить обработчик правой кнопки мыши
    messageGroup.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (typeof window.showMessageContextMenu === 'function') {
            window.showMessageContextMenu(e, {
                id: message.id || Date.now(),
                userId: message.userId,
                text: message.text,
                type: message.type
            });
        }
    });
    
    messageGroup.appendChild(avatar);
    messageGroup.appendChild(content);
    
    messagesContainer.appendChild(messageGroup);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-overlay"></div>
        <div class="image-modal-content">
            <button class="image-modal-close">✕</button>
            <img src="${imageUrl}" alt="Image">
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.image-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.image-modal-overlay').addEventListener('click', () => modal.remove());
}

function formatTimestamp(date) {
    const messageDate = new Date(date);
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    return `Today at ${hours}:${minutes}`;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Emoji picker
function initializeEmojiPicker() {
    const emojiBtn = document.querySelector('.emoji-btn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            showEmojiPickerForInput();
        });
    }
}

function showEmojiPickerForInput() {
    const emojis = ['😀', '😂', '❤️', '👍', '👎', '🎉', '🔥', '✨', '💯', '🚀'];
    const picker = createEmojiPicker(emojis, (emoji) => {
        const input = document.getElementById('messageInput');
        input.value += emoji;
        input.focus();
    });
    document.body.appendChild(picker);
}

function showEmojiPickerForMessage(messageId) {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];
    const picker = createEmojiPicker(emojis, (emoji) => {
        addReaction(messageId, emoji);
    });
    document.body.appendChild(picker);
}

function createEmojiPicker(emojis, onSelect) {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    
    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
            onSelect(emoji);
            picker.remove();
        });
        picker.appendChild(btn);
    });
    
    setTimeout(() => {
        document.addEventListener('click', function closePickerAnywhere(e) {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', closePickerAnywhere);
            }
        });
    }, 100);
    
    return picker;
}

function addReaction(messageId, emoji) {
    if (socket && socket.connected) {
        socket.emit('add-reaction', { messageId, emoji });
    }
}

function updateMessageReactions(messageId, reactions) {
    const reactionsContainer = document.querySelector(`[data-message-id="${messageId}"] .message-reactions`);
    if (!reactionsContainer) return;
    
    reactionsContainer.innerHTML = '';
    
    reactions.forEach(reaction => {
        const reactionEl = document.createElement('div');
        reactionEl.className = 'reaction';
        reactionEl.innerHTML = `${reaction.emoji} <span>${reaction.count}</span>`;
        reactionEl.title = reaction.users;
        reactionEl.addEventListener('click', () => {
            if (socket && socket.connected) {
                socket.emit('remove-reaction', { messageId, emoji: reaction.emoji });
            }
        });
        reactionsContainer.appendChild(reactionEl);
    });
}

// File upload
function initializeFileUpload() {
    const attachBtn = document.querySelector('.attach-btn');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await uploadFile(file);
        }
        fileInput.value = '';
    });
}

async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('channelId', currentChannel);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const fileData = await response.json();
        
        const message = {
            author: currentUser.username,
            avatar: currentUser.avatar,
            text: `Uploaded ${file.name}`,
            file: fileData,
            timestamp: new Date()
        };
        
        if (socket && socket.connected) {
            socket.emit('send-message', {
                channel: currentChannel,
                message: message
            });
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload file');
    }
}

// User controls
function initializeUserControls() {
    const muteBtn = document.getElementById('muteBtn');
    const deafenBtn = document.getElementById('deafenBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.querySelector('.icon-normal').style.display = isMuted ? 'none' : 'block';
        muteBtn.querySelector('.icon-slashed').style.display = isMuted ? 'block' : 'none';
        
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    });
    
    deafenBtn.addEventListener('click', () => {
        isDeafened = !isDeafened;
        deafenBtn.querySelector('.icon-normal').style.display = isDeafened ? 'none' : 'block';
        deafenBtn.querySelector('.icon-slashed').style.display = isDeafened ? 'block' : 'none';
        
        // When deafened, also mute microphone
        if (isDeafened) {
            if (!isMuted) {
                isMuted = true;
                muteBtn.querySelector('.icon-normal').style.display = 'none';
                muteBtn.querySelector('.icon-slashed').style.display = 'block';
            }
            
            // Mute all remote audio
            document.querySelectorAll('video[id^="remote-"]').forEach(video => {
                video.volume = 0;
            });
        } else {
            // Unmute remote audio
            document.querySelectorAll('video[id^="remote-"]').forEach(video => {
                video.volume = 1;
            });
        }

        // Update local stream audio tracks
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    });
    
    settingsBtn.addEventListener('click', () => {
        if (confirm('Do you want to logout?')) {
            if (inCall) leaveVoiceChannel();
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            if (socket) socket.disconnect();
            window.location.replace('login.html');
        }
    });
}

// Voice channel functions - call persists when switching views
async function joinVoiceChannel(channelName) {
    console.log('📞 joinVoiceChannel вызван, inCall:', inCall);
    
    if (inCall) {
        console.log('⚠️ Уже в звонке, не показываем UI снова');
        // НЕ показываем UI если уже в звонке - это может быть после завершения
        return;
    }
    
    inCall = true;
    
    document.querySelectorAll('.voice-channel').forEach(ch => ch.classList.remove('in-call'));
    const channelEl = document.querySelector(`[data-channel="${channelName}"]`);
    if (channelEl) channelEl.classList.add('in-call');
    
    const callInterface = document.getElementById('callInterface');
    callInterface.classList.remove('hidden');
    callInterface.style.display = 'flex'; // Показать
    
    document.querySelector('.call-channel-name').textContent = channelName;
    
    try {
        await initializeMedia();
        
        // Connect to the socket for voice
        if (socket && socket.connected) {
            socket.emit('join-voice-channel', { channelName, userId: currentUser.id });
        }

    } catch (error) {
        console.error('Error initializing media:', error);
        alert('Error accessing camera/microphone. Please grant permissions.');
        leaveVoiceChannel(true); // Force leave
    }
}

async function initializeMedia() {
    try {
        // Better audio constraints for clear voice
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
                sampleSize: 16,
                channelCount: 1
            }
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Log audio track status
        const audioTracks = localStream.getAudioTracks();
        console.log('Local audio tracks:', audioTracks.length);
        audioTracks.forEach(track => {
            console.log(`Audio track: ${track.label}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
        });
        
        if (isMuted || isDeafened) {
            audioTracks.forEach(track => {
                track.enabled = false;
            });
        }
    } catch (error) {
        console.error('Error getting media devices:', error);
        throw error;
    }
}

function leaveVoiceChannel(force = false) {
    if (!inCall) return;

    if (force) {
        inCall = false;

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        
        if (socket && socket.connected) {
            socket.emit('leave-voice-channel', currentChannel);
        }

        Object.values(peerConnections).forEach(pc => pc.close());
        peerConnections = {};

        document.querySelectorAll('.voice-channel').forEach(ch => ch.classList.remove('in-call'));
        document.getElementById('remoteParticipants').innerHTML = '';
    }

    const callInterface = document.getElementById('callInterface');
    const callBubble = document.getElementById('callBubble');
    
    if (callInterface) {
        callInterface.classList.add('hidden');
    }
    
    // Также скрыть баббл если он открыт
    if (callBubble) {
        callBubble.classList.add('hidden');
    }

    if (force) {
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        
        if (localVideo) {
            localVideo.srcObject = null;
        }
        if (remoteVideo) {
            remoteVideo.srcObject = null;
        }
        
        isVideoEnabled = true;
        isAudioEnabled = true;
        updateCallButtons();
    }
}

function initializeCallControls() {
    const closeCallBtn = document.getElementById('closeCallBtn');
    const leaveCallBtn = document.getElementById('leaveCallBtn');
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    
    const endCallHandler = () => {
        // End call for both voice channels and direct calls
        if (window.currentCallDetails) {
            // End a direct call
            Object.keys(peerConnections).forEach(socketId => {
                if (socket && socket.connected) {
                    socket.emit('end-call', { to: socketId });
                }
            });
        }
        leaveVoiceChannel(true); // Force leave on button click
    };
    
    if (closeCallBtn) {
        closeCallBtn.addEventListener('click', endCallHandler);
    }
    
    if (leaveCallBtn) {
        leaveCallBtn.addEventListener('click', endCallHandler);
    }
    
    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', () => {
            toggleVideo();
        });
    }
    
    if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener('click', () => {
            toggleAudio();
        });
    }
    
    if (toggleScreenBtn) {
        toggleScreenBtn.addEventListener('click', () => {
            toggleScreenShare();
        });
    }
}

function toggleVideo() {
    if (!localStream) return;
    
    isVideoEnabled = !isVideoEnabled;
    localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
    });
    
    // Notify peer about video state change
    Object.keys(peerConnections).forEach(socketId => {
        if (socket && socket.connected) {
            socket.emit('video-toggle', {
                to: socketId,
                enabled: isVideoEnabled
            });
        }
    });
    
    updateCallButtons();
}

function toggleAudio() {
    if (!localStream) return;
    
    isAudioEnabled = !isAudioEnabled;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
    });
    
    if (!isAudioEnabled) {
        isMuted = true;
        document.getElementById('muteBtn').classList.add('active');
    } else {
        isMuted = false;
        document.getElementById('muteBtn').classList.remove('active');
    }
    
    updateCallButtons();
}

async function toggleScreenShare() {
    if (screenStream) {
        // Stop screen sharing
        screenStream.getTracks().forEach(track => track.stop());
        
        // Replace screen track with camera track in all peer connections
        const videoTrack = localStream.getVideoTracks()[0];
        Object.values(peerConnections).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender && videoTrack) {
                sender.replaceTrack(videoTrack);
            }
        });
        
        screenStream = null;
        
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Выйти из полноэкранного режима
        if (typeof window.exitFullscreenCall === 'function') {
            window.exitFullscreenCall();
        }
        
        updateCallButtons();
    } else {
        try {
            // Start screen sharing
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            const screenTrack = screenStream.getVideoTracks()[0];
            
            // Replace video track in all peer connections
            Object.values(peerConnections).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });
            
            // Show screen share in local video
            const localVideo = document.getElementById('localVideo');
            const mixedStream = new MediaStream([
                screenTrack,
                ...localStream.getAudioTracks()
            ]);
            localVideo.srcObject = mixedStream;
            
            // Войти в полноэкранный режим
            if (typeof window.enterFullscreenCall === 'function') {
                window.enterFullscreenCall(mixedStream, 'screen');
            }
            
            // Handle screen share ending
            screenTrack.addEventListener('ended', () => {
                toggleScreenShare(); // This will stop screen sharing
            });
            
            updateCallButtons();
        } catch (error) {
            console.error('Error sharing screen:', error);
            if (error.name === 'NotAllowedError') {
                alert('Screen sharing permission denied');
            } else {
                alert('Error sharing screen. Please try again.');
            }
        }
    }
}

function updateCallButtons() {
    const toggleVideoBtn = document.getElementById('toggleVideoBtn');
    const toggleAudioBtn = document.getElementById('toggleAudioBtn');
    const toggleScreenBtn = document.getElementById('toggleScreenBtn');
    
    if (toggleVideoBtn) {
        toggleVideoBtn.classList.toggle('active', !isVideoEnabled);
        toggleVideoBtn.classList.toggle('muted', !isVideoEnabled);
    }
    
    if (toggleAudioBtn) {
        toggleAudioBtn.classList.toggle('active', !isAudioEnabled);
        toggleAudioBtn.classList.toggle('muted', !isAudioEnabled);
    }
    
    if (toggleScreenBtn) {
        toggleScreenBtn.classList.toggle('active', screenStream !== null);
    }
    
    // Update Discord-style status icons
    updateCallStatusIcons();
    updateVideoOverlays();
}

function initializeDraggableCallWindow() {
   const callInterface = document.getElementById('callInterface');
   
   // Проверка существования элемента
   if (!callInterface) {
       console.warn('⚠️ callInterface element not found, skipping draggable initialization');
       return;
   }
   
   const callHeader = callInterface.querySelector('.call-header');
   
   if (!callHeader) {
       console.warn('⚠️ call-header element not found, skipping draggable initialization');
       return;
   }
   
   let isDragging = false;
   let offsetX, offsetY;

   callHeader.addEventListener('mousedown', (e) => {
       isDragging = true;
       offsetX = e.clientX - callInterface.offsetLeft;
       offsetY = e.clientY - callInterface.offsetTop;
       callInterface.style.transition = 'none'; // Disable transition during drag
   });

   document.addEventListener('mousemove', (e) => {
       if (isDragging) {
           let newX = e.clientX - offsetX;
           let newY = e.clientY - offsetY;

           // Constrain within viewport
           const maxX = window.innerWidth - callInterface.offsetWidth;
           const maxY = window.innerHeight - callInterface.offsetHeight;

           newX = Math.max(0, Math.min(newX, maxX));
           newY = Math.max(0, Math.min(newY, maxY));

           callInterface.style.left = `${newX}px`;
           callInterface.style.top = `${newY}px`;
       }
   });

   document.addEventListener('mouseup', () => {
       if (isDragging) {
           isDragging = false;
           callInterface.style.transition = 'all 0.3s ease'; // Re-enable transition
       }
   });
}

function getChannelIdByName(name) {
   // This is a temporary solution. A better approach would be to have a proper mapping.
   return name === 'general' ? 1 : 2;
}

function getChannelNameById(id) {
   // This is a temporary solution. A better approach would be to have a proper mapping.
   return id === 1 ? 'general' : 'random';
}

async function loadDMHistory(userId) {
   const messagesContainer = document.getElementById('messagesContainer');
   messagesContainer.innerHTML = '';

   try {
       const response = await fetch(`/api/dm/${userId}`, {
           headers: { 'Authorization': `Bearer ${token}` }
       });
       if (response.ok) {
           const messages = await response.json();
           messages.forEach(message => {
               let mediaData = null;
               if (message.media_data) {
                   try {
                       mediaData = JSON.parse(message.media_data);
                   } catch (e) {}
               }
               
               addMessageToUI({
                   id: message.id,
                   userId: message.sender_id,
                   author: message.username,
                   avatar: message.avatar || message.username.charAt(0).toUpperCase(),
                   badges: message.badges || [],
                   text: message.content,
                   type: message.message_type || 'text',
                   audioData: mediaData?.audioData || null,
                   duration: mediaData?.duration || null,
                   videoUrl: mediaData?.videoUrl || null,
                   fileUrl: mediaData?.fileUrl || null,
                   fileName: mediaData?.fileName || null,
                   fileSize: mediaData?.fileSize || null,
                   timestamp: message.created_at
               });
           });
       } else {
           console.error('Failed to load DM history');
       }
   } catch (error) {
       console.error('Error loading DM history:', error);
   }

   scrollToBottom();
}

// Проверка блокировки
async function checkIfBlockedBy(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/check-blocked/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.isBlocked;
        }
        return false;
    } catch (error) {
        console.error('Error checking block status:', error);
        return false;
    }
}

console.log('Discord Clone initialized successfully!');
if (currentUser) {
   console.log('Logged in as:', currentUser.username);
}

function populateDMList(friends) {
   const dmList = document.getElementById('dmList');
   dmList.innerHTML = '';

   if (friends.length === 0) {
       const emptyDM = document.createElement('div');
       emptyDM.className = 'empty-dm-list';
       emptyDM.textContent = 'Нет бесед';
       dmList.appendChild(emptyDM);
       return;
   }

   friends.forEach(friend => {
       const dmItem = document.createElement('div');
       dmItem.className = 'channel';
       dmItem.setAttribute('data-dm-id', friend.id);
       
       let avatarHTML = '';
       if (friend.avatar && (friend.avatar.startsWith('http') || friend.avatar.startsWith('/uploads'))) {
           avatarHTML = `<div class="friend-avatar"><img src="${friend.avatar}" alt="${friend.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"></div>`;
       } else {
           avatarHTML = `<div class="friend-avatar">${friend.avatar || friend.username.charAt(0).toUpperCase()}</div>`;
       }
       
       // Добавляем галочку если есть verified или team badge
       let verifiedBadge = '';
       if (friend.badges && Array.isArray(friend.badges)) {
           if (friend.badges.includes('verified') || friend.badges.includes('team')) {
               verifiedBadge = '<span class="verified-badge" title="Официальный аккаунт">✓</span>';
           }
       }
       
       dmItem.innerHTML = `
           ${avatarHTML}
           <span>${friend.username}${verifiedBadge}</span>
       `;
       dmItem.addEventListener('click', (e) => {
           // Не открывать чат если заблокирован (но ПКМ работает)
           if (dmItem.classList.contains('blocked-user')) {
               e.preventDefault();
               alert('Разблокируйте пользователя чтобы открыть чат (ПКМ → Разблокировать)');
               return;
           }
           startDM(friend.id, friend.username, friend.avatar);
       });
       
       // Добавить контекстное меню (ПКМ)
       if (typeof window.addDMContextMenu === 'function') {
           window.addDMContextMenu(dmItem, {
               id: friend.id,
               username: friend.username,
               avatar: friend.avatar
           });
       }
       
       dmList.appendChild(dmItem);
   });
}

// WebRTC Functions
function createPeerConnection(remoteSocketId, isInitiator) {
    console.log(`Creating peer connection with ${remoteSocketId}, initiator: ${isInitiator}`);
    
    if (peerConnections[remoteSocketId]) {
        console.log('Peer connection already exists');
        return peerConnections[remoteSocketId];
    }
    
    const pc = new RTCPeerConnection({
        iceServers: [
            // STUN серверы для определения публичного IP
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            
            // Бесплатные публичные TURN серверы #1 (openrelay)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            
            // Бесплатные публичные TURN серверы #2 (numb.viagenie.ca)
            {
                urls: 'turn:numb.viagenie.ca',
                username: 'webrtc@live.com',
                credential: 'muazkh'
            },
            
            // Бесплатные публичные TURN серверы #3 (stunserver.org)
            {
                urls: 'turn:turn.stunserver.org:3478',
                username: 'free',
                credential: 'free'
            },
            
            // Бесплатные публичные TURN серверы #4 (relay1.expressturn.com)
            {
                urls: 'turn:relay1.expressturn.com:3478',
                username: 'efKFNWZKE6Y8B24DYU',
                credential: 'RoadTo100Subs'
            }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all', // Использовать все доступные методы
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    });

    peerConnections[remoteSocketId] = pc;

    // Add local stream tracks with better error handling
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        const videoTracks = localStream.getVideoTracks();
        
        console.log(`Adding tracks - Audio: ${audioTracks.length}, Video: ${videoTracks.length}`);
        
        // Add audio tracks first (priority for voice calls)
        audioTracks.forEach(track => {
            console.log(`Adding audio track: ${track.label}, enabled: ${track.enabled}`);
            pc.addTrack(track, localStream);
        });
        
        // Then add video tracks
        videoTracks.forEach(track => {
            console.log(`Adding video track: ${track.label}, enabled: ${track.enabled}`);
            pc.addTrack(track, localStream);
        });
    } else {
        console.error('No local stream available');
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('📡 Sending ICE candidate:', event.candidate.type, event.candidate.protocol);
            console.log('   Address:', event.candidate.address || 'relay');
            socket.emit('ice-candidate', {
                to: remoteSocketId,
                candidate: event.candidate
            });
        } else {
            console.log('✅ All ICE candidates sent');
        }
    };
    
    // Handle connection state changes
    pc.oniceconnectionstatechange = () => {
        console.log(`🔌 ICE connection state: ${pc.iceConnectionState}`);
        
        if (pc.iceConnectionState === 'checking') {
            console.log('🔍 Checking ICE candidates...');
        }
        
        if (pc.iceConnectionState === 'connected') {
            console.log('✅ Peer connection established successfully!');
            console.log('   Using:', pc.connectionState);
        }
        
        if (pc.iceConnectionState === 'failed') {
            console.error('❌ ICE connection failed - trying to restart...');
            console.log('💡 Возможные причины:');
            console.log('   - TURN серверы недоступны');
            console.log('   - Firewall блокирует соединение');
            console.log('   - Мобильный оператор блокирует WebRTC');
            
            // Try to restart ICE
            pc.restartIce();
        }
        
        if (pc.iceConnectionState === 'disconnected') {
            console.warn('⚠️ ICE connection disconnected');
        }
    };
    
    // Логирование ICE gathering state
    pc.onicegatheringstatechange = () => {
        console.log(`📊 ICE gathering state: ${pc.iceGatheringState}`);
    };

    // Handle incoming remote stream
    pc.ontrack = (event) => {
        console.log('🎬 Received remote track:', event.track.kind, 'Stream ID:', event.streams[0]?.id);
        console.log('🎬 Track state:', event.track.readyState, 'enabled:', event.track.enabled);
        console.log('🎬 From socketId:', remoteSocketId);
        
        if (!event.streams || !event.streams[0]) {
            console.error('❌ No stream in track event');
            return;
        }
        
        const stream = event.streams[0];
        console.log('📹 Stream tracks:', stream.getTracks().map(t => `${t.kind}: ${t.readyState}`));
        
        // Проверить это групповой звонок или обычный
        if (currentGroupCall && typeof handleGroupParticipantStream === 'function') {
            // Групповой звонок - передать в модуль групповых звонков
            console.log('👥 Групповой звонок - обрабатываем поток участника');
            handleGroupParticipantStream(remoteSocketId, stream);
        } else {
            // Обычный звонок 1-на-1 - использовать remoteVideo
            console.log('👤 Обычный звонок - используем remoteVideo');
            
            let remoteVideo = document.getElementById('remoteVideo');
            
            if (!remoteVideo) {
                console.error('❌ Remote video element not found!');
                return;
            }
            
            remoteVideo.srcObject = stream;
            
            // Show remote participant card
            const remoteCard = document.getElementById('remoteParticipantCard');
            if (remoteCard) {
                remoteCard.style.display = 'block';
            }
            
            // Update video overlays when video loads
            remoteVideo.onloadedmetadata = () => {
                console.log('✅ Remote video metadata loaded');
                console.log('📺 Video dimensions:', remoteVideo.videoWidth, 'x', remoteVideo.videoHeight);
                updateVideoOverlays();
                
                // Если это демонстрация экрана (большое разрешение), автоматически открыть полноэкранный режим
                if (event.track.kind === 'video' && remoteVideo.videoWidth > 1280) {
                    console.log('🖥️ Detected screen share, auto-opening fullscreen');
                    setTimeout(() => {
                        if (typeof window.enterFullscreenCall === 'function') {
                            window.enterFullscreenCall(stream, 'screen');
                        }
                    }, 500);
                }
            };
            
            // Ensure audio is playing
            remoteVideo.play().catch(e => {
                console.error('❌ Error playing remote video:', e);
                document.addEventListener('click', () => {
                    remoteVideo.play().catch(err => console.error('Still cannot play:', err));
                }, { once: true });
            });
        }
        
        // Логировать когда треки становятся активными (для всех типов звонков)
        stream.getTracks().forEach(track => {
            track.onended = () => {
                console.log(`⚠️ Track ${track.kind} ended from ${remoteSocketId}`);
                if (track.kind === 'video' && document.getElementById('fullscreenCallContainer')) {
                    if (typeof window.exitFullscreenCall === 'function') {
                        window.exitFullscreenCall();
                    }
                }
            };
            track.onmute = () => console.log(`🔇 Track ${track.kind} muted from ${remoteSocketId}`);
            track.onunmute = () => console.log(`🔊 Track ${track.kind} unmuted from ${remoteSocketId}`);
        });
    };

    // Create offer if initiator with modern constraints
    if (isInitiator) {
        pc.createOffer()
        .then(offer => {
            console.log('Created offer with SDP:', offer.sdp.substring(0, 200));
            return pc.setLocalDescription(offer);
        })
        .then(() => {
            console.log('Sending offer to:', remoteSocketId);
            socket.emit('offer', {
                to: remoteSocketId,
                offer: pc.localDescription
            });
        })
        .catch(error => {
            console.error('Error creating offer:', error);
        });
    }
    
    return pc;
}

// ============================================
// NEW FEATURES: Profile, Settings, Gifts
// ============================================

// Profile Management
function initializeProfile() {
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const profileCloseBtn = document.getElementById('profileCloseBtn');
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const avatarUpload = document.getElementById('avatarUpload');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            openProfileModal();
        });
    }
    
    if (profileCloseBtn) {
        profileCloseBtn.addEventListener('click', () => {
            profileModal.classList.add('hidden');
        });
    }
    
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', () => {
            saveProfile();
        });
    }
    
    if (profileAvatarLarge && avatarUpload) {
        profileAvatarLarge.addEventListener('click', () => {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                uploadAvatar(e.target.files[0]);
            }
        });
    }
}

function openProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.classList.remove('hidden');
        loadProfileData();
    }
}

function loadProfileData() {
    if (!currentUser) return;
    
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    
    if (profileUsername) profileUsername.value = currentUser.username || '';
    if (profileEmail) profileEmail.value = currentUser.email || '';
    if (profileBio) profileBio.value = currentUser.bio || '';
    
    if (profileAvatarLarge && currentUser.avatar) {
        if (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('/uploads')) {
            profileAvatarLarge.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar"><div class="avatar-upload-overlay">Нажмите для загрузки</div>`;
        } else {
            profileAvatarLarge.innerHTML = `${currentUser.avatar}<div class="avatar-upload-overlay">Нажмите для загрузки</div>`;
        }
    }
}

async function saveProfile() {
    const profileUsername = document.getElementById('profileUsername');
    const profileBio = document.getElementById('profileBio');
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: profileUsername.value,
                bio: profileBio.value
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(data));
            updateUserInfo();
            alert('Профиль сохранен!');
        }
    } catch (error) {
        console.error('Save profile error:', error);
    }
}

async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            if (currentUser) {
                currentUser.avatar = data.avatar;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            loadProfileData();
            updateUserInfo();
        }
    } catch (error) {
        console.error('Upload avatar error:', error);
    }
}

// Settings Management
function initializeSettings() {
    // Settings code here
}

// Gifts Management
function initializeGifts() {
    // Gifts code here
}

// Voice Messages
function initializeVoiceMessages() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (!voiceBtn) return;
    
    voiceBtn.addEventListener('click', () => {
        // Voice message code
    });
}

// Initialize new features when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeProfile();
        initializeSettings();
        initializeGifts();
        initializeVoiceMessages();
        initializeVideoCircles();
    });
} else {
    initializeProfile();
    initializeSettings();
    initializeGifts();
    initializeVoiceMessages();
    initializeVideoCircles();
}

            // Add resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.innerHTML = '↘';
            resizeHandle.style.cssText = `
                position: absolute;
                bottom: 5px;
                right: 5px;
                width: 20px;
                height: 20px;
                background: rgba(255,255,255,0.3);
                cursor: nwse-resize;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 3px;
                font-size: 12px;
                color: white;
                user-select: none;
            `;
            

    function makeResizable(element) {
    if (!element || element.hasAttribute('data-resizable')) return;

            // Add video size controls
            const sizeControls = document.createElement('div');
            sizeControls.className = 'video-size-controls';
            sizeControls.innerHTML = `
                <button class="size-control-btn minimize-btn" title="Minimize">_</button>
                <button class="size-control-btn maximize-btn" title="Maximize">□</button>
                <button class="size-control-btn fullscreen-btn" title="Fullscreen">⛶</button>
            `;
            
            if (!element.querySelector('.resize-handle')) {
                element.appendChild(resizeHandle);
                element.appendChild(sizeControls);
                element.style.resize = 'both';
                element.style.overflow = 'auto';
                element.style.minWidth = '150px';
                element.style.minHeight = '100px';
                element.style.maxWidth = '90vw';
                element.style.maxHeight = '90vh';
                element.setAttribute('data-resizable', 'true');
                
                // Add double-click for fullscreen
                element.addEventListener('dblclick', function(e) {
                    if (!e.target.closest('.video-size-controls')) {
                        toggleVideoFullscreen(element);
                    }
                });
                
                // Size control buttons
                const minimizeBtn = sizeControls.querySelector('.minimize-btn');
                const maximizeBtn = sizeControls.querySelector('.maximize-btn');
                const fullscreenBtn = sizeControls.querySelector('.fullscreen-btn');
                
                minimizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    element.classList.toggle('minimized');
                    element.classList.remove('maximized');
                });
                
                maximizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    element.classList.toggle('maximized');
                    element.classList.remove('minimized');
                });
                
                fullscreenBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const video = element.querySelector('video');
                    if (video && video.requestFullscreen) {
                        video.requestFullscreen();
                    }
                });
            }
        }
        
        // Toggle video fullscreen
        function toggleVideoFullscreen(element) {
            element.classList.toggle('maximized');
            if (element.classList.contains('maximized')) {
                element.classList.remove('minimized');
            }
        }
        
        // Make call interface resizable
        function makeInterfaceResizable(callInterface) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'interface-resize-handle';
            resizeHandle.style.cssText = `
                position: absolute;
                bottom: 0;
                right: 0;
                width: 15px;
                height: 15px;
                cursor: nwse-resize;
                background: linear-gradient(135deg, transparent 50%, #5865f2 50%);
                border-bottom-right-radius: 12px;
            `;
            
            if (!callInterface.querySelector('.interface-resize-handle')) {
                callInterface.appendChild(resizeHandle);
                
                let isResizing = false;
                let startWidth = 0;
                let startHeight = 0;
                let startX = 0;
                let startY = 0;
                
                resizeHandle.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    startWidth = parseInt(document.defaultView.getComputedStyle(callInterface).width, 10);
                    startHeight = parseInt(document.defaultView.getComputedStyle(callInterface).height, 10);
                    startX = e.clientX;
                    startY = e.clientY;
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isResizing) return;
                    
                    const newWidth = startWidth + e.clientX - startX;
                    const newHeight = startHeight + e.clientY - startY;
                    
                    if (newWidth > 300 && newWidth < window.innerWidth * 0.9) {
                        callInterface.style.width = newWidth + 'px';
                    }
                    if (newHeight > 200 && newHeight < window.innerHeight * 0.9) {
                        callInterface.style.height = newHeight + 'px';
                    }
                });
                
                document.addEventListener('mouseup', () => {
                    isResizing = false;
                });
            }
        }
        
    
        

// Initialize resizable videos
function initializeResizableVideos() {
    const callInterface = document.getElementById('callInterface');
    if (!callInterface) return;
    
    const participants = callInterface.querySelectorAll('.participant');
    participants.forEach(participant => {
        makeResizable(participant);
    });
    
    // Make call interface resizable too
    makeInterfaceResizable(callInterface);
}

// Make individual video resizable
function makeResizable(element) {
    if (!element || element.hasAttribute('data-resizable')) return;
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.innerHTML = '↘';
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 20px;
        height: 20px;
        background: rgba(255,255,255,0.3);
        cursor: nwse-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        font-size: 12px;
        color: white;
        user-select: none;
        z-index: 10;
    `;
    
    // Add video size controls
    const sizeControls = document.createElement('div');
    sizeControls.className = 'video-size-controls';
    sizeControls.innerHTML = `
        <button class="size-control-btn minimize-btn" title="Minimize">_</button>
        <button class="size-control-btn maximize-btn" title="Maximize">□</button>
        <button class="size-control-btn fullscreen-btn" title="Fullscreen">⛶</button>
    `;
    sizeControls.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
    `;
    
    element.appendChild(resizeHandle);
    element.appendChild(sizeControls);
    element.style.resize = 'both';
    element.style.overflow = 'auto';
    element.style.minWidth = '150px';
    element.style.minHeight = '100px';
    element.style.maxWidth = '90vw';
    element.style.maxHeight = '90vh';
    element.setAttribute('data-resizable', 'true');
    
    // Show controls on hover
    element.addEventListener('mouseenter', () => {
        sizeControls.style.opacity = '1';
    });
    
    element.addEventListener('mouseleave', () => {
        sizeControls.style.opacity = '0';
    });
    
    // Add double-click for fullscreen
    element.addEventListener('dblclick', function(e) {
        if (!e.target.closest('.video-size-controls')) {
            toggleVideoFullscreen(element);
        }
    });
    
    // Size control buttons
    const minimizeBtn = sizeControls.querySelector('.minimize-btn');
    const maximizeBtn = sizeControls.querySelector('.maximize-btn');
    const fullscreenBtn = sizeControls.querySelector('.fullscreen-btn');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            element.classList.toggle('minimized');
            element.classList.remove('maximized');
        });
    }
    
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            element.classList.toggle('maximized');
            element.classList.remove('minimized');
        });
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const video = element.querySelector('video');
            if (video && video.requestFullscreen) {
                video.requestFullscreen();
            }
        });
    }
}

// Toggle video fullscreen
function toggleVideoFullscreen(element) {
    element.classList.toggle('maximized');
    if (element.classList.contains('maximized')) {
        element.classList.remove('minimized');
    }
}

// Make interface resizable
function makeInterfaceResizable(callInterface) {
    if (!callInterface || callInterface.hasAttribute('data-interface-resizable')) return;
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'interface-resize-handle';
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 15px;
        height: 15px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 50%, #5865f2 50%);
        border-bottom-right-radius: 12px;
    `;
    
    callInterface.appendChild(resizeHandle);
    callInterface.setAttribute('data-interface-resizable', 'true');
    
    let isResizing = false;
    let startWidth = 0;
    let startHeight = 0;
    let startX = 0;
    let startY = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startWidth = parseInt(document.defaultView.getComputedStyle(callInterface).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(callInterface).height, 10);
        startX = e.clientX;
        startY = e.clientY;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const newWidth = startWidth + e.clientX - startX;
        const newHeight = startHeight + e.clientY - startY;
        
        if (newWidth > 400 && newWidth < window.innerWidth * 0.9) {
            callInterface.style.width = newWidth + 'px';
        }
        if (newHeight > 300 && newHeight < window.innerHeight * 0.9) {
            callInterface.style.height = newHeight + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        isResizing = false;
    });
}

// ============================================
// NEW FEATURES: Profile, Settings, Gifts
// ============================================

// Profile Management
function initializeProfile() {
    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const profileCloseBtn = document.getElementById('profileCloseBtn');
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const avatarUpload = document.getElementById('avatarUpload');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            openProfileModal();
        });
    }
    
    if (profileCloseBtn) {
        profileCloseBtn.addEventListener('click', () => {
            profileModal.classList.add('hidden');
        });
    }
    
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.classList.add('hidden');
            }
        });
    }
    
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', saveProfile);
    }
    
    if (profileAvatarLarge && avatarUpload) {
        profileAvatarLarge.addEventListener('click', () => {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadAvatar(file);
            }
        });
    }
}

function openProfileModal() {
    const profileModal = document.getElementById('profileModal');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    
    if (!profileModal) return;
    
    // Load current user data
    if (currentUser) {
        if (profileUsername) profileUsername.value = currentUser.username || '';
        if (profileEmail) profileEmail.value = currentUser.email || '';
        if (profileBio) profileBio.value = currentUser.bio || '';
        
        // Update avatar
        if (profileAvatarLarge) {
            if (currentUser.avatar && currentUser.avatar.startsWith('http')) {
                profileAvatarLarge.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
            } else {
                const initial = (currentUser.username || 'U').charAt(0).toUpperCase();
                profileAvatarLarge.textContent = initial;
            }
        }
    }
    
    profileModal.classList.remove('hidden');
}

async function saveProfile() {
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    
    if (!profileUsername || !profileEmail) return;
    
    const username = profileUsername.value.trim();
    const email = profileEmail.value.trim();
    const bio = profileBio ? profileBio.value.trim() : '';
    
    if (!username || !email) {
        alert('Username and email are required');
        return;
    }
    
    try {
        const response = await fetch(getApiUrl('/api/user/profile'), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, bio })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = { ...currentUser, ...data };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserInfo();
            document.getElementById('profileModal').classList.add('hidden');
            alert('Profile updated successfully!');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile');
    }
}

async function uploadAvatar(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch(getApiUrl('/api/user/avatar'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser.avatar = data.avatar;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserInfo();
            openProfileModal(); // Refresh modal
        } else {
            alert('Failed to upload avatar');
        }
    } catch (error) {
        console.error('Avatar upload error:', error);
        alert('Failed to upload avatar');
    }
}

// Settings Management
function initializeSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
        });
    }
    
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', () => {
            settingsPanel.classList.remove('open');
        });
    }
    
    if (notificationsToggle) {
        notificationsToggle.addEventListener('click', () => {
            notificationsToggle.classList.toggle('active');
            const enabled = notificationsToggle.classList.contains('active');
            localStorage.setItem('notificationsEnabled', enabled);
        });
        
        // Load saved preference
        const saved = localStorage.getItem('notificationsEnabled');
        if (saved === 'false') {
            notificationsToggle.classList.remove('active');
        }
    }
    
    if (themeOptions.length > 0) {
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const theme = option.dataset.theme;
                applyTheme(theme);
            });
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        themeOptions.forEach(opt => {
            if (opt.dataset.theme === savedTheme) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
        applyTheme(savedTheme);
    }
}

function applyTheme(theme) {
    localStorage.setItem('theme', theme);
    
    if (theme === 'light') {
        document.documentElement.style.setProperty('--bg-primary', '#F5F5F5');
        document.documentElement.style.setProperty('--bg-glass', 'rgba(245, 245, 245, 0.9)');
        document.documentElement.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.8)');
        document.documentElement.style.setProperty('--text-primary', '#1A1A1A');
        document.documentElement.style.setProperty('--text-secondary', 'rgba(26, 26, 26, 0.7)');
        document.documentElement.style.setProperty('--text-tertiary', 'rgba(26, 26, 26, 0.5)');
        document.body.style.background = 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 50%, #F5F5F5 100%)';
    } else {
        document.documentElement.style.setProperty('--bg-primary', '#0F0B1E');
        document.documentElement.style.setProperty('--bg-glass', 'rgba(15, 11, 30, 0.8)');
        document.documentElement.style.setProperty('--bg-card', 'rgba(139, 92, 246, 0.15)');
        document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
        document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
        document.documentElement.style.setProperty('--text-tertiary', 'rgba(255, 255, 255, 0.5)');
        document.body.style.background = 'linear-gradient(135deg, #0F0B1E 0%, #1A0F3D 50%, #0F0B1E 100%)';
    }
}

// Gifts System
function initializeGifts() {
    const giftsBtn = document.getElementById('giftsBtn');
    const giftsPanel = document.getElementById('giftsPanel');
    const giftsCloseBtn = document.getElementById('giftsCloseBtn');
    const giftTabs = document.querySelectorAll('.gift-tab');
    
    if (giftsCloseBtn) {
        giftsCloseBtn.addEventListener('click', () => {
            giftsPanel.classList.remove('open');
        });
    }
    
    if (giftTabs.length > 0) {
        giftTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                giftTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                loadGifts(tab.dataset.tab);
            });
        });
    }
    
    // Load initial gifts
    loadGifts('regular');
}

function loadGifts(type) {
    const giftsGrid = document.getElementById('giftsGrid');
    if (!giftsGrid) return;
    
    giftsGrid.innerHTML = '';
    
    const gifts = type === 'nft' ? getNFTGifts() : getRegularGifts();
    
    gifts.forEach(gift => {
        const giftItem = document.createElement('div');
        giftItem.className = `gift-item ${gift.nft ? 'nft' : ''}`;
        giftItem.innerHTML = `
            <div class="gift-icon">${gift.icon}</div>
            <div class="gift-name">${gift.name}</div>
            <div class="gift-price">${gift.price}</div>
        `;
        giftItem.addEventListener('click', () => sendGift(gift));
        giftsGrid.appendChild(giftItem);
    });
}

function getRegularGifts() {
    return [
        { icon: '🎁', name: 'Gift Box', price: 'Free', nft: false },
        { icon: '🌹', name: 'Rose', price: '10 coins', nft: false },
        { icon: '💝', name: 'Heart Gift', price: '20 coins', nft: false },
        { icon: '🎈', name: 'Balloon', price: '15 coins', nft: false },
        { icon: '🍰', name: 'Cake', price: '25 coins', nft: false },
        { icon: '🎂', name: 'Birthday Cake', price: '30 coins', nft: false },
        { icon: '🎊', name: 'Party', price: '40 coins', nft: false },
        { icon: '💐', name: 'Bouquet', price: '35 coins', nft: false },
        { icon: '🎉', name: 'Celebration', price: '50 coins', nft: false }
    ];
}

function getNFTGifts() {
    return [
        { icon: '💎', name: 'Diamond NFT', price: '100 coins', nft: true },
        { icon: '👑', name: 'Crown NFT', price: '200 coins', nft: true },
        { icon: '⭐', name: 'Star NFT', price: '150 coins', nft: true },
        { icon: '🔥', name: 'Fire NFT', price: '180 coins', nft: true },
        { icon: '🌟', name: 'Glow NFT', price: '220 coins', nft: true },
        { icon: '✨', name: 'Sparkle NFT', price: '250 coins', nft: true }
    ];
}

function sendGift(gift) {
    if (!currentDMUserId && !currentChannel) {
        alert('Please select a chat to send a gift');
        return;
    }
    
    // In a real app, this would send the gift via API
    const recipient = currentDMUserId ? `user ${currentDMUserId}` : `channel ${currentChannel}`;
    alert(`Sending ${gift.name} to ${recipient}...`);
    
    // Here you would make an API call to send the gift
    // For now, we'll just show a message
}

// ============================================
// VOICE MESSAGES SYSTEM
// ============================================

let isVoiceRecording = false;
let voiceMediaRecorder = null;
let voiceAudioChunks = [];
let voiceRecordingTimer = null;
let maxVoiceDuration = 300; // 5 minutes

function initializeVoiceMessages() {
    const voiceBtn = document.getElementById('voiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    const voiceRecorder = document.getElementById('voiceRecorder');
    
    if (!voiceBtn) return;
    
    // Click to start/stop (alternative to hold)
    voiceBtn.addEventListener('click', () => {
        if (!isVoiceRecording) {
            startVoiceRecording();
        } else {
            stopVoiceRecording();
        }
    });
    
    // Hold to record (like Telegram)
    let holdTimeout = null;
    voiceBtn.addEventListener('mousedown', () => {
        holdTimeout = setTimeout(() => {
            if (!isVoiceRecording) {
                startVoiceRecording();
            }
        }, 100);
    });
    
    voiceBtn.addEventListener('mouseup', () => {
        if (holdTimeout) {
            clearTimeout(holdTimeout);
            holdTimeout = null;
        }
        if (isVoiceRecording) {
            stopVoiceRecording();
        }
    });
    
    voiceBtn.addEventListener('mouseleave', () => {
        if (holdTimeout) {
            clearTimeout(holdTimeout);
            holdTimeout = null;
        }
        if (isVoiceRecording) {
            stopVoiceRecording();
        }
    });
    
    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener('click', stopVoiceRecording);
    }
}

async function startVoiceRecording() {
    if (isVoiceRecording) return;
    
    if (!currentChannel && !currentDMUserId) {
        alert('Please select a chat to send voice message');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 48000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        voiceMediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        });
        
        voiceAudioChunks = [];
        
        voiceMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                voiceAudioChunks.push(event.data);
            }
        };
        
        voiceMediaRecorder.onstop = () => {
            const audioBlob = new Blob(voiceAudioChunks, { type: 'audio/webm' });
            sendVoiceMessage(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        voiceMediaRecorder.start();
        isVoiceRecording = true;
        
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceRecorder = document.getElementById('voiceRecorder');
        
        if (voiceBtn) voiceBtn.classList.add('recording');
        if (voiceRecorder) voiceRecorder.style.display = 'block';
        
        let seconds = 0;
        updateVoiceTimer(seconds);
        
        voiceRecordingTimer = setInterval(() => {
            seconds++;
            updateVoiceTimer(seconds);
            
            if (seconds >= maxVoiceDuration) {
                stopVoiceRecording();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error starting voice recording:', error);
        alert('Failed to start recording. Please check microphone permissions.');
    }
}

function stopVoiceRecording() {
    if (!isVoiceRecording) return;
    
    if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') {
        voiceMediaRecorder.stop();
    }
    
    isVoiceRecording = false;
    clearInterval(voiceRecordingTimer);
    
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceRecorder = document.getElementById('voiceRecorder');
    
    if (voiceBtn) voiceBtn.classList.remove('recording');
    if (voiceRecorder) voiceRecorder.style.display = 'none';
}

function updateVoiceTimer(seconds) {
    const timer = document.getElementById('recordingTimer');
    if (!timer) return;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timer.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function sendVoiceMessage(audioBlob) {
    if (!currentChannel && !currentDMUserId) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async function() {
        const base64Audio = reader.result;
        const duration = document.getElementById('recordingTimer').textContent;
        
        // Create message element
        const messageElement = createVoiceMessageElement(base64Audio, duration);
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Send via Socket.IO
        if (socket && socket.connected) {
            if (currentDMUserId) {
                socket.emit('send-dm', {
                    receiverId: currentDMUserId,
                    message: {
                        text: '',
                        type: 'voice',
                        audioData: base64Audio,
                        duration: duration
                    }
                });
            } else if (currentChannel) {
                socket.emit('send-message', {
                    channelId: currentChannel,
                    message: {
                        text: '',
                        type: 'voice',
                        audioData: base64Audio,
                        duration: duration
                    }
                });
            }
        }
    };
}

function createVoiceMessageElement(audioData, duration) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-group';
    
    const isOwn = true; // Voice messages are always from current user
    messageDiv.innerHTML = `
        <div class="message-content ${isOwn ? 'own' : ''}">
            <div class="voice-message" onclick="playVoiceMessage('${audioData}')">
                <button class="voice-play-btn"><i class="fas fa-play"></i></button>
                <div class="voice-waveform"></div>
                <span class="voice-duration">${duration || '0:00'}</span>
            </div>
            <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `;
    
    return messageDiv;
}

function playVoiceMessage(audioData) {
    const audio = new Audio(audioData);
    audio.play().catch(error => {
        console.error('Error playing voice message:', error);
    });
}

// Make playVoiceMessage available globally
window.playVoiceMessage = playVoiceMessage;

// ============================================
// GROUP CALLS (STREAMS) SYSTEM
// ============================================
// Функции групповых звонков теперь в group-call.js
// Здесь только объявляем переменные для совместимости

let currentGroupCall = null;

// Функция showGroupCallNotification для уведомлений
function showGroupCallNotification(data) {
    const { channelName, type, startedBy } = data;
    
    // Show full screen notification similar to incoming call
    const notification = document.createElement('div');
    notification.className = 'group-call-notification';
    notification.innerHTML = `
        <div class="incoming-call-overlay"></div>
        <div class="incoming-call-content-fullscreen">
            <div class="caller-info-fullscreen">
                <div class="caller-avatar-fullscreen">
                    <span>${startedBy.username?.charAt(0).toUpperCase() || 'U'}</span>
                    <div class="caller-avatar-pulse"></div>
                </div>
                <div class="caller-name-fullscreen">${startedBy.username} начал групповой звонок</div>
                <div class="caller-status-fullscreen">в ${channelName}</div>
            </div>
            <div class="incoming-call-actions-fullscreen">
                <button class="call-action-btn-fullscreen reject" onclick="this.closest('.group-call-notification').remove()">
                    <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
                    <span>Отклонить</span>
                </button>
                <button class="call-action-btn-fullscreen accept" onclick="if(typeof joinGroupCall === 'function') joinGroupCall('${data.roomName}', '${type}'); this.closest('.group-call-notification').remove();">
                    <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                    <span>Присоединиться</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 30000);
}

// Функция updateGroupCallParticipants - заглушка, реальная логика в group-call.js
function updateGroupCallParticipants(participants) {
    console.log('📋 updateGroupCallParticipants вызвана, участников:', participants.length);
    // Реальная логика в group-call.js
}

// Показать приглашение в групповой звонок
function showGroupCallInvitation(data) {
    console.log('📨 Показываем приглашение в групповой звонок:', data);
    
    const { roomName, invitedBy, type } = data;
    
    // Функция для принятия приглашения
    window.acceptGroupCallInvitation = function() {
        console.log('✅ Принимаем приглашение в групповой звонок');
        
        // Удалить уведомление
        const notification = document.querySelector('.incoming-call-fullscreen');
        if (notification) {
            notification.remove();
        }
        
        // Присоединиться к звонку
        if (typeof joinGroupCall === 'function') {
            joinGroupCall(roomName, type);
        } else {
            console.error('❌ joinGroupCall не найдена!');
        }
    };
    
    // Показать уведомление как входящий звонок
    const notification = document.createElement('div');
    notification.className = 'incoming-call-fullscreen';
    notification.innerHTML = `
        <div class="incoming-call-overlay"></div>
        <div class="incoming-call-content-fullscreen">
            <div class="caller-info-fullscreen">
                <div class="caller-avatar-fullscreen">
                    <span>${invitedBy.username?.charAt(0).toUpperCase() || 'U'}</span>
                    <div class="caller-avatar-pulse"></div>
                </div>
                <div class="caller-name-fullscreen">${invitedBy.username}</div>
                <div class="caller-status-fullscreen">приглашает вас в групповой звонок</div>
            </div>
            <div class="incoming-call-actions-fullscreen">
                <button class="call-action-btn-fullscreen reject" onclick="this.closest('.incoming-call-fullscreen').remove()">
                    <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M12 9C10.4 9 8.85 9.25 7.4 9.72V12.82C7.4 13.22 7.17 13.56 6.84 13.72C5.86 14.21 4.97 14.84 4.17 15.57C3.85 15.85 3.35 15.84 3.03 15.56L0.77 13.3C0.29 12.82 0.29 12.04 0.77 11.56C3.93 8.4 8.13 6.5 12 6.5C15.87 6.5 20.07 8.4 23.23 11.56C23.71 12.04 23.71 12.82 23.23 13.3L20.97 15.56C20.65 15.84 20.15 15.85 19.83 15.57C19.03 14.84 18.14 14.21 17.16 13.72C16.83 13.56 16.6 13.22 16.6 12.82V9.72C15.15 9.25 13.6 9 12 9Z"/></svg>
                    <span>Отклонить</span>
                </button>
                <button class="call-action-btn-fullscreen accept" onclick="acceptGroupCallInvitation()">
                    <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M20.01 15.38C18.78 15.38 17.59 15.18 16.48 14.82C16.13 14.7 15.74 14.79 15.47 15.06L13.9 17.03C11.07 15.68 8.42 13.13 7.01 10.2L8.96 8.54C9.23 8.26 9.31 7.87 9.2 7.52C8.83 6.41 8.64 5.22 8.64 3.99C8.64 3.45 8.19 3 7.65 3H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21C20.72 21 21 20.37 21 19.82V16.37C21 15.83 20.55 15.38 20.01 15.38Z"/></svg>
                    <span>Присоединиться</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 30000);
}

// Simulate loading screen
function simulateLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
}

// Initialize adaptive layout
function initAdaptiveLayout() {
    const width = window.innerWidth;
    const body = document.body;
    
    // Remove existing layout classes
    body.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout');
    
    // Add appropriate layout class based on screen width
    if (width <= 768) {
        body.classList.add('mobile-layout');
    } else if (width <= 1024) {
        body.classList.add('tablet-layout');
    } else {
        body.classList.add('desktop-layout');
    }
    
    // Listen for window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initAdaptiveLayout();
        }, 250);
    });
}

// ============================================
// DISCORD-STYLE CALL INTERFACE FUNCTIONS
// ============================================

function updateDiscordCallUI(localUser, remoteUser = null) {
    console.log('Updating Discord call UI', { localUser, remoteUser });
    
    // Update local user
    const localNameTag = document.getElementById('localNameTag');
    const localAvatar = document.getElementById('localAvatar');
    
    if (localNameTag && localUser) {
        localNameTag.textContent = localUser.username || 'Вы';
    }
    
    if (localAvatar && localUser) {
        localAvatar.textContent = (localUser.username || 'U').charAt(0).toUpperCase();
        localAvatar.onclick = () => {
            if (localUser.id) {
                viewUserProfile(localUser.id);
            }
        };
    }
    
    // Update remote user
    const remoteCard = document.getElementById('remoteParticipantCard');
    const remoteNameTag = document.getElementById('remoteNameTag');
    const remoteAvatar = document.getElementById('remoteAvatar');
    
    if (remoteUser) {
        if (remoteCard) remoteCard.style.display = 'block';
        if (remoteNameTag) remoteNameTag.textContent = remoteUser.username || 'Friend';
        if (remoteAvatar) {
            remoteAvatar.textContent = (remoteUser.username || 'F').charAt(0).toUpperCase();
            remoteAvatar.onclick = () => {
                if (remoteUser.id) {
                    viewUserProfile(remoteUser.id);
                }
            };
        }
    } else {
        if (remoteCard) remoteCard.style.display = 'none';
    }
    
    // Update video visibility
    updateVideoOverlays();
}

function updateVideoOverlays() {
    const localVideo = document.getElementById('localVideo');
    const localOverlay = document.getElementById('localAvatarOverlay');
    const remoteVideo = document.getElementById('remoteVideo');
    const remoteOverlay = document.getElementById('remoteAvatarOverlay');
    
    // Show/hide local avatar overlay based on video state
    if (localVideo && localOverlay) {
        if (isVideoEnabled && localVideo.srcObject) {
            localOverlay.classList.add('hidden');
        } else {
            localOverlay.classList.remove('hidden');
        }
    }
    
    // Show/hide remote avatar overlay based on video state
    if (remoteVideo && remoteOverlay) {
        if (remoteVideo.srcObject && remoteVideo.readyState >= 2) {
            remoteOverlay.classList.add('hidden');
        } else {
            remoteOverlay.classList.remove('hidden');
        }
    }
}

function updateCallStatusIcons() {
    // Update local status icons
    const localMicStatus = document.getElementById('localMicStatus');
    const localCamStatus = document.getElementById('localCamStatus');
    
    if (localMicStatus) {
        localMicStatus.textContent = isAudioEnabled ? '🎤' : '🔇';
        localMicStatus.classList.toggle('muted', !isAudioEnabled);
    }
    
    if (localCamStatus) {
        localCamStatus.textContent = isVideoEnabled ? '📹' : '📷';
        localCamStatus.classList.toggle('muted', !isVideoEnabled);
    }
}

// Initialize new features when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeProfile();
        initializeSettings();
        initializeGifts();
        initializeVoiceMessages();
        initializeVideoCircles();
    });
} else {
    initializeProfile();
    initializeSettings();
    initializeGifts();
    initializeVoiceMessages();
    initializeVideoCircles();
}

// ============================================
// УЛУЧШЕННЫЙ ИНТЕРФЕЙС ЗВОНКОВ
// ============================================

let callTimer = null;
let callStartTime = null;
let callRemoteUser = null;

// Инициализация улучшенного интерфейса звонков
function initializeEnhancedCallInterface() {
    const minimizeBtn = document.getElementById('minimizeCallBtn');
    const fullscreenBtn = document.getElementById('fullscreenCallBtn');
    const expandBtn = document.getElementById('expandCallBtn');
    const bubbleToggleAudio = document.getElementById('bubbleToggleAudio');
    const bubbleLeaveCall = document.getElementById('bubbleLeaveCall');
    
    // Минимизация звонка
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', minimizeCall);
    }
    
    // Полноэкранный режим
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreenCall);
    }
    
    // Развернуть из баббла
    if (expandBtn) {
        expandBtn.addEventListener('click', expandCall);
    }
    
    // Управление звуком из баббла
    if (bubbleToggleAudio) {
        bubbleToggleAudio.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAudio();
            updateBubbleControls();
        });
    }
    
    // Завершить звонок из баббла
    if (bubbleLeaveCall) {
        bubbleLeaveCall.addEventListener('click', (e) => {
            e.stopPropagation();
            endCall();
        });
    }
    
    // Клик по аватаркам для открытия профиля
    const localAvatar = document.getElementById('localAvatar');
    const remoteAvatar = document.getElementById('remoteAvatar');
    
    if (localAvatar) {
        localAvatar.addEventListener('click', () => {
            if (currentUser && currentUser.id) {
                showUserProfile(currentUser.id);
            }
        });
    }
    
    if (remoteAvatar) {
        remoteAvatar.addEventListener('click', () => {
            if (callRemoteUser && callRemoteUser.id) {
                showUserProfile(callRemoteUser.id);
            }
        });
    }
}

// Запуск таймера звонка
function startCallTimer() {
    callStartTime = Date.now();
    
    if (callTimer) {
        clearInterval(callTimer);
    }
    
    callTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Обновляем таймер в интерфейсе
        const callTimerEl = document.getElementById('callTimer');
        const bubbleTimerEl = document.getElementById('bubbleCallTimer');
        
        if (callTimerEl) callTimerEl.textContent = timeString;
        if (bubbleTimerEl) bubbleTimerEl.textContent = timeString;
    }, 1000);
}

// Остановка таймера
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    callStartTime = null;
}

// Обновление информации о звонке
function updateCallInfo(remoteUser) {
    callRemoteUser = remoteUser;
    
    const callWithUser = document.getElementById('callWithUser');
    const bubbleCallWith = document.getElementById('bubbleCallWith');
    const bubbleRemoteAvatar = document.getElementById('bubbleRemoteAvatar');
    const bubbleLocalAvatar = document.getElementById('bubbleLocalAvatar');
    
    if (remoteUser) {
        const userName = remoteUser.username || 'Friend';
        
        if (callWithUser) {
            callWithUser.textContent = `с ${userName}`;
        }
        
        if (bubbleCallWith) {
            bubbleCallWith.textContent = userName;
        }
        
        // Обновляем аватарки в баббле
        if (bubbleRemoteAvatar) {
            if (remoteUser.avatar && (remoteUser.avatar.startsWith('http') || remoteUser.avatar.startsWith('/uploads'))) {
                bubbleRemoteAvatar.innerHTML = `<img src="${remoteUser.avatar}" alt="${userName}">`;
            } else {
                bubbleRemoteAvatar.textContent = userName.charAt(0).toUpperCase();
            }
        }
    }
    
    // Обновляем локальную аватарку
    if (bubbleLocalAvatar && currentUser) {
        if (currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('/uploads'))) {
            bubbleLocalAvatar.innerHTML = `<img src="${currentUser.avatar}" alt="${currentUser.username}">`;
        } else {
            bubbleLocalAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }
}

// Минимизация звонка
function minimizeCall() {
    console.log('📦 Минимизация звонка...');
    
    const callInterface = document.getElementById('callInterface');
    const callBubble = document.getElementById('callBubble');
    
    if (callInterface && callBubble) {
        callInterface.classList.add('minimizing');
        
        setTimeout(() => {
            callInterface.classList.add('hidden');
            callInterface.classList.remove('minimizing');
            callInterface.style.display = 'none'; // Принудительно скрыть
            
            callBubble.classList.remove('hidden');
            callBubble.style.display = 'flex'; // Показать баббл
            const bubbleContent = callBubble.querySelector('.call-bubble-content');
            if (bubbleContent) {
                bubbleContent.classList.add('active');
            }
            console.log('✅ Звонок минимизирован');
        }, 300);
    }
}

// Развернуть звонок
function expandCall() {
    console.log('📤 Разворачивание звонка...');
    
    const callInterface = document.getElementById('callInterface');
    const callBubble = document.getElementById('callBubble');
    
    if (callInterface && callBubble) {
        // Скрыть баббл
        callBubble.classList.add('hidden');
        callBubble.style.display = 'none'; // Принудительно скрыть
        const bubbleContent = callBubble.querySelector('.call-bubble-content');
        if (bubbleContent) {
            bubbleContent.classList.remove('active');
        }
        
        // Показать интерфейс
        callInterface.classList.remove('hidden');
        callInterface.style.display = 'flex'; // Показать интерфейс
        callInterface.classList.add('expanding');
        
        setTimeout(() => {
            callInterface.classList.remove('expanding');
            console.log('✅ Звонок развернут');
        }, 300);
    }
}

// Полноэкранный режим (новая версия)
function toggleFullscreenCall() {
    // Проверить есть ли уже полноэкранный режим
    const isInFullscreen = document.getElementById('fullscreenCallContainer');
    
    if (isInFullscreen) {
        // Выйти из полноэкранного режима
        if (typeof window.exitFullscreenCall === 'function') {
            window.exitFullscreenCall();
        }
        return;
    }
    
    // Найти активное видео для полноэкранного режима
    let videoToShow = null;
    let videoType = 'camera';
    
    // Приоритет: remote video (видео собеседника)
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo && remoteVideo.srcObject) {
        const videoTracks = remoteVideo.srcObject.getVideoTracks();
        console.log('🎥 Remote video tracks:', videoTracks.length, videoTracks);
        
        if (videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState === 'live') {
            videoToShow = remoteVideo.srcObject;
            // Определить тип по размеру видео или другим признакам
            const videoTrack = videoTracks[0];
            if (videoTrack.getSettings) {
                const settings = videoTrack.getSettings();
                console.log('📹 Video settings:', settings);
                // Если разрешение больше обычной камеры - скорее всего демонстрация
                if (settings.width > 1280 || settings.height > 720) {
                    videoType = 'screen';
                }
            }
        }
    }
    
    // Если нет remote video, использовать local video
    if (!videoToShow) {
        const localVideo = document.getElementById('localVideo');
        if (localVideo && localVideo.srcObject) {
            const videoTracks = localVideo.srcObject.getVideoTracks();
            console.log('🎥 Local video tracks:', videoTracks.length, videoTracks);
            
            if (videoTracks.length > 0 && videoTracks[0].enabled && videoTracks[0].readyState === 'live') {
                videoToShow = localVideo.srcObject;
                videoType = screenStream ? 'screen' : 'camera';
            }
        }
    }
    
    if (!videoToShow) {
        console.error('❌ Нет активного видео для полноэкранного режима');
        console.log('Remote video:', remoteVideo, 'srcObject:', remoteVideo?.srcObject);
        console.log('Local video:', document.getElementById('localVideo'), 'srcObject:', document.getElementById('localVideo')?.srcObject);
        alert('Нет активного видео для полноэкранного режима');
        return;
    }
    
    console.log('✅ Открываем полноэкранный режим:', videoType);
    
    // Войти в полноэкранный режим
    if (typeof window.enterFullscreenCall === 'function') {
        window.enterFullscreenCall(videoToShow, videoType);
    }
}

// Обновление контролов в баббле
function updateBubbleControls() {
    const bubbleToggleAudio = document.getElementById('bubbleToggleAudio');
    
    if (bubbleToggleAudio) {
        if (isAudioEnabled) {
            bubbleToggleAudio.classList.remove('muted');
        } else {
            bubbleToggleAudio.classList.add('muted');
        }
    }
}

// Завершение звонка
function endCall() {
    console.log('🔴 Завершение звонка...');
    console.log('📍 inCall до завершения:', inCall);
    
    // СНАЧАЛА сбрасываем флаг inCall чтобы предотвратить повторное показывание UI
    inCall = false;
    
    stopCallTimer();
    
    const callInterface = document.getElementById('callInterface');
    const callBubble = document.getElementById('callBubble');
    
    console.log('📍 callInterface:', callInterface);
    console.log('📍 callBubble:', callBubble);
    
    // Скрыть интерфейс звонка (агрессивно)
    if (callInterface) {
        callInterface.classList.add('hidden');
        callInterface.classList.remove('fullscreen');
        callInterface.classList.remove('minimizing');
        callInterface.classList.remove('expanding');
        callInterface.style.display = 'none'; // Принудительно скрыть
        console.log('✅ callInterface скрыт');
    } else {
        console.error('❌ callInterface не найден!');
    }
    
    // Скрыть баббл (агрессивно)
    if (callBubble) {
        callBubble.classList.add('hidden');
        callBubble.style.display = 'none'; // Принудительно скрыть
        const bubbleContent = callBubble.querySelector('.call-bubble-content');
        if (bubbleContent) {
            bubbleContent.classList.remove('active');
        }
        console.log('✅ callBubble скрыт');
    } else {
        console.error('❌ callBubble не найден!');
    }
    
    // Закрыть полноэкранный режим если открыт
    if (typeof window.exitFullscreenCall === 'function') {
        const fullscreenContainer = document.getElementById('fullscreenCallContainer');
        if (fullscreenContainer) {
            console.log('🖥️ Закрываем полноэкранный режим');
            window.exitFullscreenCall();
        }
    }
    
    // Вызываем существующую функцию завершения звонка
    // inCall уже false, поэтому leaveVoiceChannel не будет ничего делать
    // но мы все равно вызываем для очистки ресурсов
    leaveVoiceChannel(true);
    
    callRemoteUser = null;
    
    // Сбросить состояние добавления участников
    if (typeof resetAddParticipantState === 'function') {
        resetAddParticipantState();
    }
    
    console.log('✅ Звонок завершен, inCall:', inCall);
}

// Переопределяем функцию initiateCall для использования нового интерфейса
const originalInitiateCall = window.initiateCall || initiateCall;
window.initiateCall = async function(friendId, type) {
    // Вызываем оригинальную функцию
    await originalInitiateCall(friendId, type);
    
    // Запускаем таймер
    startCallTimer();
    
    // Получаем информацию о друге
    try {
        const response = await fetch(`/api/users/${friendId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const friend = await response.json();
            updateCallInfo(friend);
        }
    } catch (error) {
        console.error('Error loading friend info:', error);
    }
};

// Переопределяем acceptCall
const originalAcceptCall = window.acceptCall || acceptCall;
window.acceptCall = async function(caller, type) {
    await originalAcceptCall(caller, type);
    
    startCallTimer();
    updateCallInfo(caller);
};

// Переопределяем leaveVoiceChannel для правильного закрытия
const originalLeaveVoiceChannel = leaveVoiceChannel;
window.leaveVoiceChannel = function(force = false) {
    originalLeaveVoiceChannel(force);
    
    if (force) {
        stopCallTimer();
        
        const callInterface = document.getElementById('callInterface');
        const callBubble = document.getElementById('callBubble');
        
        if (callInterface) {
            callInterface.classList.add('hidden');
            callInterface.classList.remove('fullscreen');
        }
        
        if (callBubble) {
            callBubble.classList.add('hidden');
        }
        
        callRemoteUser = null;
    }
};

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedCallInterface);
} else {
    initializeEnhancedCallInterface();
}

console.log('✨ Enhanced call interface initialized');


// Редактирование сообщения
function editMessage(messageId, newText) {
    if (!socket || !socket.connected) return;
    
    socket.emit('edit-message', {
        messageId: messageId,
        newText: newText,
        channelId: currentChannel || null,
        dmUserId: currentDMUserId || null
    });
}
