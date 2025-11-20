const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для рендер-процесса
contextBridge.exposeInMainWorld('electronAPI', {
    // Уведомления
    showNotification: (title, body) => {
        return ipcRenderer.invoke('show-notification', { title, body });
    },
    
    // Версия приложения
    getAppVersion: () => {
        return ipcRenderer.invoke('get-app-version');
    },
    
    // Проверка что мы в Electron
    isElectron: true,
    
    // Платформа
    platform: process.platform
});
