const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./discord_clone.db');

const badges = ['founder', 'admin', 'developer', 'verified', 'supporter', 'early', 'nitro', 'booster'];

db.run(
    `UPDATE users SET badges = ? WHERE username = ?`,
    [JSON.stringify(badges), 'wallnux'],
    function(err) {
        if (err) {
            console.error('❌ Ошибка:', err);
        } else {
            console.log('✅ Значки выданы пользователю wallnux:');
            console.log('   👑 Основатель');
            console.log('   🛡️ Администратор');
            console.log('   💻 Разработчик');
            console.log('   ✓ Подтвержденный');
            console.log('   💎 Спонсор');
            console.log('   🌟 Ранний пользователь');
            console.log('   ⚡ Nitro');
            console.log('   🚀 Бустер');
        }
        db.close();
    }
);
