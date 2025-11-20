// Групповые звонки - улучшенная версия

let groupCallParticipants = new Map(); // socketId -> participant data
let groupCallStreams = new Map(); // socketId -> MediaStream
let currentGroupCall = null;
let mainStreamSocketId = null; // Кто показывается в полноэкранном режиме

// Начать групповой звонок
function startGroupCall(channelId, channelName, type = 'video') {
    console.log('🎥 Начинаем групповой звонок:', channelName);
    
    if (!socket || !socket.connected) {
        alert('Не подключен к серверу');
        return;
    }
    
    currentGroupCall = {
        channelId,
        channelName,
        type,
        roomName: `group-call-${channelId || channelName}`
    };
    
    // Отправить событие на сервер
    socket.emit('start-group-call', {
        channelId,
        channelName,
        type
    });
    
    // Присоединиться к звонку
    joinGroupCall(currentGroupCall.roomName, type);
}

// Присоединиться к групповому звонку
async function joinGroupCall(roomName, type = 'video') {
    console.log('📞 Присоединяемся к групповому звонку:', roomName, 'type:', type);
    
    if (!socket || !socket.connected) {
        console.error('❌ Socket не подключен');
        alert('Не подключен к серверу');
        return;
    }
    
    try {
        console.log('🎥 Получаем доступ к камере/микрофону...');
        
        // Получить медиа напрямую
        const constraints = {
            video: type === 'video' ? {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000
            }
        };
        
        // Используем глобальную переменную localStream
        if (!window.localStream) {
            window.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Медиа получено');
        }
        
        // Установить локальное видео
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = window.localStream;
            console.log('✅ Локальное видео установлено');
        }
        
        // Присоединиться к комнате
        console.log('📡 Отправляем join-group-call...');
        socket.emit('join-group-call', { roomName });
        
        // Установить флаги
        window.inCall = true;
        currentGroupCall = currentGroupCall || { roomName, type };
        
        console.log('✅ Флаги установлены, inCall:', window.inCall);
        
        // Запустить таймер звонка
        if (typeof window.startCallTimer === 'function') {
            window.startCallTimer();
            console.log('✅ Таймер запущен');
        }
        
        // Показать интерфейс группового звонка
        console.log('📺 Показываем интерфейс...');
        showGroupCallInterface();
        
        // Добавить себя в список участников
        console.log('➕ Добавляем себя в участники...');
        
        const user = window.currentUser || currentUser;
        if (user) {
            addGroupParticipant(socket.id, {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                socketId: socket.id,
                isLocal: true
            });
        } else {
            console.error('❌ currentUser не найден!');
        }
        
        console.log('✅ Присоединение к групповому звонку завершено');
        
        console.log('✅ Успешно присоединились к групповому звонку');
        
    } catch (error) {
        console.error('❌ Ошибка присоединения к групповому звонку:', error);
        alert('Ошибка доступа к камере/микрофону. Проверьте разрешения.');
        inCall = false;
    }
}

// Показать интерфейс группового звонка
function showGroupCallInterface() {
    console.log('📺 Показываем интерфейс группового звонка');
    
    const callInterface = document.getElementById('callInterface');
    if (!callInterface) {
        console.error('❌ callInterface не найден!');
        return;
    }
    
    console.log('📺 callInterface найден, показываем...');
    
    // Убрать класс hidden
    callInterface.classList.remove('hidden');
    
    // Принудительно показать
    callInterface.style.display = 'flex';
    callInterface.style.visibility = 'visible';
    callInterface.style.opacity = '1';
    
    console.log('📺 Стили применены');
    
    // Обновить заголовок
    const channelName = document.querySelector('.call-channel-name');
    if (channelName) {
        channelName.textContent = currentGroupCall?.channelName || 'Групповой звонок';
        console.log('📺 Заголовок обновлен:', channelName.textContent);
    }
    
    // Показать кнопку добавления участника
    if (typeof window.showAddParticipantButton === 'function') {
        window.showAddParticipantButton();
        console.log('📺 Кнопка добавления показана');
    }
    
    // Создать сетку участников
    createGroupCallGrid();
    
    console.log('✅ Интерфейс группового звонка показан');
    console.log('📺 callInterface display:', callInterface.style.display);
    console.log('📺 callInterface classList:', callInterface.classList.toString());
}

// Создать сетку участников
function createGroupCallGrid() {
    const remoteParticipants = document.getElementById('remoteParticipants');
    if (!remoteParticipants) return;
    
    remoteParticipants.innerHTML = '';
    remoteParticipants.className = 'group-call-grid';
    
    updateGroupCallGrid();
}

// Обновить сетку участников
function updateGroupCallGrid() {
    const remoteParticipants = document.getElementById('remoteParticipants');
    if (!remoteParticipants) return;
    
    const participantCount = groupCallParticipants.size;
    remoteParticipants.className = `group-call-grid participants-${Math.min(participantCount, 9)}`;
    
    // Очистить и пересоздать
    remoteParticipants.innerHTML = '';
    
    groupCallParticipants.forEach((participant, socketId) => {
        const participantEl = createGroupParticipantElement(socketId, participant);
        remoteParticipants.appendChild(participantEl);
    });
}

// Создать элемент участника
function createGroupParticipantElement(socketId, participant) {
    const div = document.createElement('div');
    div.className = 'group-participant';
    div.id = `group-participant-${socketId}`;
    div.dataset.socketId = socketId;
    
    // Видео элемент
    const video = document.createElement('video');
    video.id = `group-video-${socketId}`;
    video.autoplay = true;
    video.playsInline = true;
    
    if (participant.isLocal) {
        video.muted = true;
        video.srcObject = localStream;
    } else {
        const stream = groupCallStreams.get(socketId);
        if (stream) {
            video.srcObject = stream;
        }
    }
    
    // Placeholder если видео выключено
    const placeholder = document.createElement('div');
    placeholder.className = 'group-participant-placeholder';
    placeholder.innerHTML = `
        <div class="avatar-large">
            ${participant.avatar || participant.username?.charAt(0).toUpperCase() || '?'}
        </div>
    `;
    
    // Информация об участнике
    const info = document.createElement('div');
    info.className = 'group-participant-info';
    info.innerHTML = `
        <div class="group-participant-avatar">
            ${participant.avatar || participant.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <div class="group-participant-name">${participant.username || 'Участник'}</div>
        <div class="group-participant-status">
            ${participant.isLocal ? '<span style="color: #43b581;">Вы</span>' : ''}
        </div>
    `;
    
    div.appendChild(placeholder);
    div.appendChild(video);
    div.appendChild(info);
    
    // Клик для полноэкранного режима
    div.addEventListener('click', () => {
        enterGroupCallFullscreen(socketId);
    });
    
    // Проверить есть ли видео
    video.addEventListener('loadedmetadata', () => {
        if (video.videoWidth > 0) {
            placeholder.style.display = 'none';
        }
    });
    
    return div;
}

// Добавить участника
function addGroupParticipant(socketId, participant) {
    console.log('➕ Добавляем участника:', participant.username);
    
    groupCallParticipants.set(socketId, participant);
    
    // Создать peer connection если не локальный
    if (!participant.isLocal) {
        createPeerConnection(socketId, true);
    }
    
    updateGroupCallGrid();
    updateVoiceChannelDisplay(); // Обновить список в голосовом канале
}

// Удалить участника
function removeGroupParticipant(socketId) {
    console.log('➖ Удаляем участника:', socketId);
    
    groupCallParticipants.delete(socketId);
    groupCallStreams.delete(socketId);
    
    const participantEl = document.getElementById(`group-participant-${socketId}`);
    if (participantEl) {
        participantEl.remove();
    }
    
    updateGroupCallGrid();
    updateVoiceChannelDisplay(); // Обновить список в голосовом канале
}

// Войти в полноэкранный режим группового звонка
function enterGroupCallFullscreen(socketId) {
    console.log('🖥️ Полноэкранный режим для:', socketId);
    
    mainStreamSocketId = socketId;
    
    const participant = groupCallParticipants.get(socketId);
    if (!participant) return;
    
    // Создать полноэкранный контейнер
    const container = document.createElement('div');
    container.id = 'groupCallFullscreen';
    container.className = 'group-call-fullscreen';
    
    // Главное видео
    const mainVideo = document.createElement('div');
    mainVideo.className = 'group-call-fullscreen-main';
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    
    if (participant.isLocal) {
        video.muted = true;
        video.srcObject = localStream;
    } else {
        const stream = groupCallStreams.get(socketId);
        if (stream) {
            video.srcObject = stream;
        }
    }
    
    mainVideo.appendChild(video);
    
    // Миниатюры других участников
    const thumbnails = document.createElement('div');
    thumbnails.className = 'group-call-thumbnails';
    
    groupCallParticipants.forEach((p, sid) => {
        if (sid === socketId) return; // Пропустить текущего
        
        const thumb = createThumbnail(sid, p);
        thumbnails.appendChild(thumb);
    });
    
    // Контролы
    const controls = document.createElement('div');
    controls.className = 'group-call-fullscreen-controls';
    controls.innerHTML = `
        <button onclick="exitGroupCallFullscreen()" title="Выйти из полноэкранного режима">
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
    `;
    
    container.appendChild(mainVideo);
    container.appendChild(thumbnails);
    container.appendChild(controls);
    
    document.body.appendChild(container);
    
    // ESC для выхода
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            exitGroupCallFullscreen();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Создать миниатюру
function createThumbnail(socketId, participant) {
    const thumb = document.createElement('div');
    thumb.className = 'group-call-thumbnail';
    thumb.dataset.socketId = socketId;
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    
    if (participant.isLocal) {
        video.srcObject = localStream;
    } else {
        const stream = groupCallStreams.get(socketId);
        if (stream) {
            video.srcObject = stream;
        }
    }
    
    const name = document.createElement('div');
    name.className = 'group-call-thumbnail-name';
    name.textContent = participant.username || 'Участник';
    
    thumb.appendChild(video);
    thumb.appendChild(name);
    
    // Клик для переключения
    thumb.addEventListener('click', () => {
        exitGroupCallFullscreen();
        setTimeout(() => enterGroupCallFullscreen(socketId), 100);
    });
    
    return thumb;
}

// Выйти из полноэкранного режима
function exitGroupCallFullscreen() {
    const container = document.getElementById('groupCallFullscreen');
    if (container) {
        container.remove();
    }
    mainStreamSocketId = null;
}

// Завершить групповой звонок
function leaveGroupCall() {
    console.log('👋 Покидаем групповой звонок');
    
    if (currentGroupCall && socket && socket.connected) {
        socket.emit('leave-group-call', { roomName: currentGroupCall.roomName });
    }
    
    // Очистить участников
    groupCallParticipants.clear();
    groupCallStreams.clear();
    
    // Закрыть все peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    
    // Остановить медиа
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    currentGroupCall = null;
    inCall = false;
    
    // Закрыть полноэкранный режим
    exitGroupCallFullscreen();
    
    // Скрыть интерфейс
    const callInterface = document.getElementById('callInterface');
    if (callInterface) {
        callInterface.classList.add('hidden');
        callInterface.style.display = 'none';
    }
}

// Обработчик получения потока от участника
function handleGroupParticipantStream(socketId, stream) {
    console.log('📹 Получен поток от участника:', socketId);
    
    groupCallStreams.set(socketId, stream);
    
    // Обновить видео элемент
    const video = document.getElementById(`group-video-${socketId}`);
    if (video) {
        video.srcObject = stream;
        
        // Скрыть placeholder
        const participant = document.getElementById(`group-participant-${socketId}`);
        if (participant) {
            const placeholder = participant.querySelector('.group-participant-placeholder');
            if (placeholder && stream.getVideoTracks().length > 0) {
                placeholder.style.display = 'none';
            }
        }
    }
    
    // Если в полноэкранном режиме, обновить там тоже
    if (mainStreamSocketId === socketId) {
        const fullscreenVideo = document.querySelector('#groupCallFullscreen video');
        if (fullscreenVideo) {
            fullscreenVideo.srcObject = stream;
        }
    }
}

// Показать участников в голосовом канале
function showVoiceChannelParticipants(voiceId, participants) {
    const container = document.getElementById(`voice-participants-${voiceId}`);
    if (!container) return;
    
    if (participants.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    // Добавить участников
    participants.forEach(participant => {
        const item = document.createElement('div');
        item.className = 'voice-participant-item';
        if (participant.isLocal) {
            item.classList.add('is-you');
        }
        
        const avatarHTML = participant.avatar && (participant.avatar.startsWith('http') || participant.avatar.startsWith('/uploads'))
            ? `<img src="${participant.avatar}" alt="${participant.username}">`
            : (participant.avatar || participant.username?.charAt(0).toUpperCase() || '?');
        
        item.innerHTML = `
            <div class="voice-participant-avatar-small">${avatarHTML}</div>
            <div class="voice-participant-name">${participant.username || 'Участник'}</div>
            <div class="voice-participant-icons">
                ${participant.isLocal ? '<span style="color: #43b581; font-size: 11px;">(Вы)</span>' : ''}
            </div>
        `;
        
        container.appendChild(item);
    });
    
    // Добавить кнопку присоединения если не в звонке
    if (!inCall) {
        const joinBtn = document.createElement('button');
        joinBtn.className = 'voice-join-button';
        joinBtn.textContent = '🎤 Присоединиться';
        joinBtn.onclick = () => {
            if (currentGroupCall) {
                joinGroupCall(currentGroupCall.roomName, 'video');
            }
        };
        container.appendChild(joinBtn);
    }
}

// Обновить список участников в голосовом канале
function updateVoiceChannelDisplay() {
    if (!currentGroupCall) return;
    
    // Определить voiceId из roomName
    // Например: "group-call-1" -> "voice-1"
    const voiceId = currentGroupCall.roomName.replace('group-call-', 'voice-');
    
    // Собрать список участников
    const participants = Array.from(groupCallParticipants.values());
    
    showVoiceChannelParticipants(voiceId, participants);
}

// Сделать функции глобальными
window.startGroupCall = startGroupCall;
window.joinGroupCall = joinGroupCall;
window.leaveGroupCall = leaveGroupCall;
window.exitGroupCallFullscreen = exitGroupCallFullscreen;
window.showVoiceChannelParticipants = showVoiceChannelParticipants;
window.updateVoiceChannelDisplay = updateVoiceChannelDisplay;

console.log('✅ Модуль групповых звонков загружен');
