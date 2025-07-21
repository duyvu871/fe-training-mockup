#!/usr/bin/env node

/**
 * 🏗️ POS API Setup Script
 * Script này sẽ kiểm tra và thiết lập môi trường cho dự án
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const PROJECT_ROOT = process.cwd();

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const log = {
  info: (msg: string) => console.log(chalk.blue.bold('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green.bold('✅'), msg),
  warning: (msg: string) => console.log(chalk.yellow.bold('⚠️'), msg),
  error: (msg: string) => console.log(chalk.red.bold('❌'), msg),
  step: (msg: string) => console.log(chalk.cyan.bold('🔧'), msg),
};

const runCommand = (command: string, description: string) => {
  try {
    log.step(description);
    execSync(command, { stdio: 'inherit', cwd: PROJECT_ROOT });
    return true;
  } catch (error) {
    log.error(`Lỗi khi ${description.toLowerCase()}: ${error}`);
    return false;
  }
};

const checkFile = (filePath: string, description: string): boolean => {
  const fullPath = join(PROJECT_ROOT, filePath);
  if (existsSync(fullPath)) {
    log.success(`${description} tồn tại`);
    return true;
  } else {
    log.warning(`${description} không tồn tại: ${filePath}`);
    return false;
  }
};

const checkDependency = (packageName: string): boolean => {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
};

// ==========================================
// SETUP FUNCTIONS
// ==========================================

async function checkPrerequisites() {
  log.info('🔍 Kiểm tra điều kiện tiên quyết...');
  
  let allGood = true;

  // Check Node.js version
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1));
  if (nodeMajor >= 18) {
    log.success(`Node.js version: ${nodeVersion}`);
  } else {
    log.error(`Node.js version ${nodeVersion} không được hỗ trợ. Cần >= 18.0.0`);
    allGood = false;
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.success(`npm version: ${npmVersion}`);
  } catch {
    log.error('npm không được cài đặt');
    allGood = false;
  }

  // Check Docker
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
    log.success(`Docker: ${dockerVersion}`);
  } catch {
    log.warning('Docker không được cài đặt. Sẽ cần Docker để chạy PostgreSQL');
  }

  // Check Docker Compose
  try {
    const composeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
    log.success(`Docker Compose: ${composeVersion}`);
  } catch {
    log.warning('Docker Compose không được cài đặt');
  }

  return allGood;
}

async function checkProjectStructure() {
  log.info('📁 Kiểm tra cấu trúc dự án...');
  
  const requiredFiles = [
    { path: 'package.json', desc: 'Package.json' },
    { path: 'tsconfig.json', desc: 'TypeScript config' },
    { path: 'tsup.config.ts', desc: 'Build config' },
    { path: '.env.example', desc: 'Environment template' },
    { path: 'prisma/schema.prisma', desc: 'Prisma schema' },
    { path: 'docker-compose.yml', desc: 'Docker Compose config' },
    { path: 'src/app.ts', desc: 'Express app' },
    { path: 'src/server.ts', desc: 'Server entry point' },
    { path: 'src/config/environment.ts', desc: 'Environment config' },
    { path: 'src/config/database.ts', desc: 'Database config' },
  ];

  let allExist = true;
  for (const file of requiredFiles) {
    if (!checkFile(file.path, file.desc)) {
      allExist = false;
    }
  }

  return allExist;
}

async function setupEnvironment() {
  log.info('🔧 Thiết lập environment...');
  
  const envFile = join(PROJECT_ROOT, '.env');
  const envExampleFile = join(PROJECT_ROOT, '.env.example');
  
  if (!existsSync(envFile) && existsSync(envExampleFile)) {
    try {
      const envExample = readFileSync(envExampleFile, 'utf8');
      require('fs').writeFileSync(envFile, envExample);
      log.success('Đã tạo file .env từ .env.example');
    } catch (error) {
      log.error(`Lỗi tạo file .env: ${error}`);
      return false;
    }
  } else if (existsSync(envFile)) {
    log.success('File .env đã tồn tại');
  }
  
  return true;
}

async function installDependencies() {
  log.info('📦 Cài đặt dependencies...');
  
  // Check if node_modules exists
  if (!existsSync(join(PROJECT_ROOT, 'node_modules'))) {
    return runCommand('npm install', 'Cài đặt dependencies');
  } else {
    log.success('Dependencies đã được cài đặt');
    return true;
  }
}

async function checkDependencies() {
  log.info('🔍 Kiểm tra dependencies...');
  
  const requiredDeps = [
    'express',
    'typescript',
    'prisma',
    '@prisma/client',
    'zod',
    'chalk',
    'winston',
    'bcryptjs',
    'jsonwebtoken',
  ];

  let allInstalled = true;
  for (const dep of requiredDeps) {
    if (checkDependency(dep)) {
      log.success(`${dep} đã cài đặt`);
    } else {
      log.warning(`${dep} chưa được cài đặt`);
      allInstalled = false;
    }
  }

  return allInstalled;
}

async function buildProject() {
  log.info('🔨 Build dự án...');
  return runCommand('npm run build', 'Build TypeScript');
}

async function setupDatabase() {
  log.info('🗃️ Thiết lập database...');
  
  // Generate Prisma client
  if (!runCommand('npm run db:generate', 'Generate Prisma client')) {
    return false;
  }

  log.info('✨ Database setup hoàn tất!');
  log.info('💡 Để khởi động database: npm run docker:up');
  log.info('💡 Để chạy migrations: npm run db:migrate');
  log.info('💡 Để seed data: npm run db:seed');
  
  return true;
}

// ==========================================
// MAIN SETUP FUNCTION
// ==========================================

async function main() {
  console.log(chalk.blue.bold('🏪 POS API Setup'));
  console.log(chalk.gray('Thiết lập môi trường phát triển cho POS API\n'));

  let success = true;

  // 1. Check prerequisites
  success = await checkPrerequisites() && success;
  console.log();

  // 2. Check project structure
  success = await checkProjectStructure() && success;
  console.log();

  if (!success) {
    log.error('Có lỗi trong quá trình kiểm tra. Vui lòng sửa các vấn đề trên.');
    process.exit(1);
  }

  // 3. Setup environment
  await setupEnvironment();
  console.log();

  // 4. Install dependencies
  await installDependencies();
  console.log();

  // 5. Check dependencies
  await checkDependencies();
  console.log();

  // 6. Build project
  await buildProject();
  console.log();

  // 7. Setup database
  await setupDatabase();
  console.log();

  // Final success message
  log.success('🎉 Setup hoàn tất!');
  console.log();
  console.log(chalk.cyan.bold('🚀 Bước tiếp theo:'));
  console.log(chalk.white('  1. npm run docker:up     # Khởi động PostgreSQL'));
  console.log(chalk.white('  2. npm run db:migrate    # Chạy database migrations'));
  console.log(chalk.white('  3. npm run db:seed       # Tạo dữ liệu mẫu'));
  console.log(chalk.white('  4. npm run dev           # Khởi động development server'));
  console.log();
  console.log(chalk.gray('📚 Tài liệu: README.md'));
  console.log(chalk.gray('🐛 Issues: GitHub repository'));
}

// Run setup
main().catch((error) => {
  log.error(`Lỗi setup: ${error.message}`);
  process.exit(1);
});
