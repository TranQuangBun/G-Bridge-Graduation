# 📚 G-Bridge Platform - Complete Documentation

Tài liệu tổng hợp đầy đủ cho dự án G-Bridge Platform.

---

## 📑 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Quick Start](#quick-start)
3. [Local Development Setup](#local-development-setup)
4. [Docker Setup](#docker-setup)
5. [Docker Multi-stage Build](#docker-multi-stage-build)
6. [Backend Documentation](#backend-documentation)
7. [Frontend Documentation](#frontend-documentation)
8. [Swagger UI](#swagger-ui)
9. [TypeORM & Database](#typeorm--database)
10. [Project Structure](#project-structure)

---

## 📋 Tổng quan

G-Bridge là một platform cho phép:
- Phiên dịch viên đăng ký và quản lý profile
- Doanh nghiệp tìm kiếm và thuê phiên dịch viên
- Quản lý ngôn ngữ, chứng chỉ và đánh giá

### Cấu trúc dự án

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
├── docker-compose.yml      # Docker Compose config
├── docker-compose.prod.yml # Production overrides
├── README.md              # Main documentation
└── DOCUMENTATION.md       # This file
```

### Tech Stack

**Frontend:**
- React 19.1.1
- React Router 7.8.0
- Axios 1.12.2
- React Toastify

**Backend:**
- Node.js
- Express 4.19.2
- TypeORM 0.3.27 (ORM)
- MySQL2 3.15.3
- JWT Authentication
- Multer (File upload)
- Swagger UI (API Documentation)

---

## 🚀 Quick Start

### Yêu cầu

- **Node.js**: v18.0.0+
- **npm**: v9.0.0+
- **MySQL**: 8.0+
- **Docker & Docker Compose**: v20.10+ (nếu dùng Docker)

### Cách 1: Local Development

Xem chi tiết: [Local Development Setup](#local-development-setup)

```bash
# 1. Setup Database
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Backend
cd backend
npm install
cp .env.example .env
# Sửa .env với thông tin database
npm run dev

# 3. Frontend (terminal mới)
cd frontend
npm install
npm start
```

### Cách 2: Docker Compose

Xem chi tiết: [Docker Setup](#docker-setup)

```bash
docker-compose up --build
```

**Kết quả:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Swagger UI: http://localhost:4000/api-docs
- MySQL: localhost:3306

---

## 💻 Local Development Setup

### Yêu cầu hệ thống

- **Node.js**: v18.0.0 trở lên
- **npm**: v9.0.0 trở lên (hoặc yarn)
- **MySQL**: 8.0 trở lên
- **Git**: (optional, để clone repository)

### Kiểm tra phiên bản

```bash
node --version   # Cần >= v18.0.0
npm --version    # Cần >= v9.0.0
mysql --version  # Cần >= 8.0.0
```

### Bước 1: Clone và di chuyển vào thư mục dự án

```bash
# Nếu bạn đã có repository
cd /path/to/G-Bridge-Graduation

# Hoặc clone từ repository
git clone <repository-url>
cd G-Bridge-Graduation
```

### Bước 2: Setup Database (MySQL)

Tạo database trong MySQL:

```sql
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hoặc dùng terminal:

```bash
mysql -u root -p
```

Sau đó trong MySQL prompt:

```sql
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Bước 3: Setup Backend

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
DB_PASSWORD=your_mysql_password_here

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

**Kết quả mong đợi:**
```
⏳ Waiting for database... (attempt 1/10)
✓ Database connection established
✓ Auto-sync enabled: Tables will be created/updated from entities
==================================================
🚀 G-Bridge API Server running on port 4000
==================================================
📖 Health check: http://localhost:4000/
📚 Swagger UI: http://localhost:4000/api-docs
🔐 Auth API: http://localhost:4000/api/auth
==================================================
```

✅ Backend đang chạy tại: **http://localhost:4000**

### Bước 4: Setup Frontend

**Quan trọng**: Giữ terminal Backend đang chạy, mở terminal mới để chạy Frontend.

```bash
cd /path/to/G-Bridge-Graduation/frontend
npm install
cp .env.example .env  # Optional
```

Sửa file `.env` (nếu cần):

```env
REACT_APP_API_URL=http://localhost:4000/api
```

Chạy frontend:

```bash
npm start
```

✅ Frontend đang chạy tại: **http://localhost:3000**

### Troubleshooting

**Lỗi kết nối database:**
- Kiểm tra MySQL đang chạy
- Kiểm tra thông tin trong `.env`
- Kiểm tra database đã được tạo

**Port đã được sử dụng:**
- Đổi port trong `.env` hoặc kill process đang dùng port

**CORS Error:**
- Kiểm tra `FRONTEND_URL` trong backend `.env`

---

## 🐳 Docker Setup

### Yêu cầu

- **Docker**: v20.10+ 
- **Docker Compose**: v2.0+

### Quick Start

```bash
# Build và chạy tất cả services
docker-compose up --build

# Chạy ở background
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### Hot Reload

- **Backend**: Sửa code trong `backend/src/` → tự động reload (nodemon)
- **Frontend**: Sửa code trong `frontend/src/` → tự động reload (React Fast Refresh)

### Database Setup

MySQL container sẽ tự động:
1. Tạo database `gbridge_db` với charset `utf8mb4`
2. Tạo user `gbridge_user` với password `gbridge_password`
3. Chạy init script từ `docker/mysql/init/01-init.sql`
4. **Tables được tạo tự động bởi TypeORM** (khi `NODE_ENV=development`)

**Credentials:**
```
Host: mysql (container) / localhost (host)
Port: 3306
Database: gbridge_db
User: gbridge_user
Password: gbridge_password
Root Password: rootpassword
```

### Auto Create Tables trong Docker

Khi chạy Docker với `NODE_ENV=development`:
1. ✅ MySQL container khởi động trước
2. ✅ Backend đợi MySQL healthy (healthcheck)
3. ✅ Backend khởi động với `NODE_ENV=development`
4. ✅ TypeORM tự động tạo 23 bảng từ entities (vì `synchronize: true`)
5. ✅ Server sẵn sàng nhận requests

**Kết quả mong đợi trong logs:**
```
⏳ Waiting for database... (attempt 1/10)
✓ Database connection established
✓ Auto-sync enabled: Tables will be created/updated from entities
🚀 G-Bridge API Server running on port 4000
```

**Kiểm tra bảng đã được tạo:**
```bash
# Vào MySQL container
docker exec -it gbridge-mysql mysql -u root -prootpassword

# Kiểm tra bảng
USE gbridge_db;
SHOW TABLES;
```

Bạn sẽ thấy 23 bảng được tạo tự động.

### Các lệnh thường dùng

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild
docker-compose build --no-cache

# Restart service
docker-compose restart backend

# Xem logs
docker-compose logs -f backend

# Execute command
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Environment Variables

**Backend:**
```yaml
NODE_ENV: development
DB_HOST: mysql
DB_PORT: 3306
DB_NAME: gbridge_db
DB_USER: gbridge_user
DB_PASSWORD: gbridge_password
JWT_SECRET: gbridge-super-secret-jwt-key-2025-change-in-production
PORT: 4000
FRONTEND_URL: http://localhost:3000
```

**Frontend:**
```yaml
REACT_APP_API_URL: http://localhost:4000/api
CHOKIDAR_USEPOLLING: true
WATCHPACK_POLLING: true
FAST_REFRESH: true
```

### Troubleshooting

**Port already in use:**
- Đổi port trong `docker-compose.yml` hoặc kill process

**Cannot connect to database:**
- Kiểm tra MySQL health: `docker-compose ps mysql`
- Đợi MySQL khởi động hoàn tất (10-30 giây)
- Backend có retry logic (10 lần, mỗi 3 giây)

**Hot reload không hoạt động:**
- Restart service: `docker-compose restart backend`
- Kiểm tra volume mount: `docker-compose exec backend ls -la /app/src`

**Bảng không được tạo:**
- Kiểm tra `NODE_ENV=development`: `docker exec gbridge-backend printenv NODE_ENV`
- Kiểm tra logs: `docker-compose logs backend | grep "Auto-sync"`

---

## 🐳 Docker Multi-stage Build

### Tổng quan

Dockerfiles sử dụng **multi-stage build** để:
- ✅ Giảm kích thước image cuối cùng
- ✅ Tách biệt build environment và runtime environment
- ✅ Cải thiện bảo mật (loại bỏ build tools không cần thiết)
- ✅ Tối ưu cache layers
- ✅ Hỗ trợ cả development và production

### Backend Dockerfile - 3 Stages

1. **dependencies** - Install all dependencies
2. **production** - Production runtime image
   - Chỉ install production dependencies
   - Non-root user
   - Kích thước: ~200MB
3. **development** - Development image
   - Có dev dependencies
   - Có nodemon cho hot reload
   - Kích thước: ~500MB

### Frontend Dockerfile - 4 Stages

1. **dependencies** - Install dependencies
2. **builder** - Build React app
3. **production** - Serve với nginx
   - Nginx alpine (nhẹ)
   - Chỉ copy built files
   - Kích thước: ~60MB (giảm ~88%)
4. **development** - Development server
   - React dev server
   - Hot reload

### Build Commands

```bash
# Development (default)
docker-compose up --build

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Build trực tiếp
docker build --target production -t gbridge-backend:prod ./backend
docker build --target production -t gbridge-frontend:prod ./frontend
```

### Lợi ích

**Kích thước Image:**
- Frontend: ~500MB → ~60MB (tiết kiệm 88%)
- Backend: ~500MB → ~200MB (tiết kiệm 60%)

**Bảo mật:**
- Production image không có dev dependencies, build tools, source code

**Build nhanh hơn:**
- Cache layers tốt hơn
- Chỉ rebuild stage cần thiết

---

## 🔧 Backend Documentation

### Quick Start

```bash
cd backend
npm install
cp .env.example .env
# Sửa .env với thông tin database
npm run dev
```

API server sẽ chạy tại: http://localhost:4000

### Scripts

- `npm start` - Chạy production server
- `npm run dev` - Chạy development server với nodemon
- `npm run db:check` - Kiểm tra bảng trong database

### Dependencies chính

- **Express** ^4.19.2 - Web framework
- **TypeORM** ^0.3.27 - ORM (thay thế Sequelize)
- **MySQL2** ^3.15.3 - MySQL driver
- **JWT** ^9.0.2 - Authentication
- **bcrypt** ^5.1.1 - Password hashing
- **Multer** ^2.0.2 - File upload
- **CORS** ^2.8.5 - Cross-origin resource sharing
- **Swagger UI** ^5.0.1 - API Documentation
- **swagger-jsdoc** ^6.2.8 - Swagger documentation generator

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/profile` - Cập nhật profile
- `PUT /api/auth/interpreter-profile` - Cập nhật interpreter profile
- `POST /api/auth/upload-avatar` - Upload avatar

**Interpreters:**
- `GET /api/interpreters` - Lấy danh sách interpreters (có filters)
- `GET /api/interpreters/:id` - Lấy chi tiết interpreter
- `GET /api/interpreters/languages` - Lấy danh sách languages
- `GET /api/interpreters/specializations` - Lấy danh sách specializations

**Languages:**
- `GET /api/languages` - Lấy languages của user
- `POST /api/languages` - Thêm language
- `PUT /api/languages/:id` - Cập nhật language
- `DELETE /api/languages/:id` - Xóa language

**Certifications:**
- `GET /api/certifications` - Lấy certifications của user
- `POST /api/certifications` - Thêm certification
- `PUT /api/certifications/:id` - Cập nhật certification
- `POST /api/certifications/:id/upload-image` - Upload certification image
- `DELETE /api/certifications/:id` - Xóa certification

### Authentication

API sử dụng JWT Bearer token. Thêm header:

```
Authorization: Bearer <token>
```

### Backend Structure

```
backend/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Entry point - starts the server
│   ├── config/             # Configuration files
│   │   ├── DataSource.js  # TypeORM database configuration
│   │   ├── Swagger.js      # Swagger UI configuration
│   │   └── Payment.js      # Payment gateway configuration
│   ├── routes/             # API routes
│   │   ├── AuthRoutes.js
│   │   ├── LanguageRoutes.js
│   │   ├── CertificationRoutes.js
│   │   └── InterpreterRoutes.js
│   ├── controllers/        # Request handlers
│   │   ├── AuthController.js
│   │   ├── LanguageController.js
│   │   ├── CertificationController.js
│   │   └── InterpreterController.js
│   ├── services/           # Business logic layer
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── interpreterService.js
│   │   ├── languageService.js
│   │   └── certificationService.js
│   ├── entities/           # TypeORM entities (database models)
│   │   ├── User.js
│   │   ├── InterpreterProfile.js
│   │   ├── ClientProfile.js
│   │   ├── Language.js
│   │   ├── Certification.js
│   │   └── index.js
│   ├── middleware/         # Express middleware
│   │   ├── Auth.js
│   │   └── Upload.js
│   ├── validators/         # Input validation
│   │   ├── authValidators.js
│   │   └── commonValidators.js
│   └── utils/              # Utility functions
│       ├── response.js
│       ├── errors.js
│       ├── fileHelper.js
│       ├── errorHandler.js
│       └── profileCompleteness.js
├── uploads/                # Uploaded files
│   ├── avatars/
│   └── certifications/
├── package.json
├── .env.example
└── Dockerfile
```

### Flow hoạt động

```
Request → Routes → Middleware → Controllers → Services → Entities → Database
                                                      ↓
Response ← Routes ← Controllers ← Services ← Entities ← Database
```

---

## 📚 Swagger UI

### Truy cập Swagger UI

Sau khi khởi động server, truy cập Swagger UI tại:

```
http://localhost:4000/api-docs
```

### Cách sử dụng

#### 1. Xem tất cả APIs
Swagger UI sẽ tự động hiển thị tất cả các endpoints đã được document với JSDoc comments.

#### 2. Test APIs trực tiếp
- Click vào một endpoint để mở rộng
- Click "Try it out" để test
- Điền các tham số cần thiết
- Click "Execute" để gửi request
- Xem response ngay trong Swagger UI

#### 3. Authentication
Để test các protected endpoints:
1. Đăng nhập qua `/api/auth/login` để lấy JWT token
2. Click nút "Authorize" ở đầu trang Swagger UI
3. Nhập token theo format: `Bearer <your-token>`
4. Click "Authorize" và "Close"
5. Bây giờ bạn có thể test các protected endpoints

### Thêm documentation cho endpoint mới

Để thêm Swagger documentation cho một endpoint mới, thêm JSDoc comment trước route:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.get("/your-endpoint", handler);
```

### Các schemas có sẵn

Trong `src/config/Swagger.js` đã định nghĩa các schemas:
- `User` - User model
- `Job` - Job model
- `Pagination` - Pagination object
- `Success` - Success response
- `Error` - Error response

Bạn có thể reference chúng bằng `$ref: '#/components/schemas/User'`

### Tags

Các tags được sử dụng để nhóm endpoints:
- Authentication
- Users
- Jobs
- Organizations
- Languages
- Certifications
- Payments
- Bookings
- etc.

### Lưu ý

- Swagger UI chỉ hiển thị các endpoints đã có JSDoc comments
- Để thêm documentation cho tất cả endpoints, thêm JSDoc comments vào các route files
- File cấu hình Swagger: `src/config/Swagger.js`

---

## 🗄️ TypeORM & Database

### TypeORM Overview

Project đã chuyển từ **Sequelize** sang **TypeORM** để:
- ✅ Sử dụng decorators (giống Java annotations) - thân thiện hơn với Java developers
- ✅ Auto-create tables từ entities (với `synchronize: true` trong development)
- ✅ Type-safe với TypeScript (nếu migrate sau này)
- ✅ Hỗ trợ migrations tốt hơn

### Auto Create Tables

TypeORM có thể **tự động tạo bảng** từ các entities khi server khởi động, dựa vào option `synchronize`.

#### Cấu hình

Trong `src/config/DataSource.js`:

```javascript
synchronize: process.env.NODE_ENV === "development"
```

**Điều này có nghĩa:**
- ✅ **Nếu `NODE_ENV=development`**: TypeORM sẽ tự động tạo/cập nhật bảng từ entities
- ❌ **Nếu `NODE_ENV` khác**: TypeORM sẽ KHÔNG tự động tạo bảng

#### Entities (23 files)

Các entities đã được tạo trong `src/entities/`:
- ✅ `User.js` → bảng `users`
- ✅ `InterpreterProfile.js` → bảng `interpreter_profiles`
- ✅ `ClientProfile.js` → bảng `client_profiles`
- ✅ `Language.js` → bảng `languages`
- ✅ `Certification.js` → bảng `certifications`
- ✅ `Organization.js` → bảng `organizations`
- ✅ `WorkingMode.js` → bảng `working_modes`
- ✅ `Domain.js` → bảng `domains`
- ✅ `Level.js` → bảng `levels`
- ✅ `Job.js` → bảng `jobs`
- ✅ `JobDomain.js` → bảng `job_domains`
- ✅ `JobRequiredLanguage.js` → bảng `job_required_languages`
- ✅ `JobRequiredCertificate.js` → bảng `job_required_certificates`
- ✅ `JobApplication.js` → bảng `job_applications`
- ✅ `SavedJob.js` → bảng `saved_jobs`
- ✅ `SavedInterpreter.js` → bảng `saved_interpreters`
- ✅ `BookingRequest.js` → bảng `booking_requests`
- ✅ `SubscriptionPlan.js` → bảng `subscription_plans`
- ✅ `Payment.js` → bảng `payments`
- ✅ `UserSubscription.js` → bảng `user_subscriptions`
- ✅ `PaymentWebhook.js` → bảng `payment_webhooks`
- ✅ `PaymentRefund.js` → bảng `payment_refunds`

#### Điều kiện để tự động tạo bảng

Bảng sẽ được tự động tạo khi:

1. ✅ Database đang chạy và kết nối được
2. ✅ `NODE_ENV=development` (hoặc không set và code mặc định là development)
3. ✅ Server khởi động và gọi `initDatabase()`
4. ✅ `synchronize: true` trong DataSource config

#### Kiểm tra bảng đã được tạo

```bash
# Sử dụng script
npm run db:check

# Hoặc kết nối trực tiếp vào MySQL
mysql -u root -p
USE gbridge_db;
SHOW TABLES;
```

### Lưu ý quan trọng

⚠️ **`synchronize: true` chỉ nên dùng trong development!**

- ✅ **Development**: An toàn, tiện lợi, tự động tạo bảng
- ❌ **Production**: NGUY HIỂM - có thể mất dữ liệu!

**Production nên:**
- Tắt `synchronize`: `synchronize: false`
- Sử dụng migrations để quản lý schema changes

### Database Connection

Backend có retry logic để đợi MySQL sẵn sàng:
- Retry 10 lần
- Mỗi lần đợi 3 giây
- Tự động kết nối khi MySQL ready

---

## 🎨 Frontend Documentation

### Quick Start

```bash
cd frontend
npm install
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

### Build cho Production

```bash
npm run build
```

File build sẽ được tạo trong folder `build/`

### Scripts

- `npm start` - Chạy development server
- `npm run build` - Build cho production
- `npm test` - Chạy tests

### Dependencies chính

- **React** ^19.1.1 - UI library
- **React Router** ^7.8.0 - Routing
- **Axios** ^1.12.2 - HTTP client
- **React Toastify** ^11.0.5 - Toast notifications

### Environment Variables

Tạo file `.env` trong thư mục root:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

### Frontend Structure

```
frontend/
├── public/                 # Static files
│   ├── index.html
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── index.js           # Entry point
│   ├── index.css          # Global styles
│   ├── App.jsx            # Root component
│   ├── App.css            # App styles
│   ├── components/        # Reusable components
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── ProtectedRoute.jsx
│   │   ├── InterpreterModal/
│   │   └── index.js
│   ├── pages/             # Page components
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Dashboard/
│   │   ├── Profile/
│   │   └── index.js
│   ├── layouts/           # Layout components
│   │   ├── MainLayout.jsx
│   │   └── index.js
│   ├── routers/           # Routing configuration
│   │   ├── AppRouter.jsx
│   │   └── index.js
│   ├── contexts/          # React Context API
│   │   └── AuthContext.jsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useScrollAnimation.js
│   │   └── useToast.js
│   ├── services/          # API services
│   │   ├── authService.js
│   │   ├── interpreterService.js
│   │   ├── languageService.js
│   │   └── certificationService.js
│   ├── api/               # API client configuration
│   │   ├── client.js      # Axios instance
│   │   └── index.js
│   ├── utils/             # Utility functions
│   │   ├── storage.js
│   │   ├── errors.js
│   │   └── index.js
│   ├── constants/         # Constants
│   │   └── index.js
│   ├── assets/            # Static assets
│   │   ├── images/
│   │   ├── fonts/
│   │   └── ...
│   ├── languages/         # i18n translations
│   │   ├── en.json
│   │   └── vn.json
│   └── translet/          # Translation utilities
│       └── LanguageContext.jsx
├── package.json
├── .env.example
└── Dockerfile
```

### Flow hoạt động

```
User Action → Component → Hook/Service → API Client → Backend API
                                                         ↓
UI Update ← Component ← Hook/Service ← API Client ← Response
```

---

## 🏗️ Project Structure

### Cấu trúc tổng thể

```
G-Bridge-Graduation/
├── frontend/              # React Frontend (ĐỘC LẬP)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── backend/               # Node.js Backend (ĐỘC LẬP)
│   ├── src/
│   ├── uploads/
│   ├── package.json
│   └── .env.example
│
├── docker/                 # Docker configuration
│   └── mysql/init/        # MySQL init scripts
│
├── docker-compose.yml      # Docker Compose config
├── docker-compose.prod.yml # Production overrides
├── README.md               # Main documentation
└── DOCUMENTATION.md        # This file
```

### Docker Configuration

**MySQL Init Script:**

File `docker/mysql/init/01-init.sql` sẽ được MySQL tự động chạy khi container được tạo lần đầu tiên.

Script này sẽ:
- Đảm bảo database có charset đúng (utf8mb4)
- Cấp quyền cho user
- Lưu ý: Tables sẽ được tạo tự động bởi TypeORM khi backend start (với `NODE_ENV=development`)

---

## 🔗 Quick Links

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/
- **Swagger UI**: http://localhost:4000/api-docs
- **MySQL**: localhost:3306

---

## 📝 License

ISC

---

**Last Updated**: 2025
