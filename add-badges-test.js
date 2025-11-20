const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'discord_clone.db');
const db = new sqlite3.Database(dbPath);

// Добавить бейджи пользователю
function addBadges(username, badges) {
    return new Promise((resolve, reject) => {
        const badgesJson = JSON.stringify(badges);
        
        db.run(
            'UPDATE users SET badges = ? WHERE username = ?',
            [badgesJson, username],
            function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error(`Пользователь ${username} не найден`));
                } else {
                    resolve();
                }
            }
        );
    });
}

// Показать текущие бейджи пользователя
function showBadges(username) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT username, badges FROM users WHERE username = ?',
            [username],
            (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error(`Пользователь ${username} не найден`));
                } else {
                    resolve(row);
                }
            }
        );
    });
}

// Главная функция
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 Использование:');
        console.log('  node add-badges-test.js <username> [badges...]');
        console.log('');
        console.log('📌 Доступные бейджи:');
        console.log('  verified   - Официальный аккаунт (синяя галочка)');
        console.log('  team       - Команда проекта (синяя галочка)');
        console.log('  developer  - Разработчик (</>)');
        console.log('  support    - Поддержка (🎧)');
        console.log('  founder    - Основатель (👑)');
        console.log('  admin      - Администратор (🛡️)');
        console.log('  moderator  - Модератор (⚔️)');
        console.log('  supporter  - Спонсор (💎)');
        console.log('  early      - Ранний пользователь (🌟)');
        console.log('  nitro      - Nitro (⚡)');
        console.log('  booster    - Бустер (🚀)');
        console.log('');
        console.log('💡 Примеры:');
        console.log('  node add-badges-test.js devwallnux verified developer');
        console.log('  node add-badges-test.js admin team admin');
        console.log('  node add-badges-test.js user1 verified');
        db.close();
        return;
    }
    
    const username = args[0];
    const badges = args.slice(1);
    
    try {
        if (badges.length === 0) {
            // Показать текущие бейджи
            const user = await showBadges(username);
            console.log(`\n👤 Пользователь: ${user.username}`);
            
            if (user.badges) {
                const userBadges = JSON.parse(user.badges);
                console.log(`✅ Бейджи: ${userBadges.join(', ')}`);
            } else {
                console.log('❌ Нет бейджей');
            }
        } else {
            // Добавить бейджи
            await addBadges(username, badges);
            console.log(`\n✅ Бейджи добавлены пользователю ${username}:`);
            console.log(`   ${badges.join(', ')}`);
            console.log('\n💡 Перезагрузите страницу чтобы увидеть изменения');
        }
    } catch (error) {
        console.error('\n❌ Ошибка:', error.message);
    } finally {
        db.close();
    }
}

main();
