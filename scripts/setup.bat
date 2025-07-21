@echo off
echo 🏗️ Thiết lập dự án POS API - Giai đoạn 1
echo ========================================

REM Kiểm tra Node.js version
echo 📋 Kiểm tra môi trường...
node -v
npm -v

REM Cài đặt dependencies
echo.
echo 📦 Cài đặt dependencies...
npm install

REM Tạo thư mục cần thiết
echo.
echo 📁 Tạo thư mục...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "dist" mkdir dist

REM Copy file .env
echo.
echo ⚙️ Thiết lập environment...
if not exist ".env" (
    copy ".env.example" ".env"
    echo ✅ Đã tạo file .env từ .env.example
) else (
    echo ℹ️ File .env đã tồn tại
)

REM Khởi động Docker containers
echo.
echo 🐳 Khởi động Docker containers...
docker-compose up -d

REM Đợi PostgreSQL khởi động
echo.
echo ⏳ Đợi PostgreSQL khởi động...
timeout /t 15 /nobreak > nul

REM Tạo Prisma client
echo.
echo 🔧 Tạo Prisma client...
npx prisma generate

REM Chạy migrations
echo.
echo 💾 Chạy database migrations...
npx prisma migrate dev --name init

REM Seed dữ liệu
echo.
echo 🌱 Seed dữ liệu mẫu...
npm run db:seed

REM Build project
echo.
echo 🔨 Build project...
npm run build

echo.
echo 🎉 Thiết lập hoàn tất!
echo.
echo 📋 Các lệnh hữu ích:
echo • npm run dev          - Chạy development server
echo • npm run build        - Build production
echo • npm run start        - Chạy production server
echo • npm run db:studio    - Mở Prisma Studio
echo • npm run db:migrate   - Chạy migrations
echo • npm run db:seed      - Seed dữ liệu
echo • npm run test         - Chạy tests
echo.
echo 🌐 URLs:
echo • API: http://localhost:3000
echo • Health: http://localhost:3000/health
echo • pgAdmin: http://localhost:5050 (admin@pos.local / password123)
echo.
echo 👤 Tài khoản demo:
echo • Admin: admin / password123
echo • Cashier: cashier / password123
echo.
pause
