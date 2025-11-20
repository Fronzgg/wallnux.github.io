// Создание админ пользователя DevFronz
const bcrypt = require('bcryptjs');
const { initializeDatabase, userDB } = require('./database-new');

async function createAdminUser() {
    console.log('🔧 Creating admin user DevFronz...');
    
    await initializeDatabase();
    
    try {
        // Проверяем, существует ли пользователь
        const existing = await userDB.findByEmail('fronz@fronz.com');
        
        if (existing) {
            console.log('⚠️ User already exists, updating...');
            
            // Обновляем пользователя
            const hashedPassword = await bcrypt.hash('123456', 10);
            const badges = JSON.stringify([
                'admin',
                'developer',
                'verified',
                'early_supporter',
                'bug_hunter',
                'premium'
            ]);
            
            await userDB.db.run(
                `UPDATE users SET 
                    password = ?,
                    badges = ?,
                    verified = 1
                WHERE email = ?`,
                [hashedPassword, badges, 'fronz@fronz.com']
            );
            
            console.log('✅ User updated successfully!');
        } else {
            console.log('📝 Creating new user...');
            
            const hashedPassword = await bcrypt.hash('123456', 10);
            const badges = JSON.stringify([
                'admin',
                'developer',
                'verified',
                'early_supporter',
                'bug_hunter',
                'premium'
            ]);
            
            await userDB.db.run(
                `INSERT INTO users (username, email, password, badges, verified, status)
                VALUES (?, ?, ?, ?, 1, 'Online')`,
                ['DevFronz', 'fronz@fronz.com', hashedPassword, badges]
            );
            
            console.log('✅ User created successfully!');
        }
        
        console.log('\n📋 Login credentials:');
        console.log('   Email: fronz@fronz.com');
        console.log('   Password: 123456');
        console.log('   Badges: admin, developer, verified, early_supporter, bug_hunter, premium');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    process.exit(0);
}

createAdminUser();
