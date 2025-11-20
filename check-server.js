// Простая проверка, запущен ли сервер
const http = require('http');

console.log('🔍 Checking if server is running on port 3000...\n');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    console.log('✅ Server is running!');
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Server: ${res.headers.server || 'Unknown'}`);
    console.log('\n✅ You can now open http://localhost:3000 in your browser');
    process.exit(0);
});

req.on('error', (error) => {
    console.error('❌ Server is NOT running!');
    console.error(`   Error: ${error.message}`);
    console.log('\n💡 To start the server, run:');
    console.log('   node server.js');
    process.exit(1);
});

req.on('timeout', () => {
    console.error('❌ Server connection timeout!');
    console.log('\n💡 Server might be starting or not responding');
    req.destroy();
    process.exit(1);
});

req.end();
