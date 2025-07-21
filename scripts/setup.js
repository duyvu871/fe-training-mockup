#!/usr/bin/env node

/**
 * Setup script cho POS API
 * Kiểm tra và cài đặt tất cả dependencies cần thiết
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Bắt đầu thiết lập POS API...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const execCommand = (command, description) => {
  try {
    log(`📦 ${description}...`, colors.blue);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} thành công!\n`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} thất bại!`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
};

const checkFile = (filePath, description) => {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} tồn tại`, colors.green);
    return true;
  } else {
    log(`❌ ${description} không tồn tại: ${filePath}`, colors.red);
    return false;
  }
};

async function main() {
  let success = true;

  // 1. Kiểm tra Node.js version
  log('🔍 Kiểm tra phiên bản Node.js...', colors.cyan);
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1));
    if (majorVersion < 18) {
      log(`❌ Node.js version ${nodeVersion} không được hỗ trợ. Cần Node.js 18+`, colors.red);
      success = false;
    } else {
      log(`✅ Node.js ${nodeVersion} OK`, colors.green);
    }
  } catch (error) {
    log('❌ Không thể kiểm tra Node.js version', colors.red);
    success = false;
  }

  // 2. Kiểm tra Docker
  log('🐳 Kiểm tra Docker...', colors.cyan);
  try {
    execSync('docker --version', { stdio: 'pipe' });
    execSync('docker-compose --version', { stdio: 'pipe' });
    log('✅ Docker và Docker Compose đã sẵn sàng', colors.green);
  } catch (error) {
    log('❌ Docker hoặc Docker Compose chưa được cài đặt', colors.red);
    log('Vui lòng cài đặt Docker Desktop: https://www.docker.com/products/docker-desktop', colors.yellow);
    success = false;
  }

  // 3. Kiểm tra các file cấu hình cần thiết
  log('📁 Kiểm tra file cấu hình...', colors.cyan);
  const requiredFiles = [
    { path: 'package.json', desc: 'Package.json' },
    { path: 'tsconfig.json', desc: 'TypeScript config' },
    { path: 'tsup.config.ts', desc: 'Build config' },
    { path: '.env', desc: 'Environment variables' },
    { path: 'docker-compose.yml', desc: 'Docker compose config' },
    { path: 'prisma/schema.prisma', desc: 'Prisma schema' },
  ];

  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      success = false;
    }
  }

  if (!success) {
    log('\n❌ Một số file cấu hình bị thiếu. Vui lòng kiểm tra lại.', colors.red);
    process.exit(1);
  }

  // 4. Cài đặt dependencies
  if (!execCommand('npm install', 'Cài đặt dependencies')) {
    process.exit(1);
  }

  // 5. Khởi động Docker containers
  if (!execCommand('npm run docker:up', 'Khởi động PostgreSQL container')) {
    process.exit(1);
  }

  // 6. Đợi database sẵn sàng
  log('⏳ Đợi database sẵn sàng...', colors.yellow);
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

  // 7. Generate Prisma client
  if (!execCommand('npm run db:generate', 'Generate Prisma client')) {
    process.exit(1);
  }

  // 8. Run database migrations
  if (!execCommand('npm run db:migrate', 'Chạy database migrations')) {
    process.exit(1);
  }

  // 9. Seed database
  if (!execCommand('npm run db:seed', 'Seed database với dữ liệu mẫu')) {
    process.exit(1);
  }

  // 10. Build project
  if (!execCommand('npm run build', 'Build project')) {
    process.exit(1);
  }

  // Success message
  log('\n🎉 Thiết lập hoàn tất!', colors.green);
  log('\n📋 Tài khoản demo:', colors.cyan);
  log('👤 Admin: admin / password123', colors.yellow);
  log('🏪 Cashier: cashier / password123', colors.yellow);
  
  log('\n🌐 Để khởi động server:', colors.cyan);
  log('npm run dev', colors.yellow);
  
  log('\n🔗 Sau khi khởi động, truy cập:', colors.cyan);
  log('• API: http://localhost:3000', colors.yellow);
  log('• Health: http://localhost:3000/health', colors.yellow);
  log('• Database Studio: npm run db:studio', colors.yellow);
  log('• pgAdmin: http://localhost:5050', colors.yellow);
}

main().catch(error => {
  log(`\n❌ Lỗi trong quá trình setup: ${error.message}`, colors.red);
  process.exit(1);
});
