# 📱 Android приложение с Node.js сервером

## 🎯 Решение: nodejs-mobile + Capacitor

Это позволит запускать Node.js сервер прямо на Android устройстве!

## 📦 Установка

### Шаг 1: Установить nodejs-mobile
```bash
npm install nodejs-mobile-cordova --save
```

### Шаг 2: Установить Capacitor (уже есть)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Шаг 3: Инициализация
```bash
npx cap init
npx cap add android
```

## 🔧 Настройка

### 1. Создать папку для Node.js кода
```
nodejs-assets/
  └── nodejs-project/
      ├── main.js (точка входа для Node.js)
      ├── server.js (твой сервер)
      ├── database.js
      └── package.json
```

### 2. Создать main.js (запускает сервер)
```javascript
const path = require('path');
const server = require('./server.js');

console.log('Node.js запущен на Android!');
```

### 3. Обновить capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wallnux.messenger',
  appName: 'WallNux Messenger',
  webDir: 'www',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
```

## 🚀 Сборка

### Шаг 1: Подготовить веб-файлы
```bash
# Создать папку www
mkdir www
# Скопировать все HTML/CSS/JS
copy *.html www\
copy *.css www\
copy *.js www\
```

### Шаг 2: Синхронизировать с Android
```bash
npx cap sync android
```

### Шаг 3: Открыть в Android Studio
```bash
npx cap open android
```

### Шаг 4: Собрать APK
В Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)

## 📱 Альтернатива: Termux + Node.js

Более простой вариант без сборки APK:

### Вариант A: PWA (Progressive Web App)
```javascript
// Добавить в index.html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#5865F2">
```

Создать manifest.json:
```json
{
  "name": "WallNux Messenger",
  "short_name": "WallNux",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#36393f",
  "theme_color": "#5865F2",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Пользователь просто открывает сайт и добавляет на главный экран!

### Вариант B: Cordova (проще чем Capacitor)
```bash
npm install -g cordova
cordova create wallnux com.wallnux.messenger WallNux
cd wallnux
cordova platform add android
cordova build android
```

## 🎯 Рекомендация

Для твоего случая лучше всего:

### 1. **PWA** (самое простое)
- Не нужно собирать APK
- Работает в браузере
- Можно добавить на главный экран
- Обновляется автоматически

### 2. **Capacitor + nodejs-mobile** (полноценное приложение)
- Настоящее Android приложение
- Node.js работает локально
- Можно в Google Play

### 3. **Просто WebView** (средний вариант)
- Простое приложение
- Подключается к серверу в интернете
- Легко собрать

## 💡 Что выбрать?

| Вариант | Сложность | Node.js локально | Размер |
|---------|-----------|------------------|--------|
| PWA | ⭐ | ❌ | 0 MB |
| WebView | ⭐⭐ | ❌ | 5 MB |
| Capacitor | ⭐⭐⭐ | ✅ | 50 MB |
| Capacitor + nodejs-mobile | ⭐⭐⭐⭐ | ✅ | 80 MB |

**Для начала:** Используй PWA!
**Для полноценного:** Capacitor + nodejs-mobile

Что выбираешь?
