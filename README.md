# 🏪 POS API - Hệ thống Point of Sale

Một API RESTful hiện đại cho hệ thống Point of Sale được xây dựng với Express.js, TypeScript, Prisma, và PostgreSQL.

## ✨ Tính năng chính

- 🔐 **Xác thực JWT** với refresh tokens
- 👥 **Quản lý người dùng** với role-based access control
- 📦 **Quản lý sản phẩm** với danh mục và tìm kiếm
- 🛒 **Xử lý đơn hàng** với tính toán tự động
- 📊 **Theo dõi tồn kho** với lịch sử movements
- 📱 **Responsive UI** với admin dashboard và POS interface
- 📚 **Tài liệu API** với Swagger/OpenAPI
- 🐳 **Docker ready** với PostgreSQL

## 🛠️ Ngăn xếp công nghệ

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Ngôn ngữ**: TypeScript 5.x (CommonJS)
- **Cơ sở dữ liệu**: PostgreSQL 16 + Prisma ORM
- **Xác thực**: JWT + bcrypt
- **Validation**: express-validator + Joi
- **Logging**: Winston với daily rotation
- **Testing**: Vitest
- **Build**: tsup

### Frontend Preview
- **Template Engine**: Handlebars
- **CSS Framework**: Tailwind CSS
- **JavaScript**: Vanilla JS với modern features

### DevOps
- **Containerization**: Docker + Docker Compose
- **API Documentation**: Swagger/OpenAPI 3.0
- **Process Management**: PM2 (production)
- **Code Quality**: ESLint + Prettier

## 🚀 Bắt đầu nhanh

### Yêu cầu hệ thống
- Node.js 18.0.0 trở lên
- npm 9.0.0 trở lên
- Docker và Docker Compose (tùy chọn)

### 1. Thiết lập tự động (Khuyến nghị)

**Windows:**
```bash
scripts\setup.bat
```

**Linux/macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Thiết lập thủ công

```bash
# Clone repository
git clone <repository-url>
cd training-fe-mock-api

# Cài đặt dependencies
npm install

# Thiết lập environment
cp .env.example .env

# Khởi động PostgreSQL với Docker
docker-compose up -d

# Tạo database schema
npx prisma migrate dev --name init

# Seed dữ liệu mẫu
npm run db:seed

# Build project
npm run build

# Chạy development server
npm run dev
```
git clone <repository-url>
cd pos-api

# Cài đặt dependencies
npm install

# Sao chép file môi trường
cp .env.example .env
```

### 2. Cấu hình môi trường

Chỉnh sửa file `.env` với thông tin của bạn:

```bash
# Cơ sở dữ liệu
DATABASE_URL="postgresql://postgres:password@localhost:5432/pos_db"

# JWT secrets (thay đổi trong production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Người dùng admin mặc định
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password123
ADMIN_EMAIL=admin@pos.local
```

### 3. Khởi động cơ sở dữ liệu

#### Sử dụng Docker (khuyến nghị)
```bash
# Khởi động PostgreSQL container
docker-compose up -d postgres

# Kiểm tra container đang chạy
docker ps
```

#### Hoặc sử dụng PostgreSQL local
Đảm bảo PostgreSQL đang chạy và tạo database `pos_db`

### 4. Thiết lập cơ sở dữ liệu

```bash
# Tạo và chạy migrations
npm run db:migrate

# Seed dữ liệu mẫu
npm run db:seed

# Mở Prisma Studio (tùy chọn)
npm run db:studio
```

### 5. Khởi động development server

```bash
# Chạy server development với hot reload
npm run dev

# Server sẽ chạy tại http://localhost:3000
```

## 📋 API Endpoints

### Xác thực
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Làm mới token
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Thông tin người dùng hiện tại

### Sản phẩm
- `GET /api/products` - Danh sách sản phẩm (có phân trang, tìm kiếm)
- `GET /api/products/:id` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (admin)

### Đơn hàng
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id/status` - Cập nhật trạng thái (admin)

### Kho hàng
- `GET /api/stock/movements` - Lịch sử di chuyển kho
- `POST /api/stock/adjust` - Điều chỉnh kho (admin)
- `GET /api/stock/alerts` - Cảnh báo kho thấp

## 🎨 Giao diện xem trước

Truy cập các URL sau để xem giao diện demo:

- **Admin Dashboard**: http://localhost:3000/admin
- **POS Interface**: http://localhost:3000/pos
- **API Documentation**: http://localhost:3000/api-docs

## 📊 Dữ liệu mẫu

Sau khi chạy `npm run db:seed`, hệ thống sẽ có:

### Tài khoản mặc định
- **Admin**: `admin` / `password123`
- **Cashier**: `cashier` / `cashier123`

### Sản phẩm mẫu
- Đồ uống: Coca Cola, Nước khoáng, Cà phê
- Snacks: Khoai tây chiên, Chocolate
- Điện tử: Cáp USB, Power Bank
- Văn phòng phẩm: Bút bi, Sổ tay

## 🧪 Testing

```bash
# Chạy unit tests
npm run test

# Chạy tests với UI
npm run test:ui

# Kiểm tra test coverage
npm run test:coverage
```

## 🔧 Scripts có sẵn

```bash
# Development
npm run dev          # Khởi động dev server với hot reload
npm run build        # Build cho production
npm run start        # Chạy production server

# Database
npm run db:migrate   # Chạy database migrations
npm run db:seed      # Seed dữ liệu mẫu
npm run db:studio    # Mở Prisma Studio
npm run db:reset     # Reset database (development only)

# Docker
npm run docker:up    # Khởi động tất cả services
npm run docker:down  # Dừng tất cả services

# Code Quality
npm run lint         # Kiểm tra linting
npm run lint:fix     # Tự động sửa linting issues

# Documentation
npm run docs:serve   # Phục vụ API documentation
```

## 📁 Cấu trúc dự án

```
pos-api/
├── src/
│   ├── config/         # Cấu hình ứng dụng
│   ├── controllers/    # HTTP request handlers
│   ├── middlewares/    # Express middlewares
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── repositories/   # Data access layer
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── validators/     # Input validation
│   ├── views/          # HBS templates
│   └── public/         # Static assets
├── prisma/             # Database schema & migrations
├── docs/               # Documentation
├── tests/              # Test files
└── docker/             # Docker configuration
```

## 🔒 Bảo mật

- Mã hóa mật khẩu với bcrypt (12 salt rounds)
- JWT tokens với thời gian hết hạn ngắn (15 phút)
- Refresh tokens với thời gian hết hạn dài (7 ngày)
- Input validation cho tất cả endpoints
- Rate limiting để chống spam
- CORS configuration
- Security headers với helmet
- SQL injection protection với Prisma ORM

## 🚀 Triển khai

### Docker Production

```bash
# Build production image
docker build -t pos-api .

# Chạy với docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Build application
npm run build

# Chạy database migrations
npm run db:migrate:prod

# Khởi động production server
npm run start:prod
```

## 📚 Tài liệu

- [Implementation Strategy](docs/plans/implementation-strategy.md) - Chiến lược triển khai
- [Technical Architecture](docs/plans/technical-architecture.md) - Kiến trúc kỹ thuật
- [Implementation Checklist](docs/plans/implementation-checklist.md) - Danh sách kiểm tra
- [API Documentation](http://localhost:3000/api-docs) - Swagger UI

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm thông tin.

## 🆘 Hỗ trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:

1. Kiểm tra [Issues](https://github.com/your-repo/issues) hiện có
2. Tạo issue mới với mô tả chi tiết
3. Liên hệ team phát triển

## 📈 Roadmap

### Version 1.0 (Current)
- ✅ Core API functionality
- ✅ Authentication & authorization
- ✅ Basic POS operations
- ✅ Admin dashboard preview

### Version 1.1 (Planned)
- [ ] Real-time updates với WebSocket
- [ ] Barcode scanner integration
- [ ] Advanced reporting
- [ ] Email notifications

### Version 2.0 (Future)
- [ ] Multi-store support
- [ ] Mobile app integration
- [ ] Advanced analytics
- [ ] Payment gateway integration

---

**Được xây dựng với ❤️ bởi POS API Team**
