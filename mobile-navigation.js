// Мобильная навигация и адаптивность

document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    initMobileMenu();
    handleOrientationChange();
});

// Инициализация мобильной навигации
function initMobileNavigation() {
    // Создать мобильную шапку
    createMobileHeader();
    
    // Создать нижнюю навигацию
    createMobileNav();
    
    // Создать overlay
    createMobileOverlay();
    
    // Обработчики изменения размера
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
}

// Создать мобильную шапку
function createMobileHeader() {
    if (document.querySelector('.mobile-header')) return;
    
    const header = document.createElement('div');
    header.className = 'mobile-header mobile-only';
    header.innerHTML = `
        <button class="mobile-menu-btn" id="mobileMenuBtn">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
        </button>
        <div class="mobile-header-title" style="color: #fff; font-weight: 600; font-size: 16px;">
            WallNux
        </div>
        <button class="mobile-menu-btn" id="mobileSearchBtn">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
        </button>
    `;
    
    document.body.insertBefore(header, document.body.firstChild);
    
    // Обработчики
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    document.getElementById('mobileSearchBtn').addEventListener('click', openMobileSearch);
}

// Создать нижнюю навигацию
function createMobileNav() {
    if (document.querySelector('.mobile-nav')) return;
    
    const nav = document.createElement('div');
    nav.className = 'mobile-nav';
    nav.innerHTML = `
        <button class="mobile-nav-btn active" data-view="friends">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span class="mobile-nav-label">Друзья</span>
        </button>
        <button class="mobile-nav-btn" data-view="dms">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
            <span class="mobile-nav-label">Чаты</span>
        </button>
        <button class="mobile-nav-btn" data-view="servers">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span class="mobile-nav-label">Серверы</span>
        </button>
        <button class="mobile-nav-btn" data-view="profile">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span class="mobile-nav-label">Профиль</span>
        </button>
    `;
    
    document.body.appendChild(nav);
    
    // Обработчики
    const navBtns = nav.querySelectorAll('.mobile-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchMobileView(view);
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Создать overlay
function createMobileOverlay() {
    if (document.querySelector('.mobile-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.addEventListener('click', closeMobileMenu);
    
    document.body.appendChild(overlay);
}

// Переключение мобильного меню
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const channelsSidebar = document.querySelector('.channels-sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
    
    if (channelsSidebar) {
        channelsSidebar.classList.toggle('mobile-open');
    }
    
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// Закрыть мобильное меню
function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const channelsSidebar = document.querySelector('.channels-sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    
    if (channelsSidebar) {
        channelsSidebar.classList.remove('mobile-open');
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Открыть мобильный поиск
function openMobileSearch() {
    // Показать поиск
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.style.display = 'block';
        const searchInput = searchContainer.querySelector('input');
        if (searchInput) {
            searchInput.focus();
        }
    }
}

// Переключение видов на мобильном
function switchMobileView(view) {
    const friendsContainer = document.querySelector('.friends-container');
    const dmList = document.querySelector('.dm-list');
    const serversView = document.querySelector('.servers-view');
    const profileView = document.querySelector('.profile-view');
    
    // Скрыть все
    [friendsContainer, dmList, serversView, profileView].forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Показать нужный
    switch(view) {
        case 'friends':
            if (friendsContainer) friendsContainer.style.display = 'block';
            if (typeof showFriendsView === 'function') showFriendsView();
            break;
        case 'dms':
            if (dmList) dmList.style.display = 'block';
            break;
        case 'servers':
            if (serversView) serversView.style.display = 'block';
            break;
        case 'profile':
            if (typeof openProfileModal === 'function') {
                openProfileModal();
            }
            break;
    }
    
    closeMobileMenu();
}

// Обработка изменения размера
function handleResize() {
    const width = window.innerWidth;
    
    if (width > 768) {
        // Десктоп - закрыть мобильное меню
        closeMobileMenu();
    }
}

// Обработка изменения ориентации
function handleOrientationChange() {
    setTimeout(() => {
        // Пересчитать высоты
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, 100);
}

// Инициализация мобильного меню
function initMobileMenu() {
    // Свайпы для открытия/закрытия меню
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;
        
        // Свайп вправо от левого края - открыть меню
        if (touchStartX < 50 && swipeDistance > 100) {
            toggleMobileMenu();
        }
        
        // Свайп влево - закрыть меню
        if (swipeDistance < -100) {
            closeMobileMenu();
        }
    }
}

// Определение мобильного устройства
function isMobile() {
    return window.innerWidth <= 768;
}

// Экспорт функций
window.isMobile = isMobile;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

console.log('✅ Mobile Navigation загружен');
