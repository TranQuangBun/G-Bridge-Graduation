# G-Bridge Platform

> Platform kết nối phiên dịch viên và doanh nghiệp - Graduation Project

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-ISC-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.1.1-blue)

---

## Tổng quan

G-Bridge là một platform cho phép:

- **Phiên dịch viên** đăng ký, quản lý profile và tìm việc
- **Doanh nghiệp** tìm kiếm và thuê phiên dịch viên
- **Admin** quản lý hệ thống, duyệt tổ chức, chứng chỉ và công việc

---

## Quick Start

### Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Docker & Docker Compose | v20.10+ | Khuyến nghị |
| Node.js | v18.0.0+ | Nếu chạy local |
| MySQL | 8.0+ | Nếu chạy local |

### Docker Compose (Khuyến nghị)

```bash
# 1. Clone repository
git clone <repository-url>
cd G-Bridge-Graduation

# 2. Cấu hình Admin (tùy chọn)
# Tạo file docker-compose.override.yml hoặc set trong .env
# ADMIN_EMAIL=admin@gbridge.com
# ADMIN_PASSWORD=YourSecurePassword123!

# 3. Khởi động tất cả services
docker-compose up --build

# 4. Truy cập ứng dụng
# Frontend: http://localhost:3333
# Backend: http://localhost:4000
# Swagger UI: http://localhost:4000/api-docs
```

> **Note:** Lần đầu chạy, hệ thống sẽ tự động:
> - Tạo database và seed reference data
> - Tạo admin user (nếu có ENV variables)
> - Seed demo data (users, jobs, applications, etc.)

### Local Development

Xem chi tiết: [SETUP.md](./SETUP.md#local-development-setup)

```bash
# 1. Setup Database
mysql -u root -p
CREATE DATABASE gbridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Backend
cd backend
npm install
cp .env.example .env
# Sửa .env với thông tin database và admin credentials
npm run dev

# 3. Frontend (terminal mới)
cd frontend
npm install
npm start
```

---

## Đăng nhập và sử dụng

### Tài khoản mặc định (Demo Accounts)

Sau khi chạy Docker lần đầu hoặc seed demo data, bạn có thể sử dụng các tài khoản sau để đăng nhập:

#### Tổng hợp tài khoản Demo

| Role | Email | Password | Ghi chú |
|------|-------|----------|---------|
| **Admin** | `admin@gbridge.com` | `Admin123!` | Từ docker-compose.yml (nếu đã set) |
| **Admin** | `admin@demo.com` | `Demo123!` | Từ seed-demo-data.js |
| **Client** | `client1@demo.com` | `Demo123!` | Demo account 1 |
| **Client** | `client2@demo.com` | `Demo123!` | Demo account 2 |
| **Client** | `client3@demo.com` | `Demo123!` | Demo account 3 |
| **Interpreter** | `interpreter1@demo.com` | `Demo123!` | Demo account 1 |
| **Interpreter** | `interpreter2@demo.com` | `Demo123!` | Demo account 2 |
| **Interpreter** | `interpreter3@demo.com` | `Demo123!` | Demo account 3 |
| **Interpreter** | `interpreter4@demo.com` | `Demo123!` | Demo account 4 |
| **Interpreter** | `interpreter5@demo.com` | `Demo123!` | Demo account 5 |
| **Interpreter** | `interpreter6@demo.com` | `Demo123!` | Demo account 6 |
| **Interpreter** | `interpreter7@demo.com` | `Demo123!` | Demo account 7 |
| **Interpreter** | `interpreter8@demo.com` | `Demo123!` | Demo account 8 |

#### Hướng dẫn đăng nhập

1. **Truy cập trang đăng nhập:**
   - Docker: `http://localhost:3333/login`
   - Local: `http://localhost:3000/login`

2. **Nhập thông tin đăng nhập:**
   - Email: Sử dụng email từ bảng trên
   - Password: Sử dụng password tương ứng

3. **Sau khi đăng nhập:**
   - **Admin**: Tự động redirect đến `/admin/dashboard`
   - **Client**: Tự động redirect đến `/dashboard`
   - **Interpreter**: Tự động redirect đến `/dashboard`

> **Lưu ý:**
> - Tất cả tài khoản demo đều có password: `Demo123!`
> - Admin account từ `docker-compose.yml` có password: `Admin123!` (nếu đã cấu hình)
> - Các tài khoản này chỉ dùng cho mục đích demo/testing

---

### Tài khoản Admin

#### Cách tạo

| Method | Description |
|--------|-------------|
| **Environment Variables** | Set `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env` hoặc `docker-compose.yml` |
| **Script** | Chạy `npm run create-admin` (trong backend) |
| **Database** | Tạo trực tiếp trong database (xem [SETUP.md](./SETUP.md#admin-setup)) |

#### Đăng nhập Admin

1. Truy cập: `http://localhost:3333/login` (Docker) hoặc `http://localhost:3000/login` (Local)
2. Nhập email và password:
   - Nếu dùng `docker-compose.yml`: `admin@gbridge.com` / `Admin123!`
   - Nếu dùng seed-demo-data.js: `admin@demo.com` / `Demo123!`
3. Sau khi đăng nhập, tự động redirect đến `/admin/dashboard`

#### Chức năng Admin

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin/dashboard` | Tổng quan hệ thống |
| Duyệt tổ chức | `/admin/organizations` | Duyệt và quản lý organizations |
| Duyệt chứng chỉ | `/admin/certifications` | Duyệt và quản lý certifications |
| Duyệt công việc | `/admin/jobs/moderation` | Duyệt và quản lý jobs |
| Quản lý người dùng | `/admin/users` | Quản lý users |
| Quản lý doanh thu | `/admin/revenue` | Xem doanh thu |
| Thông báo | `/admin/notifications` | Tạo thông báo hệ thống |

> **Warning:** KHÔNG có trang đăng ký admin công khai - chỉ tạo qua ENV hoặc database

---

### Tài khoản Client (Doanh nghiệp)

#### Cách tạo

1. Truy cập: `http://localhost:3333/register` (Docker) hoặc `http://localhost:3000/register` (Local)
2. Chọn role: **Client**
3. Điền thông tin và đăng ký
4. Tạo organization profile sau khi đăng ký

#### Đăng nhập

1. Truy cập: `http://localhost:3333/login` (Docker) hoặc `http://localhost:3000/login` (Local)
2. Nhập email và password đã đăng ký

#### Chức năng Client

| Feature | Route | Description |
|---------|-------|-------------|
| Đăng tin tuyển dụng | `/post-job` | Tạo job post mới |
| Tìm phiên dịch viên | `/find-interpreter` | Tìm và filter interpreters |
| Quản lý công việc | `/dashboard/my-jobs` | Xem và quản lý jobs đã đăng |
| Đơn ứng tuyển | `/dashboard/applications` | Xem và quản lý applications |
| Nhắn tin | `/messages` | Nhắn tin với interpreters |
| Lưu interpreters | `/saved-interpreters` | Xem interpreters đã lưu |

#### Demo Accounts

Xem bảng tổng hợp ở [Tài khoản mặc định](#tài-khoản-mặc-định-demo-accounts) phía trên.

---

### Tài khoản Interpreter (Phiên dịch viên)

#### Cách tạo

1. Truy cập: `http://localhost:3333/register` (Docker) hoặc `http://localhost:3000/register` (Local)
2. Chọn role: **Interpreter**
3. Điền thông tin và đăng ký
4. Hoàn thiện profile (languages, certifications, experience)

#### Đăng nhập

1. Truy cập: `http://localhost:3333/login` (Docker) hoặc `http://localhost:3000/login` (Local)
2. Nhập email và password đã đăng ký

#### Chức năng Interpreter

| Feature | Route | Description |
|---------|-------|-------------|
| Tìm việc | `/find-job` | Tìm và filter jobs |
| AI Recommendations | `/find-job` | Xem jobs được AI gợi ý |
| Ứng tuyển | `/find-job` | Apply cho các công việc phù hợp |
| Quản lý đơn ứng tuyển | `/dashboard/applications` | Xem status applications |
| Nhắn tin | `/messages` | Nhắn tin với clients |
| Lưu jobs | `/saved-jobs` | Xem jobs đã lưu |
| Quản lý profile | `/profile` | Quản lý languages, certifications |

#### Demo Accounts

Xem bảng tổng hợp ở [Tài khoản mặc định](#tài-khoản-mặc-định-demo-accounts) phía trên.

---

## Demo Data

Sau khi chạy Docker lần đầu, hệ thống tự động seed demo data:

| Type | Count | Details |
|------|-------|---------|
| **Admin** | 1 | `admin@demo.com` / `Demo123!` |
| **Clients** | 3 | `client1@demo.com`, `client2@demo.com`, `client3@demo.com` / `Demo123!` |
| **Interpreters** | 8 | `interpreter1@demo.com` đến `interpreter8@demo.com` / `Demo123!` |
| **Organizations** | 3 | Đã được approve |
| **Jobs** | 6 | Các công việc mẫu |
| **Applications** | 10+ | Đơn ứng tuyển mẫu |

---

## Tài liệu

| Document | Description |
|----------|-------------|
| **[SETUP.md](./SETUP.md)** | Hướng dẫn setup chi tiết (Docker, Local, Admin, Seeding, Email) |
| **[DOCUMENTATION.md](./DOCUMENTATION.md)** | Tài liệu kỹ thuật đầy đủ (API, Database, Architecture) |
| **[ai-service/README.md](./ai-service/README.md)** | AI Matching Service - Quick Start |
| **[ai-service/DOCUMENTATION.md](./ai-service/DOCUMENTATION.md)** | AI Matching Service - Tài liệu chi tiết |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| React Router | 7.8.0 | Routing |
| Axios | 1.12.2 | HTTP Client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v18+ | Runtime |
| Express | 4.19.2 | Web Framework |
| TypeORM | 0.3.27 | ORM |
| MySQL2 | 3.15.3 | Database Driver |
| JWT | - | Authentication |
| Swagger UI | - | API Documentation |

### AI Service

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | - | Web Framework |
| OpenAI GPT-4 | - | AI Matching |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | v20.10+ | Containerization |
| Docker Compose | v2.0+ | Orchestration |
| MySQL | 8.0 | Database |

---

## License

ISC

---

## Contributors

G-Bridge Team
