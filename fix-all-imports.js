// Скрипт для замены bcrypt на bcryptjs и sqlite3 на better-sqlite3 во всех файлах
const fs = require('fs');
const path = require('path');

const filesToFix = [
    'create-user.js',
    'create-admin-user.js',
    'create-devwallnux.js',
    'reset-password.js',
    'reset-user-password.js',
    'database.js'
];

console.log('🔧 Исправление импортов...\n');

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Файл не найден: ${file}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Замена bcrypt на bcryptjs
    if (content.includes("require('bcrypt')")) {
        content = content.replace(/require\('bcrypt'\)/g, "require('bcryptjs')");
        changed = true;
        console.log(`✅ ${file}: bcrypt → bcryptjs`);
    }
    
    // Замена sqlite3 на better-sqlite3
    if (content.includes("require('sqlite3')")) {
        content = content.replace(/require\('sqlite3'\)\.verbose\(\)/g, "require('better-sqlite3')");
        changed = true;
        console.log(`✅ ${file}: sqlite3 → better-sqlite3`);
    }
    
    // Замена database на database-new
    if (content.includes("require('./database')")) {
        content = content.replace(/require\('\.\/database'\)/g, "require('./database-new')");
        changed = true;
        console.log(`✅ ${file}: database → database-new`);
    }
    
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
    } else {
        console.log(`ℹ️  ${file}: без изменений`);
    }
});

console.log('\n✅ Готово! Все импорты обновлены.');
console.log('\n📝 Примечание: Некоторые файлы могут требовать дополнительных изменений');
console.log('   из-за разницы в API между sqlite3 и better-sqlite3');
