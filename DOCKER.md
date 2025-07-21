# 🐳 Docker Setup cho POS API

## 📋 Tổng quan

Dự án sử dụng 3 file Docker Compose khác nhau:

- **`docker-compose.yml`**: Base configuration (chỉ database + pgAdmin)
- **`docker-compose.dev.yml`**: Development environment
- **`docker-compose.prod.yml`**: Production environment

## 🚀 Development Mode

### Khởi chạy development environment:

```bash
# Khởi chạy toàn bộ stack development
npm run docker:dev

# Hoặc build và khởi chạy
npm run docker:dev:build

# Xem logs
npm run docker:dev:logs

# Dừng services
npm run docker:dev:down
```

### Development environment bao gồm:
- ✅ PostgreSQL database với pgAdmin
- ✅ Redis cache
- ✅ POS API với hot reload
- ✅ Debug port (9229) cho Node.js debugging
- ✅ Volume mapping cho real-time code changes

### Truy cập services:
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5051 (admin@pos.local / password123)
- **PostgreSQL**: localhost:5443
- **Redis**: localhost:6387
- **Debug**: Port 9229 (VS Code, Chrome DevTools)

## � Training Mode

### Chuẩn bị training environment:

```bash
# Khởi chạy training stack
npm run docker:training

# Hoặc build và khởi chạy
npm run docker:training:build

# Xem logs
npm run docker:training:logs

# Dừng services
npm run docker:training:down
```

### Training environment bao gồm:
- ✅ PostgreSQL với training data
- ✅ Redis cache
- ✅ POS API optimized cho training
- ✅ CORS configured cho fe-api.training.ssit.company
- ✅ Training-specific environment variables
- ✅ Health checks và monitoring

### Training URLs:
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Docs**: http://localhost:3001/api-docs
- **PostgreSQL**: localhost:5434
- **Redis**: localhost:6381

## �🏭 Production Mode

### Chuẩn bị production:

1. **Cập nhật environment variables:**
```bash
cp .env.prod .env.production
# Chỉnh sửa .env.production với thông tin thực tế
```

2. **Khởi chạy production:**
```bash
# Khởi chạy production stack
npm run docker:prod

# Hoặc build và khởi chạy
npm run docker:prod:build

# Xem logs
npm run docker:prod:logs

# Dừng services
npm run docker:prod:down
```

### Production environment bao gồm:
- ✅ PostgreSQL with production optimizations
- ✅ Redis with production config
- ✅ POS API optimized build
- ✅ Health checks
- ✅ Log rotation
- ✅ Security hardening
- ❌ Nginx removed (handled by external reverse proxy)

### Production URLs:
- **API**: http://localhost:3002 (configure reverse proxy externally)
- **Health Check**: http://localhost:3002/health
- **PostgreSQL**: localhost:5435
- **Redis**: localhost:6382

## � Port Mapping

Để tránh xung đột port, mỗi environment sử dụng port riêng:

| Service | Development | Training | Production | Base |
|---------|-------------|----------|------------|------|
| **API** | 3000 | 3001 | 3002 | - |
| **PostgreSQL** | 5433 | 5434 | 5435 | 5432 |
| **Redis** | 6380 | 6381 | 6382 | - |
| **pgAdmin** | 5051 | - | - | 5050 |

## �🔧 Database Only Mode

Nếu chỉ cần database để develop locally:

```bash
# Chỉ khởi chạy PostgreSQL + pgAdmin
docker-compose up -d

# Dừng
docker-compose down
```

## 📊 Monitoring & Debugging

### Xem logs:
```bash
# Development logs
docker-compose -f docker-compose.dev.yml logs -f pos-api

# Production logs
docker-compose -f docker-compose.prod.yml logs -f pos-api

# Database logs
docker-compose logs postgres
```

### Debug container:
```bash
# Truy cập vào container
docker exec -it pos-api-dev sh

# Kiểm tra health
docker exec pos-api-prod node -e "require('http').get('http://localhost:3000/health')"
```

### Database operations:
```bash
# Connect to database
docker exec -it pos-postgres-dev psql -U pos_user -d pos_db

# Backup database
docker exec pos-postgres-prod pg_dump -U pos_user pos_db > backup.sql

# Restore database
docker exec -i pos-postgres-prod psql -U pos_user -d pos_db < backup.sql
```

## ⚡ Quick Commands

```bash
# Development
npm run docker:dev        # Start dev environment
npm run docker:dev:build  # Build and start dev
npm run docker:dev:logs   # View dev logs
npm run docker:dev:down   # Stop dev environment

# Training
npm run docker:training       # Start training environment
npm run docker:training:build # Build and start training
npm run docker:training:logs  # View training logs
npm run docker:training:down  # Stop training environment

# Production
npm run docker:prod       # Start prod environment
npm run docker:prod:build # Build and start prod
npm run docker:prod:logs  # View prod logs
npm run docker:prod:down  # Stop prod environment

# Database only
npm run docker:up         # Start database only
npm run docker:down       # Stop database

# Cleanup
npm run docker:clean:all  # Stop all environments and cleanup
```

## 🛡️ Security Notes

### Development:
- Sử dụng default passwords (OK cho dev)
- Debug port exposed (chỉ localhost)
- Source code mapped vào container

### Production:
- **QUAN TRỌNG**: Thay đổi tất cả passwords trong `.env.production`
- **QUAN TRỌNG**: Cấu hình SSL certificates
- **QUAN TRỌNG**: Update JWT secrets
- Không expose debug ports
- Optimized builds only
- Security headers via Nginx
- Rate limiting enabled

## 🚨 Troubleshooting

### Container không start:
```bash
# Kiểm tra logs
docker-compose logs

# Kiểm tra container status
docker ps -a

# Rebuild containers
docker-compose down -v
docker-compose up -d --build
```

### Database connection issues:
```bash
# Kiểm tra database health
docker exec pos-postgres pg_isready -U pos_user -d pos_db

# Reset volumes
docker-compose down -v
docker volume prune
```

### Port conflicts:
```bash
# Kiểm tra ports đang sử dụng
netstat -tulpn | grep :3000
netstat -tulpn | grep :5432

# Kill processes sử dụng port
sudo kill -9 $(lsof -t -i:3000)
```
