const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Серверные файлы
const serverFiles = [
    'server.js',
    'database.js',
    'electron-main.js',
    'p2p-server.js'
];

// Более мягкие настройки для серверных файлов (чтобы не сломать функциональность)
const serverObfuscationOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
};

console.log('🔒 Обфускация серверных файлов...\n');

let successCount = 0;

serverFiles.forEach(filename => {
    try {
        const filePath = path.join(__dirname, filename);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Пропущен: ${filename} (файл не найден)`);
            return;
        }
        
        console.log(`🔄 Обфускация: ${filename}...`);
        
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, sourceCode);
        
        const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, serverObfuscationOptions);
        fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
        
        console.log(`✅ Готово: ${filename}`);
        successCount++;
        
    } catch (error) {
        console.error(`❌ Ошибка: ${filename}:`, error.message);
    }
});

console.log('\n========================================');
console.log(`✅ Обфусцировано: ${successCount} серверных файлов`);
console.log('========================================');
