# 🌉 G-Bridge Platform

Platform kết nối phiên dịch viên và doanh nghiệp - Graduation Project

## 📋 Tổng quan

G-Bridge là một platform cho phép:
- Phiên dịch viên đăng ký và quản lý profile
- Doanh nghiệp tìm kiếm và thuê phiên dịch viên
- Quản lý ngôn ngữ, chứng chỉ và đánh giá

## 🏗️ Cấu trúc dự án

Dự án được chia thành 2 phần độc lập hoàn toàn:

```
G-Bridge-Graduation/
├── frontend/          # React Frontend Application (ĐỘC LẬP)
│   ├── src/          # Source code
│   ├── public/       # Static files
│   ├── package.json  # Frontend dependencies
│   └── .env.example  # Frontend env template
│
├── backend/           # Node.js/Express Backend API (ĐỘC LẬP)
│   ├── src/          # Source code
│   ├── uploads/     # Uploaded files
│   ├── package.json  # Backend dependencies
│   └── .env.example  # Backend env template
│
├── docker/            # Docker configuration
│   └── mysql/init/   # MySQL init scripts
│
├── README.md          # Main documentation
├── DOCUMENTATION.md   # Complete documentation
├── docker-compose.yml # Docker Compose config
└── .gitignore         # Git ignore (chung cho cả project)
```

## 🚀 Quick Start

### Yêu cầu

- Node.js v18+
- MySQL 8.0+
- npm hoặc yarn

### Cài đặt và chạy

📖 **Xem hướng dẫn chi tiết**: [DOCUMENTATION.md](./DOCUMENTATION.md)

#### Tóm tắt nhanh:

**1. Setup Database:**
```sql
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**2. Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Sửa .env với thông tin database
npm run dev
```

**3. Frontend:**
```bash
cd frontend
npm install
npm start
```

**Kết quả:**
- Backend: http://localhost:4000
- Frontend: http://localhost:3000

### Hoặc sử dụng Docker Compose

```bash
# Build và chạy tất cả services (Frontend, Backend, MySQL)
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d
```

**Kết quả:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- MySQL: localhost:3306

📖 **Xem tài liệu đầy đủ**: [DOCUMENTATION.md](./DOCUMENTATION.md)

Tài liệu bao gồm:
- Quick Start & Setup Guide
- Local Development Setup
- Docker Setup & Multi-stage Build
- Backend & Frontend Documentation
- Project Structure & Migration Notes

## 🔧 Development

Mỗi project có thể được phát triển độc lập:

- **Frontend**: React application với các tính năng UI/UX
- **Backend**: RESTful API với Express và Sequelize

## 📦 Tech Stack

### Frontend
- React 19.1.1
- React Router 7.8.0
- Axios 1.12.2
- React Toastify

### Backend
- Node.js
- Express 4.19.2
- Sequelize 6.37.3
- MySQL2 3.11.0
- JWT Authentication
- Multer (File upload)

## 🔐 Environment Variables

Mỗi project có file `.env.example`. Copy và đổi tên thành `.env`, sau đó cấu hình:

- **Backend**: Database, JWT secret, CORS settings
- **Frontend**: API base URL

## 📝 License

ISC

## 👥 Contributors

G-Bridge Team
