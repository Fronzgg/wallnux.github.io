// Защита от DevTools
(function() {
    'use strict';
    
    // Отключить правую кнопку мыши
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Отключить горячие клавиши
    document.addEventListener('keydown', function(e) {
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
    
    // Очистить console
    if (window.console) {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
    }
    
    console.log('🔒 DevTools protection enabled');
})();
