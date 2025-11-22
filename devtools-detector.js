// Защита от DevTools
(function() {
    'use strict';
    
    // Секретная комбинация для отключения защиты: Ctrl+Alt+Shift+D
    let devtoolsProtectionEnabled = true;
    let secretKeySequence = [];
    const secretCode = ['Control', 'Alt', 'Shift', 'D'];
    
    document.addEventListener('keydown', function(e) {
        // Проверка секретной комбинации
        if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'D') {
            devtoolsProtectionEnabled = !devtoolsProtectionEnabled;
            
            if (!devtoolsProtectionEnabled) {
                console.clear();
                console.log('%c🔓 DevTools Protection DISABLED', 'color: #3ba55d; font-size: 20px; font-weight: bold;');
                console.log('%cВы можете использовать DevTools для тестирования', 'color: #b9bbbe; font-size: 14px;');
                console.log('%cЧтобы включить обратно: Ctrl+Alt+Shift+D', 'color: #b9bbbe; font-size: 14px;');
                
                // Показать уведомление
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #3ba55d;
                    color: white;
                    padding: 16px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    z-index: 999999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                notification.textContent = '🔓 Защита DevTools отключена';
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 3000);
            } else {
                console.clear();
                console.log('%c🔒 DevTools Protection ENABLED', 'color: #ed4245; font-size: 20px; font-weight: bold;');
                
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ed4245;
                    color: white;
                    padding: 16px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    z-index: 999999;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                notification.textContent = '🔒 Защита DevTools включена';
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 3000);
            }
            
            e.preventDefault();
            return false;
        }
    });
    
    // Отключить правую кнопку мыши (если защита включена)
    document.addEventListener('contextmenu', function(e) {
        if (devtoolsProtectionEnabled) {
            e.preventDefault();
            return false;
        }
    });
    
    // Отключить горячие клавиши (если защита включена)
    document.addEventListener('keydown', function(e) {
        if (!devtoolsProtectionEnabled) return; // Пропустить если защита отключена
        
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });
    
    // Детектор DevTools
    const devtools = {
        isOpen: false,
        orientation: null
    };
    
    const threshold = 160;
    
    const emitEvent = (isOpen, orientation) => {
        if (devtools.isOpen !== isOpen || devtools.orientation !== orientation) {
            devtools.isOpen = isOpen;
            devtools.orientation = orientation;
            
            if (isOpen) {
                // DevTools открыты - перенаправить или заблокировать
                document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;">⚠️ Доступ запрещен</h1>';
                window.location.href = 'about:blank';
            }
        }
    };
    
    setInterval(() => {
        if (!devtoolsProtectionEnabled) return; // Пропустить если защита отключена
        
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';
        
        if (!(heightThreshold && widthThreshold) && ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)) {
            emitEvent(true, orientation);
        } else {
            emitEvent(false, null);
        }
    }, 500);
    
    // Защита от debugger
    (function() {
        function detectDebugger() {
            if (!devtoolsProtectionEnabled) return; // Пропустить если защита отключена
            
            const start = new Date();
            debugger;
            const end = new Date();
            if (end - start > 100) {
                document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;">⚠️ Доступ запрещен</h1>';
                window.location.href = 'about:blank';
            }
        }
        
        setInterval(detectDebugger, 1000);
    })();
    
    // Сохранить оригинальные функции console
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
    };
    
    // Очистить console (если защита включена)
    function updateConsoleProtection() {
        if (devtoolsProtectionEnabled) {
            console.log = function() {};
            console.warn = function() {};
            console.error = function() {};
            console.info = function() {};
            console.debug = function() {};
        } else {
            console.log = originalConsole.log;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
            console.info = originalConsole.info;
            console.debug = originalConsole.debug;
        }
    }
    
    updateConsoleProtection();
    
    // Обновлять защиту консоли при изменении состояния
    setInterval(() => {
        updateConsoleProtection();
    }, 100);
    
    console.log('🔒 DevTools protection enabled');
    console.log('💡 Для отключения нажмите: Ctrl+Alt+Shift+D');
})();
