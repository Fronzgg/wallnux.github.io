const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const db = new sqlite3.Database('discord_clone.db');

console.log('=================================');
console.log('   СМЕНА ПАРОЛЯ ПОЛЬЗОВАТЕЛЯ');
console.log('=================================\n');

// Показать всех пользователей
db.all('SELECT id, username, email FROM users', (err, users) => {
    if (err) {
        console.error('Ошибка:', err);
        process.exit(1);
    }
    
    console.log('Доступные пользователи:\n');
    users.forEach(user => {
        console.log(`ID: ${user.id} | Username: ${user.username} | Email: ${user.email}`);
    });
    
    console.log('\n');
    
    rl.question('Введите ID или username пользователя: ', (identifier) => {
        rl.question('Введите новый пароль: ', (newPassword) => {
            
            if (!newPassword || newPassword.length < 3) {
                console.log('\n❌ Пароль должен быть минимум 3 символа!');
                rl.close();
                db.close();
                return;
            }
            
            // Хэшируем новый пароль
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            
            // Определяем это ID или username
            const isId = !isNaN(identifier);
            const query = isId 
                ? 'UPDATE users SET password = ? WHERE id = ?' 
                : 'UPDATE users SET password = ? WHERE username = ?';
            
            db.run(query, [hashedPassword, identifier], function(err) {
                if (err) {
                    console.log('\n❌ Ошибка при обновлении:', err.message);
                } else if (this.changes === 0) {
                    console.log('\n❌ Пользователь не найден!');
                } else {
                    console.log('\n✅ Пароль успешно изменен!');
                    console.log(`Новый пароль: ${newPassword}`);
                }
                
                rl.close();
                db.close();
            });
        });
    });
});
