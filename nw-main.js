// NW.js Main Process - Запуск Node.js сервера
const { spawn } = require('child_process');
const http = require('http');

let serverProcess;
const SERVER_PORT = 3000;

console.log('🚀 Запуск WallNux Messenger...');

// Обновление статуса в UI
function updateStatus(message) {
    if (typeof document !== 'undefined') {
        const statusEl = document.querySelector('.loader p');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
}

// Проверка доступности сервера
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${SERVER_PORT}`, (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.setTimeout(1000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Ожидание запуска сервера
async function waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        updateStatus(`Запуск сервера... (${i + 1}/${maxAttempts})`);
        
        const isReady = await checkServer();
        if (isReady) {
            console.log('✅ Сервер готов!');
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
}

// Запуск Node.js сервера
function startServer() {
    console.log('📡 Запуск сервера...');
    updateStatus('Запуск сервера...');
    
    serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`[SERVER] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data}`);
    });

    serverProcess.on('error', (error) => {
        console.error('❌ Ошибка запуска сервера:', error);
        updateStatus('Ошибка запуска сервера!');
    });

    serverProcess.on('close', (code) => {
        console.log(`🛑 Сервер остановлен с кодом ${code}`);
    });
}

// Главная функция
async function main() {
    // Запускаем сервер
    startServer();
    
    // Ждем пока сервер запустится
    const serverReady = await waitForServer();
    
    if (serverReady) {
        console.log('✅ Сервер запущен, загружаем приложение...');
        updateStatus('Загрузка приложения...');
        
        setTimeout(() => {
            window.location = `http://localhost:${SERVER_PORT}/login.html`;
        }, 500);
    } else {
        console.error('❌ Сервер не запустился');
        updateStatus('Ошибка: Сервер не запустился. Закройте и попробуйте снова.');
    }
}

// Запускаем
main();

// Получаем текущее окно
nw.Window.get().on('close', function() {
    console.log('🛑 Закрытие приложения...');
    if (serverProcess) {
        serverProcess.kill();
    }
    this.close(true);
});

// Обработка выхода
process.on('exit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

process.on('SIGINT', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    process.exit();
});
