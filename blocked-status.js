// Обработка статуса и внешнего вида заблокированных пользователей
(function() {
    'use strict';
    
    // Скрыть аватар и баннер заблокировавшего
    window.hideBlockedUserMedia = function(userId) {
        // Скрыть в профиле
        const profileModal = document.getElementById('userProfileViewModal');
        if (profileModal && profileModal.getAttribute('data-user-id') == userId) {
            const avatar = document.getElementById('viewUserAvatar');
            const banner = document.getElementById('viewUserBanner');
            
            if (avatar) {
                avatar.innerHTML = '<div class="blocked-placeholder">🚫</div>';
                avatar.style.background = '#72767d';
            }
            
            if (banner) {
                banner.style.background = '#72767d';
                banner.innerHTML = '';
            }
        }
        
        // Скрыть в списке ЛС
        const dmElement = document.querySelector(`[data-dm-id="${userId}"]`);
        if (dmElement) {
            const avatarEl = dmElement.querySelector('.friend-avatar');
            if (avatarEl) {
                avatarEl.innerHTML = '🚫';
                avatarEl.style.background = '#72767d';
            }
        }
        
        // Скрыть в сообщениях
        const messages = document.querySelectorAll(`[data-user-id="${userId}"]`);
        messages.forEach(msg => {
            const avatar = msg.querySelector('.message-avatar');
            if (avatar) {
                avatar.innerHTML = '🚫';
                avatar.style.background = '#72767d';
            }
        });
    };
    
    // Установить статус "был давно"
    window.setBlockedStatus = function(userId) {
        // В списке друзей
        const friendItems = document.querySelectorAll(`.friend-item[data-user-id="${userId}"]`);
        friendItems.forEach(item => {
            const statusEl = item.querySelector('.friend-status');
            const indicator = item.querySelector('.status-indicator');
            
            if (statusEl) {
                statusEl.textContent = 'Был давно';
                statusEl.classList.add('status-long-ago');
            }
            
            if (indicator) {
                indicator.classList.remove('status-online');
                indicator.classList.add('blocked');
            }
        });
        
        // В профиле
        const profileModal = document.getElementById('userProfileViewModal');
        if (profileModal && profileModal.getAttribute('data-user-id') == userId) {
            const statusEl = document.getElementById('viewUserStatus');
            const indicator = profileModal.querySelector('.status-indicator');
            
            if (statusEl) {
                statusEl.textContent = 'Был давно';
                statusEl.classList.add('status-long-ago');
            }
            
            if (indicator) {
                indicator.classList.remove('status-online');
                indicator.classList.add('blocked');
            }
        }
    };
    
    // Проверить и применить блокировку при открытии профиля
    window.checkAndApplyBlockedStatus = async function(userId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/check-blocked/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.isBlocked) {
                    window.hideBlockedUserMedia(userId);
                    window.setBlockedStatus(userId);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error checking blocked status:', error);
            return false;
        }
    };
    
    console.log('🚫 Blocked status handler initialized');
})();
