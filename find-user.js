// Скрипт для поиска пользователя по username
const { initializeDatabase, userDB } = require('./database');

async function findUser() {
    const username = process.argv[2];
    
    if (!username) {
        console.log('❌ Укажите username для поиска!');
        console.log('\n💡 Использование:');
        console.log('   node find-user.js <username>');
        console.log('\n📝 Пример:');
        console.log('   node find-user.js "dev fronz"');
        console.log('   node find-user.js devfronz');
        console.log('\n💡 Или проверьте всех пользователей:');
        console.log('   node check-users.js\n');
        process.exit(1);
    }
    
    console.log(`🔍 Поиск пользователя: "${username}"\n`);
    
    try {
        await initializeDatabase();
        
        // Ищем по username
        let user = await userDB.findByUsername(username);
        
        if (!user) {
            // Пробуем найти похожих пользователей
            console.log(`❌ Пользователь "${username}" не найден!\n`);
            console.log('🔍 Поиск похожих пользователей...\n');
            
            const allUsers = await userDB.getAll();
            const similar = allUsers.filter(u => 
                u.username.toLowerCase().includes(username.toLowerCase())
            );
            
            if (similar.length > 0) {
                console.log(`✅ Найдено похожих пользователей: ${similar.length}\n`);
                similar.forEach((u, i) => {
                    console.log(`${i + 1}. Username: ${u.username}`);
                    console.log(`   Email: ${u.email}`);
                    console.log(`   ID: ${u.id}\n`);
                });
            } else {
                console.log('❌ Похожих пользователей не найдено.\n');
                console.log('💡 Все пользователи в базе:');
                console.log('   node check-users.js\n');
                console.log('💡 Создать нового пользователя:');
                console.log('   node create-user.js\n');
            }
            
            process.exit(1);
        }
        
        // Пользователь найден
        console.log('✅ Пользователь найден!\n');
        console.log('=' .repeat(60));
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Avatar: ${user.avatar || 'не установлен'}`);
        console.log(`   Status: ${user.status || 'Offline'}`);
        console.log(`   Created: ${user.created_at || 'неизвестно'}`);
        console.log('=' .repeat(60));
        console.log('\n💡 Для входа используйте:');
        console.log(`   Username: ${user.username}`);
        console.log('   Password: (тот, который вы указали при регистрации)\n');
        
    } catch (error) {
        console.error('❌ Ошибка при поиске пользователя:', error);
    }
    
    process.exit(0);
}

findUser();
