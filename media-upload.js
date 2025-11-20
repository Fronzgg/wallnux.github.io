// Загрузка фото/видео (как в Telegram)
(function() {
    const mediaBtn = document.getElementById('mediaBtn');
    const mediaInput = document.getElementById('mediaInput');
    
    if (!mediaBtn || !mediaInput) return;
    
    let selectedFiles = [];
    
    // Клик на кнопку → открыть выбор файлов
    mediaBtn.addEventListener('click', () => {
        mediaInput.click();
    });
    
    // Выбраны файлы → показать превью
    mediaInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        console.log('📸 Выбрано файлов:', files.length);
        selectedFiles = files;
        
        // Показать модальное окно с превью
        showMediaPreview(files);
        
        // Очистить input
        mediaInput.value = '';
    });
    
    function showMediaPreview(files) {
        // Создать модальное окно
        const modal = document.createElement('div');
        modal.className = 'media-preview-modal';
        modal.id = 'mediaPreviewModal';
        
        let previewHTML = '';
        files.forEach((file, index) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const url = URL.createObjectURL(file);
            
            if (isImage) {
                previewHTML += `
                    <div class="media-preview-item" data-index="${index}">
                        <img src="${url}" alt="${file.name}">
                    </div>
                `;
            } else if (isVideo) {
                previewHTML += `
                    <div class="media-preview-item" data-index="${index}">
                        <video src="${url}" controls></video>
                    </div>
                `;
            }
        });
        
        modal.innerHTML = `
            <div class="media-preview-overlay"></div>
            <div class="media-preview-content">
                <button class="media-preview-close">✕</button>
                <div class="media-preview-gallery">
                    ${previewHTML}
                </div>
                <div class="media-preview-footer">
                    <input type="text" class="media-caption-input" placeholder="Добавить подпись..." maxlength="200">
                    <button class="media-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                        Отправить
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики
        modal.querySelector('.media-preview-close').addEventListener('click', closePreview);
        modal.querySelector('.media-preview-overlay').addEventListener('click', closePreview);
        modal.querySelector('.media-send-btn').addEventListener('click', sendMedia);
        
        // Enter для отправки
        modal.querySelector('.media-caption-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMedia();
        });
        
        // Фокус на поле ввода
        setTimeout(() => {
            modal.querySelector('.media-caption-input').focus();
        }, 100);
    }
    
    function closePreview() {
        const modal = document.getElementById('mediaPreviewModal');
        if (modal) {
            // Освободить URL объектов
            modal.querySelectorAll('img, video').forEach(el => {
                URL.revokeObjectURL(el.src);
            });
            modal.remove();
        }
        selectedFiles = [];
    }
    
    async function sendMedia() {
        const modal = document.getElementById('mediaPreviewModal');
        if (!modal) return;
        
        const caption = modal.querySelector('.media-caption-input').value.trim();
        
        // Показать индикатор загрузки
        const sendBtn = modal.querySelector('.media-send-btn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="spinner"></div> Отправка...';
        
        try {
            for (const file of selectedFiles) {
                await uploadAndSendMedia(file, caption);
            }
            
            closePreview();
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
            sendBtn.disabled = false;
            sendBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                Отправить
            `;
            alert('Ошибка отправки файлов');
        }
    }
    
    async function uploadAndSendMedia(file, caption = '') {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        // Создать временное сообщение с индикатором загрузки
        const tempMessageId = 'temp-' + Date.now();
        const tempMessage = {
            id: tempMessageId,
            userId: window.currentUser?.id,
            author: window.currentUser?.username || 'You',
            avatar: window.currentUser?.avatar,
            text: caption || file.name,
            type: isImage ? 'image' : isVideo ? 'video' : 'file',
            fileUrl: URL.createObjectURL(file),
            timestamp: new Date(),
            uploading: true
        };
        
        // Добавить временное сообщение в UI
        if (typeof window.addMessageToUI === 'function') {
            window.addMessageToUI(tempMessage);
            
            // Добавить оверлей загрузки
            setTimeout(() => {
                const messageEl = document.querySelector(`[data-message-id="${tempMessageId}"]`);
                if (messageEl) {
                    const overlay = document.createElement('div');
                    overlay.className = 'upload-progress-overlay';
                    overlay.innerHTML = '<div class="upload-spinner"></div>';
                    
                    const mediaContainer = messageEl.querySelector('.message-image-container, .message-video-container');
                    if (mediaContainer) {
                        mediaContainer.style.position = 'relative';
                        mediaContainer.appendChild(overlay);
                    }
                }
            }, 100);
        }
        
        // Загрузить файл
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        console.log('✅ Файл загружен:', data);
        
        // Удалить временное сообщение
        const tempMessageEl = document.querySelector(`[data-message-id="${tempMessageId}"]`);
        if (tempMessageEl) {
            tempMessageEl.remove();
        }
        
        // Отправить реальное сообщение
        const message = {
            type: isImage ? 'image' : isVideo ? 'video' : 'file',
            text: caption || file.name,
            fileUrl: data.url,
            fileName: data.filename,
            fileSize: data.size,
            timestamp: new Date()
        };
        
        console.log('📤 Отправка сообщения:', message);
        console.log('🔌 Socket connected:', window.socket?.connected);
        console.log('👤 Current DM user:', window.currentDMUserId);
        console.log('📺 Current channel:', window.currentChannel);
        
        // Отправить через Socket.IO
        if (window.socket && window.socket.connected) {
            if (window.currentDMUserId) {
                console.log('📨 Отправка DM...');
                window.socket.emit('send-dm', {
                    receiverId: window.currentDMUserId,
                    message: message
                });
                console.log('✅ DM отправлено');
            } else if (window.currentChannel) {
                console.log('📨 Отправка в канал...');
                window.socket.emit('send-message', {
                    channelId: window.currentChannel,
                    message: message
                });
                console.log('✅ Сообщение в канал отправлено');
            } else {
                console.error('❌ Нет активного чата или канала!');
            }
        } else {
            console.error('❌ Socket не подключен!');
        }
    }
})();

console.log('📸 Media upload initialized');
