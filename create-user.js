// Скрипт для создания нового пользователя
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { initializeDatabase, userDB } = require('./database-new');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
    console.log('=' .repeat(60));
    console.log('  👤 СОЗДАНИЕ НОВОГО ПОЛЬЗОВАТЕЛЯ');
    console.log('=' .repeat(60));
    console.log();
    
    try {
        // Инициализируем базу данных
        await initializeDatabase();
        
        // Запрашиваем данные
        const username = await question('📝 Введите username: ');
        const email = await question('📧 Введите email: ');
        const password = await question('🔒 Введите password: ');
        
        if (!username || !email || !password) {
            console.log('\n❌ Все поля обязательны!');
            rl.close();
            process.exit(1);
        }
        
        // Проверяем, существует ли пользователь
        const existingUser = await userDB.findByUsername(username);
        if (existingUser) {
            console.log(`\n❌ Пользователь с username "${username}" уже существует!`);
            console.log(`   ID: ${existingUser.id}`);
            console.log(`   Email: ${existingUser.email}`);
            rl.close();
            process.exit(1);
        }
        
        const existingEmail = await userDB.findByEmail(email);
        if (existingEmail) {
            console.log(`\n❌ Пользователь с email "${email}" уже существует!`);
            console.log(`   Username: ${existingEmail.username}`);
            rl.close();
            process.exit(1);
        }
        
        console.log('\n⏳ Создание пользователя...');
        
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создаем пользователя
        const user = await userDB.create(username, email, hashedPassword);
        
        console.log('\n✅ Пользователь успешно создан!');
        console.log('=' .repeat(60));
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log('=' .repeat(60));
        console.log('\n💡 Теперь вы можете войти с этими данными:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log('\n🌐 Откройте: http://localhost:3000/login.html\n');
        
    } catch (error) {
        console.error('\n❌ Ошибка при создании пользователя:', error);
    }
    
    rl.close();
    process.exit(0);
}

// Запускаем создание
createUser();
