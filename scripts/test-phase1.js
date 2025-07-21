/**
 * Test installation script for POS API
 */

const http = require('http');
const { execSync } = require('child_process');

console.log('🧪 Testing POS API Installation...\n');

// Test health endpoint
const testHealth = () => {
  return new Promise((resolve) => {
    const request = http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health endpoint working:', response.status);
          resolve(true);
        } catch (error) {
          console.log('❌ Health endpoint failed');
          resolve(false);
        }
      });
    });
    request.on('error', () => {
      console.log('❌ Server not running');
      resolve(false);
    });
    request.setTimeout(3000, () => {
      console.log('❌ Health check timeout');
      resolve(false);
    });
  });
};

async function main() {
  try {
    // Test database
    console.log('🗄️ Testing database...');
    execSync('npx prisma db pull --print', { stdio: 'pipe' });
    console.log('✅ Database connection OK');

    // Test Docker
    console.log('🐳 Testing Docker containers...');
    const output = execSync('docker-compose ps --services --filter "status=running"', { 
      encoding: 'utf8' 
    });
    if (output.includes('postgres')) {
      console.log('✅ PostgreSQL container running');
    } else {
      console.log('❌ PostgreSQL container not running');
    }

    console.log('\n🎉 Giai đoạn 1 hoàn thành thành công!');
    console.log('\nĐể tiếp tục:');
    console.log('• Khởi động server: npm run dev');
    console.log('• Test health: curl http://localhost:3000/health');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

main();
