// ============================================
// MODERN UI FEATURES
// ============================================

// User Profile Bubble Menu
let currentUserStatus = 'online';

function initializeUserProfileBubble() {
    const userInfoBtn = document.getElementById('userInfoBtn');
    const profileBubble = document.getElementById('userProfileBubble');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    
    if (!userInfoBtn || !profileBubble) return;
    
    // Toggle bubble on click
    userInfoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileBubble.classList.toggle('hidden');
    });
    
    // Close bubble when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileBubble.contains(e.target) && !userInfoBtn.contains(e.target)) {
            profileBubble.classList.add('hidden');
        }
    });
    
    // Status options
    const statusOptions = profileBubble.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', () => {
            const status = option.getAttribute('data-status');
            changeUserStatus(status);
            
            // Update active state
            statusOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });
    
    // Edit profile button
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            profileBubble.classList.add('hidden');
            document.getElementById('profileModal').classList.remove('hidden');
        });
    }
    
    // Settings button
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            profileBubble.classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('open');
        });
    }
    
    // Load current user info
    loadUserProfileBubble();
}

function loadUserProfileBubble() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    
    const profileBubble = document.getElementById('userProfileBubble');
    if (!profileBubble) return;
    
    const avatar = profileBubble.querySelector('.profile-bubble-avatar');
    const name = profileBubble.querySelector('.profile-bubble-name');
    const email = profileBubble.querySelector('.profile-bubble-email');
    
    if (avatar) {
        if (currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('/uploads'))) {
            avatar.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatar.textContent = currentUser.avatar || currentUser.username.charAt(0).toUpperCase();
        }
    }
    if (name) name.textContent = currentUser.username;
    if (email) email.textContent = currentUser.email || '';
}

function changeUserStatus(status) {
    currentUserStatus = status;
    
    const statusText = document.getElementById('userStatusText');
    const statusIndicator = statusText.querySelector('.status-indicator');
    const statusLabel = statusText.querySelector('span:last-child');
    
    // Remove all status classes
    statusIndicator.classList.remove('status-online', 'status-idle', 'status-dnd', 'status-offline');
    
    // Add new status class and update text
    const statusMap = {
        'online': { class: 'status-online', text: 'Онлайн' },
        'idle': { class: 'status-idle', text: 'Не активен' },
        'dnd': { class: 'status-dnd', text: 'Не беспокоить' },
        'offline': { class: 'status-offline', text: 'Оффлайн' }
    };
    
    const statusInfo = statusMap[status];
    if (statusInfo) {
        statusIndicator.classList.add(statusInfo.class);
        statusLabel.textContent = statusInfo.text;
    }
    
    // Send status update to server
    if (socket && socket.connected) {
        socket.emit('status-change', { status });
    }
    
    showCustomNotification('success', 'Статус изменен', `Ваш статус: ${statusInfo.text}`);
}

// ============================================
// CUSTOM NOTIFICATIONS SYSTEM
// ============================================

function showCustomNotification(type, title, message, duration = 5000) {
    const container = document.getElementById('customNotifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    const iconMap = {
        'success': '✓',
        'error': '✕',
        'info': 'ℹ',
        'warning': '⚠'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${iconMap[type] || 'ℹ'}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">✕</button>
    `;
    
    container.appendChild(notification);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Click to dismiss
    notification.addEventListener('click', (e) => {
        if (!closeBtn.contains(e.target)) {
            removeNotification(notification);
        }
    });
    
    // Auto remove after duration
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
}

function removeNotification(notification) {
    notification.classList.add('removing');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// ============================================
// VOICE MESSAGES & VIDEO CIRCLES
// ============================================

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let isRecordingVoice = false;

function initializeVoiceMessages() {
    const voiceBtn = document.getElementById('voiceBtn');
    const stopVoiceBtn = document.getElementById('stopVoiceBtn');
    const voiceRecorder = document.getElementById('voiceRecorder');
    
    if (!voiceBtn) return;
    
    // Hold to record
    voiceBtn.addEventListener('mousedown', startVoiceRecording);
    voiceBtn.addEventListener('mouseup', stopVoiceRecording);
    voiceBtn.addEventListener('mouseleave', () => {
        if (isRecordingVoice) stopVoiceRecording();
    });
    
    // Touch support
    voiceBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startVoiceRecording();
    });
    voiceBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopVoiceRecording();
    });
    
    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener('click', stopVoiceRecording);
    }
}

async function startVoiceRecording() {
    if (isRecordingVoice) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        isRecordingVoice = true;
        
        mediaRecorder.addEventListener('dataavailable', (event) => {
            audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendVoiceMessage(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        });
        
        mediaRecorder.start();
        
        // Show recorder UI
        const voiceRecorder = document.getElementById('voiceRecorder');
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceRecorder) voiceRecorder.style.display = 'block';
        if (voiceBtn) voiceBtn.classList.add('recording');
        
        // Start timer
        recordingStartTime = Date.now();
        updateRecordingTimer();
        recordingTimer = setInterval(updateRecordingTimer, 100);
        
    } catch (error) {
        console.error('Error starting voice recording:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось начать запись голоса');
    }
}

function stopVoiceRecording() {
    if (!isRecordingVoice || !mediaRecorder) return;
    
    isRecordingVoice = false;
    mediaRecorder.stop();
    
    // Hide recorder UI
    const voiceRecorder = document.getElementById('voiceRecorder');
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceRecorder) voiceRecorder.style.display = 'none';
    if (voiceBtn) voiceBtn.classList.remove('recording');
    
    // Stop timer
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

function updateRecordingTimer() {
    if (!recordingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timerEl = document.getElementById('recordingTimer');
    if (timerEl) {
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

async function sendVoiceMessage(audioBlob) {
    try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64Audio = reader.result;
            const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
            const durationText = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
            
            const message = {
                type: 'voice',
                audioData: base64Audio,
                duration: durationText,
                text: '[Voice Message]'
            };
            
            if (socket && socket.connected) {
                if (currentView === 'dm' && currentDMUserId) {
                    socket.emit('send-dm', {
                        receiverId: currentDMUserId,
                        message: message
                    });
                } else if (currentView === 'server') {
                    const channelId = getChannelIdByName(currentChannel);
                    socket.emit('send-message', {
                        channelId: channelId,
                        message: message
                    });
                }
            }
            
            showCustomNotification('success', 'Голосовое сообщение', 'Отправлено');
        };
    } catch (error) {
        console.error('Error sending voice message:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось отправить голосовое сообщение');
    }
}

function playVoiceMessage(audioData) {
    const audio = new Audio(audioData);
    audio.play();
}

function playVideoCircle(videoUrl) {
    // Create fullscreen video player
    const player = document.createElement('div');
    player.className = 'video-circle-player-fullscreen';
    player.innerHTML = `
        <div class="video-player-overlay" onclick="this.parentElement.remove()"></div>
        <div class="video-player-content">
            <video src="${videoUrl}" autoplay controls class="video-player-video"></video>
            <button class="video-player-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
    `;
    document.body.appendChild(player);
}

// Make it global
window.playVideoCircle = playVideoCircle;

// ============================================
// VIDEO CIRCLES (КРУЖКИ)
// ============================================

let videoCircleRecorder = null;
let videoCircleStream = null;
let videoCircleChunks = [];
let isRecordingCircle = false;

function initializeVideoCircles() {
    // Use existing video circle button from HTML
    const circleBtn = document.getElementById('videoCircleBtn');
    if (!circleBtn) {
        console.error('Video circle button not found!');
        return;
    }
    
    circleBtn.addEventListener('click', startVideoCircle);
    console.log('Video circles initialized');
}

async function startVideoCircle() {
    try {
        videoCircleStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 720, height: 720, facingMode: 'user' },
            audio: true
        });
        
        // Create recorder UI
        const recorder = document.createElement('div');
        recorder.className = 'video-circle-recorder active';
        recorder.id = 'videoCircleRecorder';
        recorder.innerHTML = `
            <video class="video-circle-preview" autoplay muted playsinline></video>
            <div class="video-circle-timer">0:00</div>
            <div class="video-circle-controls">
                <button class="video-circle-control-btn record" id="circleRecordBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24"><circle fill="currentColor" cx="12" cy="12" r="8"/></svg>
                </button>
                <button class="video-circle-control-btn cancel" id="circleCancelBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(recorder);
        
        const preview = recorder.querySelector('.video-circle-preview');
        preview.srcObject = videoCircleStream;
        
        // Record button
        document.getElementById('circleRecordBtn').addEventListener('click', () => {
            if (!isRecordingCircle) {
                startCircleRecording();
            } else {
                stopCircleRecording();
            }
        });
        
        // Cancel button
        document.getElementById('circleCancelBtn').addEventListener('click', cancelVideoCircle);
        
    } catch (error) {
        console.error('Error starting video circle:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось начать запись кружка');
    }
}

function startCircleRecording() {
    if (!videoCircleStream) return;
    
    videoCircleRecorder = new MediaRecorder(videoCircleStream);
    videoCircleChunks = [];
    isRecordingCircle = true;
    
    videoCircleRecorder.addEventListener('dataavailable', (event) => {
        videoCircleChunks.push(event.data);
    });
    
    videoCircleRecorder.addEventListener('stop', () => {
        const videoBlob = new Blob(videoCircleChunks, { type: 'video/webm' });
        sendVideoCircle(videoBlob);
    });
    
    videoCircleRecorder.start();
    
    // Update button
    const recordBtn = document.getElementById('circleRecordBtn');
    recordBtn.classList.remove('record');
    recordBtn.classList.add('stop');
    recordBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><rect fill="currentColor" x="6" y="6" width="12" height="12"/></svg>';
    
    // Start timer
    recordingStartTime = Date.now();
    updateCircleTimer();
    recordingTimer = setInterval(updateCircleTimer, 100);
}

function stopCircleRecording() {
    if (!isRecordingCircle || !videoCircleRecorder) return;
    
    isRecordingCircle = false;
    videoCircleRecorder.stop();
    
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

function updateCircleTimer() {
    if (!recordingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timerEl = document.querySelector('.video-circle-timer');
    if (timerEl) {
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function cancelVideoCircle() {
    if (videoCircleStream) {
        videoCircleStream.getTracks().forEach(track => track.stop());
        videoCircleStream = null;
    }
    
    const recorder = document.getElementById('videoCircleRecorder');
    if (recorder) recorder.remove();
    
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
    
    isRecordingCircle = false;
}

async function sendVideoCircle(videoBlob) {
    try {
        // Upload video circle
        const formData = new FormData();
        formData.append('file', videoBlob, 'circle.webm');
        formData.append('channelId', currentChannel);
        formData.append('type', 'video-circle');
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const fileData = await response.json();
        
        const message = {
            type: 'video-circle',
            videoUrl: fileData.url,
            text: '[Video Circle]'
        };
        
        if (socket && socket.connected) {
            if (currentView === 'dm' && currentDMUserId) {
                socket.emit('send-dm', {
                    receiverId: currentDMUserId,
                    message: message
                });
            } else if (currentView === 'server') {
                const channelId = getChannelIdByName(currentChannel);
                socket.emit('send-message', {
                    channelId: channelId,
                    message: message
                });
            }
        }
        
        cancelVideoCircle();
        showCustomNotification('success', 'Кружок отправлен', 'Видео успешно отправлено');
        
    } catch (error) {
        console.error('Error sending video circle:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось отправить кружок');
    }
}

// ============================================
// TELEGRAM-STYLE GROUPS & CHANNELS
// ============================================

function initializeTelegramGroups() {
    const groupsBtn = document.getElementById('groupsBtn');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const addChannelBtn = document.getElementById('addChannelBtn');
    
    if (groupsBtn) {
        groupsBtn.addEventListener('click', showGroupsView);
    }
    
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', createNewGroup);
    }
    
    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', createNewChannel);
    }
    
    // Load groups
    loadUserGroups();
}

function showGroupsView() {
    document.getElementById('friendsView').style.display = 'none';
    document.getElementById('chatView').style.display = 'none';
    document.getElementById('dmListView').style.display = 'none';
    document.getElementById('channelsView').style.display = 'none';
    document.getElementById('groupsView').style.display = 'block';
    
    document.getElementById('serverName').textContent = 'Группы и каналы';
    
    document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
    document.getElementById('groupsBtn').classList.add('active');
    
    loadUserGroups();
}

async function loadUserGroups() {
    // This would load from server
    const mockGroups = [
        {
            id: 1,
            name: 'Разработка',
            avatar: '💻',
            members: 15,
            unread: 3,
            hasVoice: true,
            voiceParticipants: 5
        },
        {
            id: 2,
            name: 'Общий чат',
            avatar: '💬',
            members: 42,
            unread: 0,
            hasVoice: false
        }
    ];
    
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;
    
    groupsList.innerHTML = '';
    
    mockGroups.forEach(group => {
        const groupItem = createGroupItem(group);
        groupsList.appendChild(groupItem);
        
        // Add voice conference indicator if active
        if (group.hasVoice) {
            const voiceIndicator = createVoiceConferenceIndicator(group);
            groupsList.appendChild(voiceIndicator);
        }
    });
}

function createGroupItem(group) {
    const item = document.createElement('div');
    item.className = 'group-item';
    item.setAttribute('data-group-id', group.id);
    
    item.innerHTML = `
        <div class="group-avatar">${group.avatar}</div>
        <div class="group-info">
            <div class="group-name">${group.name}</div>
            <div class="group-meta">
                <span class="group-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    ${group.members}
                </span>
            </div>
        </div>
        ${group.unread > 0 ? `<div class="group-unread">${group.unread}</div>` : ''}
    `;
    
    item.addEventListener('click', () => openGroup(group));
    
    return item;
}

function createVoiceConferenceIndicator(group) {
    const indicator = document.createElement('div');
    indicator.className = 'voice-conference-indicator';
    indicator.innerHTML = `
        <div class="voice-conference-icon">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C10.895 2 10 2.895 10 4V12C10 13.105 10.895 14 12 14C13.105 14 14 13.105 14 12V4C14 2.895 13.105 2 12 2Z"/></svg>
        </div>
        <div class="voice-conference-info">
            <div class="voice-conference-title">Голосовая конференция</div>
            <div class="voice-conference-participants">${group.voiceParticipants} участников</div>
        </div>
    `;
    
    indicator.addEventListener('click', () => joinVoiceConference(group));
    
    return indicator;
}

function createNewGroup() {
    const groupName = prompt('Введите название группы:');
    if (!groupName || groupName.trim() === '') return;
    
    showCustomNotification('info', 'Создание группы', 'Функция в разработке');
}

function createNewChannel() {
    const channelName = prompt('Введите название канала:');
    if (!channelName || channelName.trim() === '') return;
    
    showCustomNotification('info', 'Создание канала', 'Функция в разработке');
}

function openGroup(group) {
    showCustomNotification('info', 'Открытие группы', `Открываем ${group.name}`);
}

function joinVoiceConference(group) {
    showCustomNotification('info', 'Голосовая конференция', `Подключаемся к конференции в ${group.name}`);
}

// ============================================
// DM CALL BUTTONS
// ============================================

function initializeDMCallButtons() {
    const dmAudioCallBtn = document.getElementById('dmAudioCallBtn');
    const dmVideoCallBtn = document.getElementById('dmVideoCallBtn');
    const dmProfileBtn = document.getElementById('dmProfileBtn');
    
    if (dmAudioCallBtn) {
        dmAudioCallBtn.addEventListener('click', () => {
            if (currentDMUserId) {
                initiateCall(currentDMUserId, 'audio');
            }
        });
    }
    
    if (dmVideoCallBtn) {
        dmVideoCallBtn.addEventListener('click', () => {
            if (currentDMUserId) {
                initiateCall(currentDMUserId, 'video');
            }
        });
    }
    
    if (dmProfileBtn) {
        dmProfileBtn.addEventListener('click', () => {
            if (currentDMUserId) {
                showUserProfile(currentDMUserId);
            }
        });
    }
}

// ============================================
// USER PROFILE VIEW (DISCORD-STYLE)
// ============================================

function initializeUserProfileView() {
    const userProfileViewModal = document.getElementById('userProfileViewModal');
    const userProfileViewClose = document.getElementById('userProfileViewClose');
    
    if (userProfileViewClose) {
        userProfileViewClose.addEventListener('click', () => {
            userProfileViewModal.classList.add('hidden');
        });
    }
    
    // Close on overlay click
    const overlay = document.querySelector('.profile-view-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            userProfileViewModal.classList.add('hidden');
        });
    }
    
    // Profile action buttons
    const viewUserMessage = document.getElementById('viewUserMessage');
    const viewUserCall = document.getElementById('viewUserCall');
    const viewUserVideoCall = document.getElementById('viewUserVideoCall');
    
    if (viewUserMessage) {
        viewUserMessage.addEventListener('click', () => {
            const userId = userProfileViewModal.getAttribute('data-user-id');
            if (userId) {
                userProfileViewModal.classList.add('hidden');
                startDM(parseInt(userId), document.getElementById('viewUsername').textContent);
            }
        });
    }
    
    if (viewUserCall) {
        viewUserCall.addEventListener('click', () => {
            const userId = userProfileViewModal.getAttribute('data-user-id');
            if (userId) {
                userProfileViewModal.classList.add('hidden');
                initiateCall(parseInt(userId), 'audio');
            }
        });
    }
    
    if (viewUserVideoCall) {
        viewUserVideoCall.addEventListener('click', () => {
            const userId = userProfileViewModal.getAttribute('data-user-id');
            if (userId) {
                userProfileViewModal.classList.add('hidden');
                initiateCall(parseInt(userId), 'video');
            }
        });
    }
    
    // Make avatars clickable
    document.addEventListener('click', (e) => {
        const avatar = e.target.closest('.message-avatar, .friend-avatar');
        if (avatar) {
            const messageGroup = avatar.closest('.message-group, .friend-item');
            if (messageGroup) {
                const userId = messageGroup.getAttribute('data-user-id');
                if (userId) {
                    showUserProfile(parseInt(userId));
                }
            }
        }
    });
}

async function showUserProfile(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user');
        }
        
        const user = await response.json();
        console.log('Loaded user profile:', user); // Debug
        displayUserProfile(user);
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось загрузить профиль');
    }
}

function displayUserProfile(user) {
    const modal = document.getElementById('userProfileViewModal');
    modal.setAttribute('data-user-id', user.id);
    
    const avatar = document.getElementById('viewUserAvatar');
    const username = document.getElementById('viewUsername');
    const userTag = document.getElementById('viewUserTag');
    const bio = document.getElementById('viewUserBio');
    const joined = document.getElementById('viewUserJoined');
    const statusIndicator = modal.querySelector('.profile-view-status .status-indicator');
    const badgesContainer = document.getElementById('viewUserBadges');
    const banner = document.getElementById('viewUserBanner');
    
    // Set avatar
    if (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/uploads'))) {
        avatar.innerHTML = `<img src="${user.avatar}" alt="${user.username}">`;
    } else {
        avatar.textContent = user.avatar || user.username.charAt(0).toUpperCase();
    }
    
    // Set banner
    if (user.banner && (user.banner.startsWith('http') || user.banner.startsWith('/uploads'))) {
        banner.style.backgroundImage = `url(${user.banner})`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
    } else {
        banner.style.backgroundImage = '';
        banner.style.background = 'linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-purple-dark) 50%, var(--secondary-purple) 100%)';
    }
    
    // Set user info with verified badge
    username.innerHTML = user.username;
    
    // Добавляем галочку если есть verified или team badge
    if (user.badges && Array.isArray(user.badges)) {
        if (user.badges.includes('verified') || user.badges.includes('team')) {
            username.innerHTML += '<span class="verified-badge" title="Официальный аккаунт"></span>';
        }
    }
    
    userTag.textContent = `#${user.id.toString().padStart(4, '0')}`;
    bio.textContent = user.bio || 'Нет информации';
    
    // Format joined date
    if (user.created_at) {
        const date = new Date(user.created_at);
        const months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
        joined.textContent = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } else {
        joined.textContent = 'Неизвестно';
    }
    
    // Set status
    statusIndicator.className = 'status-indicator';
    const statusClass = {
        'online': 'status-online',
        'Online': 'status-online',
        'idle': 'status-idle',
        'dnd': 'status-dnd',
        'offline': 'status-offline',
        'Offline': 'status-offline'
    }[user.status || 'offline'];
    statusIndicator.classList.add(statusClass);
    
    // Display badges
    if (user.badges && typeof displayUserBadges === 'function') {
        displayUserBadges(user.badges, badgesContainer);
    }
    
    modal.classList.remove('hidden');
}

// ============================================
// SETTINGS PANEL
// ============================================

function initializeSettingsPanel() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsCloseBtn = document.getElementById('settingsCloseBtn');
    const notificationsToggle = document.getElementById('notificationsToggle');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('open');
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
            showCustomNotification('info', 'Уведомления', enabled ? 'Включены' : 'Выключены');
        });
    }
    
    // Theme selector
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            themeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            const theme = option.getAttribute('data-theme');
            showCustomNotification('info', 'Тема', `Тема "${theme}" будет доступна в следующей версии`);
        });
    });
}

// ============================================
// PROFILE MODAL
// ============================================

function initializeProfileModal() {
    const profileModal = document.getElementById('profileModal');
    const profileCloseBtn = document.getElementById('profileCloseBtn');
    const profileSaveBtn = document.getElementById('profileSaveBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const profileBannerUpload = document.getElementById('profileBannerUpload');
    const bannerUploadBtnEdit = document.getElementById('bannerUploadBtnEdit');
    
    if (profileCloseBtn) {
        profileCloseBtn.addEventListener('click', () => {
            profileModal.classList.add('hidden');
        });
    }
    
    if (profileAvatarLarge) {
        profileAvatarLarge.addEventListener('click', () => {
            avatarUpload.click();
        });
    }
    
    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadAvatar(file);
            }
        });
    }
    
    if (bannerUploadBtnEdit) {
        bannerUploadBtnEdit.addEventListener('click', () => {
            profileBannerUpload.click();
        });
    }
    
    if (profileBannerUpload) {
        profileBannerUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadBannerProfile(file);
            }
        });
    }
    
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', saveProfile);
    }
}

async function uploadAvatar(file) {
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        
        // Update avatar display in profile modal
        const profileAvatarLarge = document.getElementById('profileAvatarLarge');
        if (profileAvatarLarge) {
            profileAvatarLarge.innerHTML = `<img src="${data.avatar}" alt="Avatar"><div class="avatar-upload-overlay">Нажмите для загрузки</div>`;
        }
        
        // Update avatar in user panel
        const userAvatar = document.querySelector('.user-panel .user-avatar');
        if (userAvatar) {
            if (data.avatar.startsWith('http')) {
                userAvatar.innerHTML = `<img src="${data.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                userAvatar.textContent = data.avatar;
            }
        }
        
        // Update avatar in profile bubble
        const bubbleAvatar = document.querySelector('.profile-bubble-avatar');
        if (bubbleAvatar) {
            if (data.avatar.startsWith('http')) {
                bubbleAvatar.innerHTML = `<img src="${data.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                bubbleAvatar.textContent = data.avatar;
            }
        }
        
        // Update current user object
        if (currentUser) {
            currentUser.avatar = data.avatar;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        showCustomNotification('success', 'Аватар обновлен', 'Ваш аватар успешно изменен');
        
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось загрузить аватар');
    }
}

async function saveProfile() {
    const username = document.getElementById('profileUsername').value;
    const email = document.getElementById('profileEmail').value;
    const bio = document.getElementById('profileBio').value;
    
    if (!username || !email) {
        showCustomNotification('warning', 'Внимание', 'Имя пользователя и email обязательны');
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, bio })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Save failed');
        }
        
        const data = await response.json();
        currentUser = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        // Update username in UI
        const usernameEl = document.querySelector('.user-panel .username');
        if (usernameEl) usernameEl.textContent = data.username;
        
        updateUserInfo();
        loadUserProfileBubble();
        
        document.getElementById('profileModal').classList.add('hidden');
        showCustomNotification('success', 'Профиль сохранен', 'Ваши изменения успешно сохранены');
        
    } catch (error) {
        console.error('Error saving profile:', error);
        showCustomNotification('error', 'Ошибка', error.message || 'Не удалось сохранить профиль');
    }
}

function loadProfileData() {
    if (!currentUser) return;
    
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const profileBannerPreview = document.getElementById('profileBannerPreview');
    
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
    
    if (profileBannerPreview && currentUser.banner) {
        if (currentUser.banner.startsWith('http') || currentUser.banner.startsWith('/uploads')) {
            profileBannerPreview.style.backgroundImage = `url(${currentUser.banner})`;
        }
    }
}

async function uploadBannerProfile(file) {
    try {
        const formData = new FormData();
        formData.append('banner', file);
        
        const response = await fetch('/api/user/banner', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        
        // Update banner preview
        const profileBannerPreview = document.getElementById('profileBannerPreview');
        if (profileBannerPreview) {
            profileBannerPreview.style.backgroundImage = `url(${data.banner})`;
        }
        
        // Update current user object
        if (currentUser) {
            currentUser.banner = data.banner;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        showCustomNotification('success', 'Баннер обновлен', 'Ваш баннер успешно изменен');
        
    } catch (error) {
        console.error('Error uploading banner:', error);
        showCustomNotification('error', 'Ошибка', 'Не удалось загрузить баннер');
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Add to main initialization
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        initializeUserProfileBubble();
        initializeVoiceMessages();
        initializeVideoCircles();
        initializeTelegramGroups();
        initializeSettingsPanel();
        initializeProfileModal();
        initializeDMCallButtons();
        initializeUserProfileView();
        
        // Load profile data when opening modal
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                loadProfileData();
            });
        }
        
        // Show welcome notification
        setTimeout(() => {
            showCustomNotification('success', 'Добро пожаловать!', 'Современный интерфейс загружен');
        }, 1000);
    }, 500);
});

// Helper function
function getChannelIdByName(channelName) {
    return channelName === 'general' ? 1 : 2;
}
