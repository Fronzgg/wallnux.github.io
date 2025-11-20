const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;
const SERVER_PORT = 3000;

// Простой запуск сервера через require
function startServer() {
    console.log('🚀 Запуск сервера через require...');
    
    try {
        // Определяем путь к server.js
        const serverPath = app.isPackaged 
            ? path.join(process.resourcesPath, 'app', 'server.js')
            : path.join(__dirname, 'server.js');
        
        console.log('📁 Server path:', serverPath);
        
        // Запускаем сервер напрямую
        require(serverPath);
        
        console.log('✅ Сервер запущен!');
        return Promise.resolve();
        
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        return Promise.reject(error);
    }
}

// Создание главного окна
async function createWindow() {
    // Запускаем сервер
    try {
        await startServer();
        // Ждем 3 секунды чтобы сервер точно запустился
        await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
        console.error('Не удалось запустить сервер:', error);
    }

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        backgroundColor: '#36393f',
        show: false,
        autoHideMenuBar: true
    });

    // Показываем окно когда готово
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Загружаем приложение
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}/login.html`);

    // DevTools для отладки
    mainWindow.webContents.openDevTools();
    
    // Логируем ошибки
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to load:', errorCode, errorDescription);
    });
    
    mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log(`[RENDERER] ${message}`);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Создаем трей
    createTray();
}

// Создание трея
function createTray() {
    try {
        const iconPath = path.join(__dirname, 'assets', 'icon.png');
        tray = new Tray(iconPath);
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Показать',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            {
                label: 'Выход',
                click: () => {
                    app.isQuiting = true;
                    app.quit();
                }
            }
        ]);
        
        tray.setToolTip('WallNux Messenger');
        tray.setContextMenu(contextMenu);
        
        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });
    } catch (error) {
        console.error('Ошибка создания трея:', error);
    }
}

// Запуск приложения
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

app.on('before-quit', () => {
    app.isQuiting = true;
});

console.log('Electron app starting...');
