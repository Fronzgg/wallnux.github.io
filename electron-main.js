const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let serverProcess;
const SERVER_PORT = 3000;

// Запуск Node.js сервера
function startServer() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Запуск сервера...');
        
        // Определяем правильный путь к server.js (ASAR отключен)
        const serverPath = app.isPackaged 
            ? path.join(process.resourcesPath, 'app', 'server.js')
            : path.join(__dirname, 'server.js');
        
        const workingDir = app.isPackaged
            ? path.join(process.resourcesPath, 'app')
            : __dirname;
        
        console.log('📁 App packaged:', app.isPackaged);
        console.log('📁 Server path:', serverPath);
        console.log('📁 Working dir:', workingDir);
        console.log('📁 __dirname:', __dirname);
        console.log('📁 process.resourcesPath:', process.resourcesPath);
        
        // Проверяем существование файла
        const fs = require('fs');
        if (!fs.existsSync(serverPath)) {
            console.error('❌ server.js не найден по пути:', serverPath);
            // Пробуем альтернативные пути
            const altPath1 = path.join(__dirname, 'server.js');
            const altPath2 = path.join(process.cwd(), 'server.js');
            console.log('Проверяем альтернативные пути:');
            console.log('  1:', altPath1, fs.existsSync(altPath1) ? '✅' : '❌');
            console.log('  2:', altPath2, fs.existsSync(altPath2) ? '✅' : '❌');
        }
        
        // Используем node из Electron с правильным флагом
        const nodeArgs = [serverPath];
        
        serverProcess = spawn(process.execPath, nodeArgs, {
            cwd: workingDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                NODE_ENV: 'production',
                ELECTRON_RUN_AS_NODE: '1'
            }
        });

        let serverStarted = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[SERVER] ${output}`);
            if (!serverStarted && (output.includes('Server running') || output.includes('listening') || output.includes('3000'))) {
                console.log('✅ Сервер запущен!');
                serverStarted = true;
                resolve();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            const output = data.toString();
            console.error(`[SERVER ERROR] ${output}`);
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Ошибка запуска сервера:', error);
            reject(error);
        });

        serverProcess.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.error(`❌ Сервер завершился с кодом ${code}`);
            }
        });

        // Увеличенный таймаут для первого запуска
        setTimeout(() => {
            console.log('⏰ Таймаут ожидания сервера, продолжаем...');
            resolve();
        }, 5000);
    });
}

// Создание трея
function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Показать',
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        {
            label: 'Скрыть',
            click: () => mainWindow.hide()
        },
        { type: 'separator' },
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
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Создание главного окна
async function createWindow() {
    // Сначала запускаем сервер
    try {
        await startServer();
    } catch (error) {
        console.error('Не удалось запустить сервер:', error);
    }

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'electron-preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        frame: true,
        titleBarStyle: 'default',
        backgroundColor: '#36393f',
        show: false,
        autoHideMenuBar: true
    });

    // Показываем окно когда оно готово
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Загружаем приложение
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}/login.html`);

    // DevTools для отладки (можно убрать потом)
    mainWindow.webContents.openDevTools();
    
    // Логируем ошибки загрузки
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to load:', errorCode, errorDescription);
    });
    
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[RENDERER] ${message}`);
    });

    // Открываем внешние ссылки в браузере
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Сворачивание в трей
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Создаем трей
    createTray();
}

// IPC обработчики
ipcMain.handle('show-notification', async (event, { title, body }) => {
    const { Notification } = require('electron');
    if (Notification.isSupported()) {
        new Notification({
            title,
            body,
            icon: path.join(__dirname, 'assets', 'icon.png')
        }).show();
    }
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

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

// Завершение сервера при выходе
app.on('quit', () => {
    if (serverProcess) {
        console.log('🛑 Остановка сервера...');
        serverProcess.kill();
    }
});