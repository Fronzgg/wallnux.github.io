const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'discord_clone.db');
const db = new sqlite3.Database(dbPath);

// Добавить бейдж support пользователю WallNux Support
db.run(
    'UPDATE users SET badges = ? WHERE username = ?',
    [JSON.stringify(['support', 'verified']), 'WallNux Support'],
    function(err) {
        if (err) {
            console.error('❌ Ошибка:', err);
        } else if (this.changes === 0) {
            console.log('❌ Пользователь "WallNux Support" не найден');
            console.log('💡 Создайте пользователя сначала');
        } else {
            console.log('✅ Бейджи добавлены пользователю WallNux Support:');
            console.log('   - support (🎧 Официальная поддержка)');
            console.log('   - verified (✓ Официальный аккаунт)');
            console.log('\n💡 Перезагрузите страницу чтобы увидеть изменения');
        }
        db.close();
    }
);
