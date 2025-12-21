# Hướng dẫn Setup chi tiết

> Tài liệu hướng dẫn setup và cấu hình G-Bridge Platform

---

## Mục lục

1. [Docker Setup](#docker-setup)
2. [Local Development Setup](#local-development-setup)
3. [Admin Setup](#admin-setup)
4. [Database Seeding](#database-seeding)
5. [Email Configuration](#email-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Docker Setup

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Docker | v20.10+ | Required |
| Docker Compose | v2.0+ | Required |

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd G-Bridge-Graduation

# 2. Khởi động tất cả services
docker-compose up --build

# 3. Truy cập ứng dụng
# Frontend: http://localhost:3333
# Backend: http://localhost:4000
# Swagger UI: http://localhost:4000/api-docs
# AI Service: http://localhost:5000 (internal)
```

### Tự động Seeding

Khi Docker khởi động lần đầu:

#### MySQL Container

- Tự động tạo database `gbridge_db`
- Seed reference data (domains, working modes, levels, subscription plans)

#### Backend Container

- Tự động tạo admin user (nếu có `ADMIN_EMAIL` và `ADMIN_PASSWORD`)
- Tự động seed demo data (users, organizations, jobs, applications)

### Cấu hình Admin trong Docker

Thêm vào `docker-compose.yml` hoặc tạo `docker-compose.override.yml`:

```yaml
backend:
  environment:
    - ADMIN_EMAIL=admin@gbridge.com
    - ADMIN_PASSWORD=YourSecurePassword123!
    - ADMIN_NAME=System Administrator
```

### Các lệnh thường dùng

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start services in background |
| `docker-compose down` | Stop services |
| `docker-compose logs -f backend` | View backend logs |
| `docker-compose logs -f frontend` | View frontend logs |
| `docker-compose restart backend` | Restart backend service |
| `docker-compose build --no-cache` | Rebuild images |
| `docker-compose down -v` | Stop and remove volumes (reset database) |

---

## Local Development Setup

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Node.js | v18.0.0+ | Required |
| MySQL | 8.0+ | Required |
| npm | v9.0.0+ | Required |

### Bước 1: Setup Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Bước 2: Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Sửa file `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gbridge_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Admin Configuration (REQUIRED)
ADMIN_EMAIL=admin@gbridge.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=System Administrator

# JWT Configuration
JWT_SECRET=gbridge-super-secret-jwt-key-2025-change-in-production

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

Chạy backend:

```bash
npm run dev
```

### Bước 3: Seed Reference Data

```bash
# Seed reference data (domains, working modes, levels, subscription plans)
# File: docker/mysql/init/02-seed-data.sql
mysql -u root -p gbridge_db < docker/mysql/init/02-seed-data.sql
```

### Bước 4: Tạo Admin User

```bash
cd backend
npm run create-admin
```

### Bước 5: Seed Demo Data (Tùy chọn)

```bash
cd backend
npm run seed:demo
```

### Bước 6: Setup Frontend

```bash
cd frontend
npm install
```

Sửa file `.env` (nếu cần):

```env
REACT_APP_API_URL=http://localhost:4000/api
```

Chạy frontend:

```bash
npm start
```

### Kết quả

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React dev server (mặc định) |
| Backend | http://localhost:4000 | Express server |
| Swagger UI | http://localhost:4000/api-docs | API Documentation |

> **Note:** 
> - Frontend local development chạy trên port 3000 (mặc định của React)
> - Docker frontend chạy trên port 3333
> - Đảm bảo `FRONTEND_URL` trong backend `.env` đúng với port bạn đang dùng

---

## Admin Setup

### Cách 1: Environment Variables (Khuyến nghị)

#### Local Development

Thêm vào `backend/.env`:

```env
ADMIN_EMAIL=admin@gbridge.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=System Administrator
```

Chạy script:

```bash
cd backend
npm run create-admin
```

#### Docker

Thêm vào `docker-compose.yml`:

```yaml
backend:
  environment:
    - ADMIN_EMAIL=admin@gbridge.com
    - ADMIN_PASSWORD=YourSecurePassword123!
    - ADMIN_NAME=System Administrator
```

Admin sẽ tự động được tạo khi container khởi động.

### Cách 2: Tạo trực tiếp trong Database

```bash
# Kết nối MySQL
mysql -u root -p

# Hoặc với Docker
docker exec -it gbridge-mysql mysql -u root -prootpassword
```

```sql
USE gbridge_db;

-- Hash password trước (dùng Node.js)
-- const bcrypt = require('bcrypt');
-- const hash = bcrypt.hashSync('YourPassword123!', 10);
-- console.log(hash);

INSERT INTO users (email, passwordHash, fullName, role, isActive, isVerified, createdAt, updatedAt)
VALUES (
  'admin@gbridge.com',
  'YOUR_HASHED_PASSWORD_HERE',
  'System Administrator',
  'admin',
  1,
  1,
  NOW(),
  NOW()
);
```

### Đăng nhập Admin

| Environment | Login URL | Dashboard URL |
|-------------|-----------|---------------|
| **Docker** | `http://localhost:3333/login` | `/admin/dashboard` |
| **Local** | `http://localhost:3000/login` | `/admin/dashboard` |

> **Warning:**
> - **KHÔNG có trang đăng ký admin công khai** - chỉ tạo qua ENV hoặc database
> - Đổi mật khẩu mặc định ngay sau lần đăng nhập đầu tiên
> - Sử dụng mật khẩu mạnh trong production

---

## Database Seeding

### Reference Data (Tự động)

File `docker/mysql/init/02-seed-data.sql` tự động chạy khi MySQL container khởi động lần đầu:

| Data Type | Description |
|-----------|-------------|
| **Domains** | Medical, Legal, Business, Technical, etc. |
| **Working Modes** | Full-time, Part-time, Remote, etc. |
| **Proficiency Levels** | Beginner, Intermediate, Advanced, Native |
| **Application Statuses** | pending, approved, rejected, withdrawn |
| **Subscription Plans** | Free, Pro, Team, Enterprise |

### Demo Data (Tự động hoặc thủ công)

#### Tự động

- Chạy tự động khi backend container khởi động (nếu chưa có demo data)

#### Thủ công

```bash
# Vào backend container
docker exec -it gbridge-backend sh

# Hoặc local
cd backend

# Chạy seed script
npm run seed:demo
```

#### Demo Data bao gồm

| Type | Count | Details |
|------|-------|---------|
| **Admin** | 1 | `admin@demo.com` / `Demo123!` |
| **Clients** | 3 | `client1@demo.com`, `client2@demo.com`, `client3@demo.com` / `Demo123!` |
| **Interpreters** | 8 | `interpreter1@demo.com` đến `interpreter8@demo.com` / `Demo123!` |
| **Organizations** | 3 | Đã được approve |
| **Jobs** | 6 | Các công việc mẫu |
| **Applications** | 10+ | Đơn ứng tuyển mẫu |
| **Conversations** | - | Messages mẫu |
| **Notifications** | - | Notifications mẫu |
| **Saved Jobs** | - | Saved jobs mẫu |
| **Saved Interpreters** | - | Saved interpreters mẫu |

---

## Email Configuration

### Sử dụng Gmail (Development)

#### Bước 1: Tạo App Password

1. Truy cập: https://myaccount.google.com/security
2. Bật "2-Step Verification"
3. Tạo App Password: https://myaccount.google.com/apppasswords

#### Bước 2: Cấu hình `.env`

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_NAME=G-Bridge
SMTP_FROM_EMAIL=noreply@gbridge.com
```

### Sử dụng SendGrid (Production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_NAME=G-Bridge
SMTP_FROM_EMAIL=verified-email@yourdomain.com
```

### Kiểm tra

1. Restart backend server
2. Thử chức năng "Forgot Password"
3. Kiểm tra email (inbox hoặc spam)

---

## Troubleshooting

### Lỗi kết nối database

#### Docker

```bash
# Kiểm tra MySQL đang chạy
docker-compose ps mysql

# Xem logs
docker-compose logs mysql

# Đợi MySQL khởi động hoàn tất (10-30 giây)
```

#### Local

- Kiểm tra MySQL đang chạy: `sudo systemctl status mysql`
- Kiểm tra thông tin trong `.env`
- Kiểm tra database đã được tạo

### Port đã được sử dụng

| Environment | Solution |
|-------------|----------|
| **Docker** | Đổi port trong `docker-compose.yml` |
| **Local** | Kill process: `lsof -ti:4000 | xargs kill -9` hoặc đổi port trong `.env` |

### Admin không tạo được

- Kiểm tra `ADMIN_EMAIL` và `ADMIN_PASSWORD` đã set chưa
- Kiểm tra logs: `docker-compose logs backend | grep admin`
- Chạy thủ công: `npm run create-admin`

### Demo data không seed

- Kiểm tra MySQL đã sẵn sàng chưa
- Kiểm tra logs: `docker-compose logs backend | grep seed`
- Chạy thủ công: `npm run seed:demo`

### CORS Error

- Kiểm tra `FRONTEND_URL` trong backend `.env`
- Đảm bảo frontend URL đúng (http://localhost:3000 hoặc http://localhost:3333)

### Hot reload không hoạt động

#### Docker

```bash
# Restart service
docker-compose restart backend

# Kiểm tra volume mount
docker-compose exec backend ls -la /app/src
```

#### Local

- Restart server
- Kiểm tra nodemon đang chạy

---

## Environment Variables Reference

### Backend `.env`

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gbridge_db
DB_USER=root
DB_PASSWORD=your_password

# Admin (REQUIRED)
ADMIN_EMAIL=admin@gbridge.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=System Administrator

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM_NAME=G-Bridge
SMTP_FROM_EMAIL=noreply@gbridge.com
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:4000/api
```

---

**Last Updated**: 2025
