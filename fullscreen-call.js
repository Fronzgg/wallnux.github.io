// Полноэкранный режим для демонстрации экрана и камеры
(function() {
    'use strict';
    
    let isFullscreenMode = false;
    let fullscreenContainer = null;
    
    // Переключить в полноэкранный режим
    window.enterFullscreenCall = function(stream, type = 'screen') {
        if (isFullscreenMode) return;
        
        // Создать контейнер
        fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'fullscreen-call-container';
        fullscreenContainer.id = 'fullscreenCallContainer';
        
        // Главное видео (демонстрация/камера)
        const mainVideo = document.createElement('video');
        mainVideo.className = 'fullscreen-main-video';
        mainVideo.autoplay = true;
        mainVideo.srcObject = stream;
        
        // Мини-профиль внизу
        const miniProfile = document.createElement('div');
        miniProfile.className = 'fullscreen-mini-profile';
        miniProfile.innerHTML = `
            <div class="mini-profile-avatar">
                ${window.currentUser?.avatar || window.currentUser?.username?.charAt(0) || 'U'}
            </div>
            <div class="mini-profile-info">
                <div class="mini-profile-name">${window.currentUser?.username || 'You'}</div>
                <div class="mini-profile-status">
                    ${type === 'screen' ? '🖥️ Демонстрация экрана' : '📹 Камера'}
                </div>
            </div>
        `;
        
        // Кнопки управления
        const controls = document.createElement('div');
        controls.className = 'fullscreen-controls';
        controls.innerHTML = `
            <button class="fullscreen-control-btn" id="fsToggleMic" title="Микрофон">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </button>
            <button class="fullscreen-control-btn" id="fsToggleCamera" title="Камера">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            </button>
            <button class="fullscreen-control-btn danger" id="fsEndCall" title="Завершить">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
            </button>
            <button class="fullscreen-control-btn" id="fsExitFullscreen" title="Выйти из полноэкранного режима">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
            </button>
        `;
        
        // Собрать всё вместе
        fullscreenContainer.appendChild(mainVideo);
        fullscreenContainer.appendChild(miniProfile);
        fullscreenContainer.appendChild(controls);
        
        document.body.appendChild(fullscreenContainer);
        
        // Обработчики кнопок
        document.getElementById('fsToggleMic')?.addEventListener('click', toggleMicrophone);
        document.getElementById('fsToggleCamera')?.addEventListener('click', toggleCamera);
        document.getElementById('fsEndCall')?.addEventListener('click', endCall);
        document.getElementById('fsExitFullscreen')?.addEventListener('click', exitFullscreenCall);
        
        isFullscreenMode = true;
        
        // Скрыть обычный интерфейс звонка
        const callInterface = document.getElementById('callInterface');
        if (callInterface) {
            callInterface.style.display = 'none';
        }
        
        console.log('📺 Entered fullscreen call mode');
    };
    
    // Выйти из полноэкранного режима
    window.exitFullscreenCall = function() {
        if (!isFullscreenMode) return;
        
        if (fullscreenContainer) {
            fullscreenContainer.remove();
            fullscreenContainer = null;
        }
        
        isFullscreenMode = false;
        
        // Показать обычный интерфейс звонка
        const callInterface = document.getElementById('callInterface');
        if (callInterface) {
            callInterface.style.display = 'flex';
        }
        
        console.log('📺 Exited fullscreen call mode');
    };
    
    // Переключить микрофон
    function toggleMicrophone() {
        if (typeof window.toggleMute === 'function') {
            window.toggleMute();
        }
        
        const btn = document.getElementById('fsToggleMic');
        if (btn) {
            btn.classList.toggle('muted');
        }
    }
    
    // Переключить камеру
    function toggleCamera() {
        if (typeof window.toggleVideo === 'function') {
            window.toggleVideo();
        }
        
        const btn = document.getElementById('fsToggleCamera');
        if (btn) {
            btn.classList.toggle('disabled');
        }
    }
    
    // Завершить звонок
    function endCall() {
        window.exitFullscreenCall();
        
        if (typeof window.leaveVoiceChannel === 'function') {
            window.leaveVoiceChannel();
        }
    }
    
    console.log('📺 Fullscreen call handler initialized');
})();
