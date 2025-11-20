const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./discord_clone.db');

const username = 'spydefronz7';
const email = 'spydefronz7@wallnux.com';
const password = 'password123'; // Измени на свой пароль!

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Ошибка хеширования:', err);
        db.close();
        return;
    }

    const badges = ['founder', 'admin', 'developer', 'verified', 'supporter', 'early', 'nitro', 'booster'];

    db.run(
        `INSERT INTO users (username, email, password, badges, status) VALUES (?, ?, ?, ?, ?)`,
        [username, email, hash, JSON.stringify(badges), 'online'],
        function(err) {
            if (err) {
                console.error('❌ Ошибка:', err.message);
            } else {
                console.log('✅ Пользователь spydefronz7 создан!');
                console.log('   ID:', this.lastID);
                console.log('   Email:', email);
                console.log('   Пароль:', password);
                console.log('   Значки: 👑🛡️💻✓💎🌟⚡🚀');
            }
            db.close();
        }
    );
});
