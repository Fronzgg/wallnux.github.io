// Автоматическое обновление версии для cache-busting
const fs = require('fs');
const path = require('path');

const version = Date.now();
const indexPath = path.join(__dirname, 'index.html');

console.log('🔄 Обновление версии файлов...');
console.log('📅 Новая версия:', version);

try {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Заменить все версии на новую
    html = html.replace(/\?v=\d+/g, `?v=${version}`);
    
    fs.writeFileSync(indexPath, html);
    
    console.log('✅ Версия обновлена в index.html');
    console.log('💡 Теперь браузер загрузит новые файлы');
} catch (error) {
    console.error('❌ Ошибка:', error.message);
}
