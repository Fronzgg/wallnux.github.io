// ============================================
// BAN SYSTEM - CLIENT SIDE
// ============================================

let currentBanData = null;

// Initialize ban system
function initializeBanSystem() {
    // Socket.IO listener for ban
    if (socket) {
        socket.on('user-banned', (data) => {
            console.log('🚫 User banned:', data);
            showBannedModal(data);
        });
    }
    
    // Banned modal buttons
    const bannedUnderstandBtn = document.getElementById('bannedUnderstandBtn');
    const bannedAppealBtn = document.getElementById('bannedAppealBtn');
    const bannedLogoutBtn = document.getElementById('bannedLogoutBtn');
    
    if (bannedUnderstandBtn) {
        bannedUnderstandBtn.addEventListener('click', () => {
            document.getElementById('bannedModal').classList.add('hidden');
        });
    }
    
    if (bannedAppealBtn) {
        bannedAppealBtn.addEventListener('click', () => {
            document.getElementById('bannedModal').classList.add('hidden');
            showAppealModal();
        });
    }
    
    if (bannedLogoutBtn) {
        bannedLogoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    
    // Appeal modal
    const appealCloseBtn = document.getElementById('appealCloseBtn');
    const appealCancelBtn = document.getElementById('appealCancelBtn');
    const appealSubmitBtn = document.getElementById('appealSubmitBtn');
    const appealText = document.getElementById('appealText');
    const appealCharCount = document.getElementById('appealCharCount');
    
    if (appealCloseBtn) {
        appealCloseBtn.addEventListener('click', closeAppealModal);
    }
    
    if (appealCancelBtn) {
        appealCancelBtn.addEventListener('click', closeAppealModal);
    }
    
    if (appealSubmitBtn) {
        appealSubmitBtn.addEventListener('click', submitAppeal);
    }
    
    if (appealText) {
        appealText.addEventListener('input', () => {
            appealCharCount.textContent = appealText.value.length;
        });
    }
}

// Show banned modal
function showBannedModal(data) {
    currentBanData = data;
    
    const modal = document.getElementById('bannedModal');
    const reasonEl = document.getElementById('banReason');
    
    if (reasonEl) {
        reasonEl.textContent = `Причина: ${data.reason || 'Нарушение правил сообщества'}`;
    }
    
    modal.classList.remove('hidden');
    
    // Disable all interactions
    document.body.style.pointerEvents = 'none';
    modal.style.pointerEvents = 'all';
}

// Show appeal modal
function showAppealModal() {
    const modal = document.getElementById('appealModal');
    modal.classList.remove('hidden');
    
    const appealText = document.getElementById('appealText');
    if (appealText) {
        appealText.value = '';
        appealText.focus();
    }
}

// Close appeal modal
function closeAppealModal() {
    const modal = document.getElementById('appealModal');
    modal.classList.add('hidden');
}

// Submit appeal
async function submitAppeal() {
    const appealText = document.getElementById('appealText');
    const text = appealText.value.trim();
    
    if (!text) {
        alert('Пожалуйста, введите текст апелляции');
        return;
    }
    
    if (text.length < 20) {
        alert('Апелляция должна содержать минимум 20 символов');
        return;
    }
    
    try {
        const authToken = localStorage.getItem('token');
        
        const response = await fetch('/api/ban/appeal', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ appealText: text })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit appeal');
        }
        
        alert('✅ Апелляция отправлена! Ожидайте ответа от администрации.');
        closeAppealModal();
        
    } catch (error) {
        console.error('Error submitting appeal:', error);
        alert('❌ Не удалось отправить апелляцию. Попробуйте позже.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    if (socket) socket.disconnect();
    window.location.href = 'login.html';
}

// Check if chatting with WallNux Support
function checkSupportChatBlock() {
    if (currentView === 'dm' && currentDMUserId) {
        // Check if DM is with WallNux Support (user ID 1 or 2)
        if (currentDMUserId === 1 || currentDMUserId === 2) {
            showSupportChatBlock();
            return true;
        }
    }
    return false;
}

// Show support chat block message
function showSupportChatBlock() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Вы не можете писать в этот чат';
    }
    
    if (sendBtn) {
        sendBtn.disabled = true;
    }
    
    // Add warning message
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer && !document.getElementById('supportBlockWarning')) {
        const warning = document.createElement('div');
        warning.id = 'supportBlockWarning';
        warning.className = 'support-chat-blocked';
        warning.innerHTML = `
            <div class="support-chat-blocked-icon">⚠️</div>
            <div class="support-chat-blocked-text">
                Это чат Support программы WallNux.<br>
                Вы не можете написать ему, так как он ограничил круг лиц.<br>
                Вы можете только получать сообщения от поддержки.
            </div>
        `;
        messagesContainer.appendChild(warning);
    }
}

// Remove support chat block
function removeSupportChatBlock() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendMessageBtn');
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = 'Написать сообщение...';
    }
    
    if (sendBtn) {
        sendBtn.disabled = false;
    }
    
    const warning = document.getElementById('supportBlockWarning');
    if (warning) {
        warning.remove();
    }
}

// Override startDM to check for support block
const originalStartDM = window.startDM;
window.startDM = async function(...args) {
    await originalStartDM(...args);
    
    // Check if support chat
    setTimeout(() => {
        checkSupportChatBlock();
    }, 100);
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBanSystem);
} else {
    initializeBanSystem();
}

console.log('✅ Ban system initialized');
