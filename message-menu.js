// Меню сообщений (3 точки + правая кнопка мыши)
(function() {
    let currentMessageMenu = null;
    
    // Добавить кнопку меню к сообщению
    window.addMessageMenu = function(messageElement, messageData) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'message-menu-btn';
        menuBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
        menuBtn.title = 'Меню';
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showMessageMenu(e, messageData);
        });
        
        return menuBtn;
    };
    
    // Показать контекстное меню по правой кнопке мыши
    window.showMessageContextMenu = function(event, messageData) {
        event.preventDefault();
        showMessageMenu(event, messageData);
    };
    
    function showMessageMenu(event, messageData) {
        // Закрыть предыдущее меню
        if (currentMessageMenu) {
            currentMessageMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'message-context-menu';
        
        // Дебаг для проверки
        console.log('🔍 Message userId:', messageData.userId, 'type:', typeof messageData.userId);
        console.log('🔍 Current user id:', window.currentUser?.id, 'type:', typeof window.currentUser?.id);
        
        // Проверка с приведением типов
        const isOwnMessage = String(messageData.userId) === String(window.currentUser?.id);
        console.log('🔍 Is own message:', isOwnMessage);
        
        let menuHTML = `
            <div class="menu-item" data-action="react">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM15.5 8C16.328 8 17 8.672 17 9.5C17 10.328 16.328 11 15.5 11C14.672 11 14 10.328 14 9.5C14 8.672 14.672 8 15.5 8ZM8.5 8C9.328 8 10 8.672 10 9.5C10 10.328 9.328 11 8.5 11C7.672 11 7 10.328 7 9.5C7 8.672 7.672 8 8.5 8ZM12 17.5C9.656 17.5 7.586 16.019 6.673 13.852C6.594 13.643 6.673 13.407 6.852 13.266C7.031 13.125 7.281 13.117 7.469 13.242C8.766 14.109 10.352 14.5 12 14.5C13.648 14.5 15.234 14.109 16.531 13.242C16.719 13.117 16.969 13.125 17.148 13.266C17.327 13.407 17.406 13.643 17.327 13.852C16.414 16.019 14.344 17.5 12 17.5Z"/></svg>
                <span>Добавить реакцию</span>
            </div>
        `;
        
        if (isOwnMessage) {
            console.log('✅ Adding edit/delete buttons');
            menuHTML += `
                <div class="menu-item" data-action="edit">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    <span>Редактировать</span>
                </div>
                <div class="menu-item danger" data-action="delete">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    <span>Удалить</span>
                </div>
            `;
        } else {
            console.log('❌ Not own message, skipping edit/delete buttons');
        }
        
        menu.innerHTML = menuHTML;
        
        // Позиционирование относительно курсора или кнопки
        menu.style.position = 'fixed';
        
        if (event.clientX && event.clientY) {
            // Правая кнопка мыши - позиция курсора
            menu.style.top = event.clientY + 'px';
            menu.style.left = event.clientX + 'px';
        } else if (event.target) {
            // Кнопка меню - позиция кнопки
            const rect = event.target.getBoundingClientRect();
            menu.style.top = rect.bottom + 5 + 'px';
            menu.style.left = rect.left - 150 + 'px';
        }
        
        document.body.appendChild(menu);
        currentMessageMenu = menu;
        
        // Проверить, не выходит ли меню за границы экрана
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
                handleMenuAction(action, messageData);
                menu.remove();
                currentMessageMenu = null;
            });
        });
        
        // Закрыть при клике вне меню
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }
    
    function closeMenu() {
        if (currentMessageMenu) {
            currentMessageMenu.remove();
            currentMessageMenu = null;
        }
        document.removeEventListener('click', closeMenu);
    }
    
    function handleMenuAction(action, messageData) {
        console.log('📋 Действие:', action, messageData);
        
        switch(action) {
            case 'react':
                showReactionPicker(messageData);
                break;
            case 'edit':
                startEditMessage(messageData);
                break;
            case 'delete':
                deleteMessage(messageData);
                break;
        }
    }
    
    function showReactionPicker(messageData) {
        const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];
        const picker = document.createElement('div');
        picker.className = 'reaction-picker';
        picker.innerHTML = reactions.map(emoji => 
            `<button class="reaction-emoji" data-emoji="${emoji}">${emoji}</button>`
        ).join('');
        
        document.body.appendChild(picker);
        
        picker.querySelectorAll('.reaction-emoji').forEach(btn => {
            btn.addEventListener('click', () => {
                addReaction(messageData.id, btn.dataset.emoji);
                picker.remove();
            });
        });
        
        setTimeout(() => {
            document.addEventListener('click', () => picker.remove(), { once: true });
        }, 0);
    }
    
    function addReaction(messageId, emoji) {
        if (window.socket && window.socket.connected) {
            window.socket.emit('add-reaction', {
                messageId: messageId,
                emoji: emoji
            });
        }
    }
    
    function startEditMessage(messageData) {
        const input = document.getElementById('messageInput');
        if (!input) return;
        
        input.value = messageData.text || '';
        input.focus();
        input.dataset.editingMessageId = messageData.id;
        
        // Показать индикатор редактирования
        showEditIndicator(messageData);
    }
    
    function showEditIndicator(messageData) {
        let indicator = document.getElementById('editIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'editIndicator';
            indicator.className = 'edit-indicator';
            
            const container = document.querySelector('.message-input-container');
            container.insertBefore(indicator, container.firstChild);
        }
        
        indicator.innerHTML = `
            <div class="edit-indicator-content">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
                <span>Редактирование сообщения</span>
                <button class="cancel-edit-btn">Отмена</button>
            </div>
        `;
        
        indicator.querySelector('.cancel-edit-btn').addEventListener('click', cancelEdit);
    }
    
    function cancelEdit() {
        const input = document.getElementById('messageInput');
        if (input) {
            input.value = '';
            delete input.dataset.editingMessageId;
        }
        
        const indicator = document.getElementById('editIndicator');
        if (indicator) indicator.remove();
    }
    
    // Обработчики Socket.IO событий перенесены в script.js
    // чтобы они регистрировались после создания socket
    
    function deleteMessage(messageData) {
        if (!confirm('Удалить сообщение?')) return;
        
        if (window.socket && window.socket.connected) {
            window.socket.emit('delete-message', {
                messageId: messageData.id,
                channelId: window.currentChannel || null,
                dmUserId: window.currentDMUserId || null
            });
        }
    }
    
    console.log('📋 Message menu initialized');
})();
