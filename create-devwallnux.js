// Создание официального аккаунта DevWallNux
const bcrypt = require('bcryptjs');
const { initializeDatabase, userDB } = require('./database-new');

async function createDevWallNux() {
    console.log('=' .repeat(60));
    console.log('  🎨 СОЗДАНИЕ ОФИЦИАЛЬНОГО АККАУНТА DevWallNux');
    console.log('=' .repeat(60));
    console.log();
    
    try {
        await initializeDatabase();
        
        // Проверяем, существует ли уже
        const existing = await userDB.findByUsername('DevWallNux');
        if (existing) {
            console.log('⚠️  Пользователь DevWallNux уже существует!');
            console.log(`   ID: ${existing.id}`);
            console.log(`   Email: ${existing.email}`);
            console.log('\n💡 Обновляем бейджи и права...\n');
            
            // Обновляем бейджи
            const badges = JSON.stringify([
                { id: 'verified', name: 'Verified', icon: '✓', color: '#1DA1F2' },
                { id: 'developer', name: 'Developer', icon: '⚙️', color: '#5865f2' },
                { id: 'founder', name: 'Founder', icon: '👑', color: '#ffd700' },
                { id: 'admin', name: 'Admin', icon: '🛡️', color: '#ed4245' },
                { id: 'nitro', name: 'Nitro', icon: '💎', color: '#ff73fa' }
            ]);
            
            await userDB.update(existing.id, {
                badges: badges,
                bio: 'Official WallNux Messenger Account | Founder & Developer'
            });
            
            console.log('✅ Аккаунт DevWallNux обновлен!');
            console.log('=' .repeat(60));
            console.log('   Бейджи: ✓ Verified, ⚙️ Developer, 👑 Founder, 🛡️ Admin, 💎 Nitro');
            console.log('=' .repeat(60));
            
            process.exit(0);
        }
        
        // Создаем нового пользователя
        const password = 'DevWallNux2024!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await userDB.create('DevWallNux', 'dev@wallnux.com', hashedPassword);
        
        // Добавляем все бейджи
        const badges = JSON.stringify([
            { id: 'verified', name: 'Verified', icon: '✓', color: '#1DA1F2' },
            { id: 'developer', name: 'Developer', icon: '⚙️', color: '#5865f2' },
            { id: 'founder', name: 'Founder', icon: '👑', color: '#ffd700' },
            { id: 'admin', name: 'Admin', icon: '🛡️', color: '#ed4245' },
            { id: 'nitro', name: 'Nitro', icon: '💎', color: '#ff73fa' }
        ]);
        
        await userDB.update(user.id, {
            badges: badges,
            bio: 'Official WallNux Messenger Account | Founder & Developer',
            avatar: '👨‍💻'
        });
        
        console.log('✅ Аккаунт DevWallNux успешно создан!');
        console.log('=' .repeat(60));
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: DevWallNux`);
        console.log(`   Email: dev@wallnux.com`);
        console.log(`   Password: ${password}`);
        console.log('   Бейджи: ✓ Verified, ⚙️ Developer, 👑 Founder, 🛡️ Admin, 💎 Nitro');
        console.log('=' .repeat(60));
        console.log('\n🌐 Войдите на: http://localhost:3000/login.html');
        console.log(`   Username: DevWallNux`);
        console.log(`   Password: ${password}\n`);
        
    } catch (error) {
        console.error('\n❌ Ошибка:', error);
    }
    
    process.exit(0);
}

createDevWallNux();
