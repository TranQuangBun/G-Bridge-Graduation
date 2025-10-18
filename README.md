# 🚀 G-Bridge - Quick Start Guide

Hướng dẫn nhanh để chạy dự án trong vài bước đơn giản!

## 📋 Yêu cầu

- Node.js v18+ đã cài đặt
- MySQL đã cài đặt và đang chạy
- Git (optional)

## ⚡ Cài đặt nhanh

### 1. Clone/Download dự án

```bash
git clone <repository-url>
cd G-Bridge-Graduation
```

### 2. Cài đặt tất cả dependencies (Frontend + Backend)

```bash
npm run install:all
```

Hoặc cài riêng từng phần:

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Setup Database

#### Tạo database trong MySQL:

```sql
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Cấu hình Backend (.env):

```bash
cd backend
```

Sửa file `backend/.env` (đã có sẵn):

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gbridge_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here

JWT_SECRET=gbridge-super-secret-jwt-key-2025-change-in-production
PORT=4000
NODE_ENV=development
```

**Quan trọng**: Sửa `DB_PASSWORD` thành password MySQL của bạn!

### 4. Chạy dự án

#### 🎯 Cách 1: Chạy cả Frontend + Backend cùng lúc (Khuyên dùng)

```bash
npm run dev
```

hoặc

```bash
npm run start:all
```

#### 🔧 Cách 2: Chạy riêng từng phần

**Terminal 1 - Backend:**

```bash
npm run start:backend
```

**Terminal 2 - Frontend:**

```bash
npm run start:frontend
```

### 5. Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/

## 📚 Available Scripts

```bash
# Chạy cả Frontend + Backend
npm run dev
npm run start:all

# Chỉ chạy Frontend
npm start
npm run start:frontend

# Chỉ chạy Backend
npm run start:backend

# Build Frontend
npm run build

# Cài đặt dependencies
npm run install:all      # Cài cả FE + BE
npm install              # Chỉ FE
npm run install:backend  # Chỉ BE
```

## 🗂️ Cấu trúc dự án

```
G-Bridge-Graduation/
├── backend/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Entry point
│   ├── .env               # Backend environment variables
│   └── package.json
│
├── src/                    # Frontend React app
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── assets/            # Images, fonts, etc.
│   └── App.jsx            # Main app component
│
├── .env                   # Frontend environment variables
├── package.json           # Frontend package.json
├── INTEGRATION_GUIDE.md   # Chi tiết tích hợp FE-BE
└── README.md              # File này
```

## 🔐 Test Authentication

### 1. Đăng ký tài khoản

#### Phiên dịch viên:

```
URL: http://localhost:3000/register
- Họ tên: Nguyễn Văn A
- Email: interpreter@test.com
- Password: 123456
- Role: Phiên dịch viên
```

#### Doanh nghiệp:

```
URL: http://localhost:3000/register
- Họ tên: Nguyễn Thị B
- Email: client@test.com
- Password: 123456
- Role: Doanh nghiệp
- Tên công ty: ABC Company
- Loại hình: Corporation
```

### 2. Đăng nhập

```
URL: http://localhost:3000/login
Email: interpreter@test.com (hoặc client@test.com)
Password: 123456
```

## 🗄️ Kiểm tra Database

Mở MySQL Workbench hoặc phpMyAdmin và chạy:

```sql
-- Xem users
SELECT * FROM users;

-- Xem interpreter profiles
SELECT * FROM interpreter_profiles;

-- Xem client profiles
SELECT * FROM client_profiles;
```

## ❓ Troubleshooting

### Backend không kết nối được MySQL

```
Error: Access denied for user 'root'@'localhost'
```

**Fix**: Check lại `DB_PASSWORD` trong `backend/.env`

### Port 3000 hoặc 4000 đã được sử dụng

```
Error: Port 3000 is already in use
```

**Fix**:

- Tắt process đang dùng port đó
- Hoặc đổi port trong `.env` files

### CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix**: Backend đã có CORS middleware, nhưng check lại `FRONTEND_URL` trong `backend/.env`

## 📖 Documentation

- **Chi tiết tích hợp**: Xem `INTEGRATION_GUIDE.md`
- **Backend API**: Xem `backend/README.md`
- **Animation Guide**: Xem `ANIMATION_GUIDE.md`

## 🎉 Done!

Bây giờ bạn có thể:

- ✅ Đăng ký/Đăng nhập
- ✅ Data được lưu vào MySQL
- ✅ Chạy cả Frontend + Backend với 1 lệnh
- ✅ Phát triển thêm features mới

Happy coding! 🚀
