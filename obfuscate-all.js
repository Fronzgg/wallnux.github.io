const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Файлы которые нужно обфусцировать
const filesToObfuscate = [
    'script.js',
    'auth.js',
    'modern-features.js',
    'badges.js',
    'notifications.js',
    'telegram-search.js',
    'admin-features.js',
    'ban-system.js',
    'p2p-adapter.js',
    'p2p-manager.js',
    'status-system-fix.js'
];

// Настройки обфускации
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

console.log('🔒 Начинаем обфускацию файлов...\n');

let successCount = 0;
let errorCount = 0;

filesToObfuscate.forEach(filename => {
    try {
        const filePath = path.join(__dirname, filename);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Пропущен: ${filename} (файл не найден)`);
            return;
        }
        
        console.log(`🔄 Обфускация: ${filename}...`);
        
        // Читаем исходный код
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        // Создаем бэкап
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, sourceCode);
        
        // Обфусцируем
        const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions);
        
        // Сохраняем обфусцированный код
        fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
        
        console.log(`✅ Готово: ${filename}`);
        successCount++;
        
    } catch (error) {
        console.error(`❌ Ошибка при обфускации ${filename}:`, error.message);
        errorCount++;
    }
});

console.log('\n========================================');
console.log(`✅ Успешно обфусцировано: ${successCount} файлов`);
if (errorCount > 0) {
    console.log(`❌ Ошибок: ${errorCount}`);
}
console.log('========================================');
console.log('\n💡 Бэкапы сохранены с расширением .backup');
console.log('💡 Для восстановления: rename *.backup *.js');
