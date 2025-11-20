// Скрипт для проверки всех пользователей в базе данных
const { initializeDatabase, userDB } = require('./database');

async function checkAllUsers() {
    console.log('🔍 Проверка пользователей в базе данных...\n');
    
    try {
        // Инициализируем базу данных
        await initializeDatabase();
        
        // Получаем всех пользователей
        const users = await userDB.getAll();
        
        if (!users || users.length === 0) {
            console.log('❌ В базе данных НЕТ пользователей!\n');
            console.log('💡 Создайте нового пользователя:');
            console.log('   node create-user.js\n');
            return;
        }
        
        console.log(`✅ Найдено пользователей: ${users.length}\n`);
        console.log('=' .repeat(80));
        
        users.forEach((user, index) => {
            console.log(`\n👤 Пользователь #${index + 1}:`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Avatar: ${user.avatar || 'не установлен'}`);
            console.log(`   Status: ${user.status || 'Offline'}`);
            console.log(`   Created: ${user.created_at || 'неизвестно'}`);
            console.log('-'.repeat(80));
        });
        
        console.log('\n✅ Проверка завершена!');
        console.log('\n💡 Для входа используйте:');
        console.log('   Username: ' + users[0].username);
        console.log('   Password: (тот, который вы указали при регистрации)\n');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке пользователей:', error);
    }
    
    process.exit(0);
}

// Запускаем проверку
checkAllUsers();
