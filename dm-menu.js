// Меню для личных сообщений (ПКМ на диалоге)
(function() {
    let currentDMMenu = null;
    
    // Добавить обработчик ПКМ к элементу диалога
    window.addDMContextMenu = function(dmElement, userData) {
        dmElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showDMMenu(e, userData);
        });
    };
    
    async function showDMMenu(event, userData) {
        // Закрыть предыдущее меню
        if (currentDMMenu) {
            currentDMMenu.remove();
        }
        
        // Проверить заблокирован ли пользователь
        const isBlocked = await checkIfBlocked(userData.id);
        
        const menu = document.createElement('div');
        menu.className = 'dm-context-menu';
        
        const blockButton = isBlocked 
            ? `<div class="menu-item" data-action="unblock">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9l10.9 10.9C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>
                <span>Разблокировать</span>
            </div>`
            : `<div class="menu-item danger" data-action="block">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg>
                <span>Заблокировать</span>
            </div>`;
        
        menu.innerHTML = `
            <div class="menu-item" data-action="delete">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                <span>Удалить чат</span>
            </div>
            ${blockButton}
        `;
        
        // Позиционирование
        menu.style.position = 'fixed';
        menu.style.top = event.clientY + 'px';
        menu.style.left = event.clientX + 'px';
        
        document.body.appendChild(menu);
        currentDMMenu = menu;
        
        // Проверить границы экрана
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = (window.innerHeight - menuRect.height - 10) + 'px';
        }
        
        // Обработчики
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handleDMAction(action, userData);
                menu.remove();
                currentDMMenu = null;
            });
        });
        
        // Закрыть при клике вне меню
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }
    
    function closeMenu() {
        if (currentDMMenu) {
            currentDMMenu.remove();
            currentDMMenu = null;
        }
        document.removeEventListener('click', closeMenu);
    }
    
    async function checkIfBlocked(userId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/blocked', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const blocked = await response.json();
                return blocked.some(u => u.id === userId);
            }
            return false;
        } catch (error) {
            console.error('Error checking block status:', error);
            return false;
        }
    }
    
    function handleDMAction(action, userData) {
        console.log('📋 DM Action:', action, userData);
        
        switch(action) {
            case 'delete':
                deleteChat(userData);
                break;
            case 'block':
                blockUser(userData);
                break;
            case 'unblock':
                unblockUser(userData);
                break;
        }
    }
    
    async function deleteChat(userData) {
        if (!confirm(`Удалить чат с ${userData.username}?\n\nВсе сообщения будут удалены.`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/dm/delete/${userData.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Удалить из UI
                const dmElement = document.querySelector(`[data-dm-id="${userData.id}"]`);
                if (dmElement) {
                    dmElement.remove();
                }
                
                // Если это текущий чат - закрыть
                if (window.currentDMUserId === userData.id) {
                    if (typeof showFriendsView === 'function') {
                        showFriendsView();
                    }
                }
                
                alert('Чат удален');
            } else {
                alert('Ошибка удаления чата');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Ошибка удаления чата');
        }
    }
    
    async function blockUser(userData) {
        if (!confirm(`Заблокировать ${userData.username}?\n\n• Пользователь не сможет вам писать\n• Его сообщения не будут доходить\n• Вы не увидите его статус`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/block', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userData.id })
            });
            
            if (response.ok) {
                // Обновить UI
                const dmElement = document.querySelector(`[data-dm-id="${userData.id}"]`);
                if (dmElement) {
                    dmElement.classList.add('blocked-user');
                }
                
                // Применить статус и скрыть медиа
                if (typeof window.hideBlockedUserMedia === 'function') {
                    window.hideBlockedUserMedia(userData.id);
                }
                if (typeof window.setBlockedStatus === 'function') {
                    window.setBlockedStatus(userData.id);
                }
                
                alert(`${userData.username} заблокирован`);
            } else {
                alert('Ошибка блокировки');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Ошибка блокировки');
        }
    }
    
    async function unblockUser(userData) {
        if (!confirm(`Разблокировать ${userData.username}?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/unblock', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userData.id })
            });
            
            if (response.ok) {
                // Обновить UI
                const dmElement = document.querySelector(`[data-dm-id="${userData.id}"]`);
                if (dmElement) {
                    dmElement.classList.remove('blocked-user');
                }
                
                alert(`${userData.username} разблокирован`);
            } else {
                alert('Ошибка разблокировки');
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
            alert('Ошибка разблокировки');
        }
    }
    
    console.log('📋 DM menu initialized');
})();
