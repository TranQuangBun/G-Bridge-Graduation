# G-Bridge Platform - Technical Documentation

> Tài liệu kỹ thuật cho developers

---

## Mục lục

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Development Workflow](#development-workflow)

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| React Router | 7.8.0 | Routing |
| Axios | 1.12.2 | HTTP Client |
| React Toastify | - | Notifications |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v18+ | Runtime |
| Express | 4.19.2 | Web Framework |
| TypeORM | 0.3.27 | ORM |
| MySQL2 | 3.15.3 | Database Driver |
| JWT | - | Authentication |
| Swagger UI | - | API Documentation |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | v20.10+ | Containerization |
| Docker Compose | v2.0+ | Orchestration |
| MySQL | 8.0 | Database |

---

## Project Structure

```
G-Bridge-Graduation/
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API services
│   │   ├── contexts/     # React Context
│   │   └── routers/      # Routing
│   └── package.json
│
├── backend/               # Node.js Backend
│   ├── src/
│   │   ├── entities/     # TypeORM entities
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utilities
│   ├── scripts/          # Utility scripts
│   └── package.json
│
├── ai-service/           # AI Matching Service
│   ├── app/             # FastAPI application
│   └── requirements.txt
│
├── docker/               # Docker configs
│   └── mysql/init/      # MySQL init scripts
│
├── docker-compose.yml    # Docker Compose
├── README.md            # Main documentation
└── SETUP.md             # Setup guide
```

---

## API Documentation

### Swagger UI

Truy cập: **http://localhost:4000/api-docs**

### Authentication

Tất cả protected endpoints yêu cầu JWT token:

```http
Authorization: Bearer <token>
```

### Main Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Đăng ký user mới |
| `POST` | `/api/auth/login` | Đăng nhập |
| `GET` | `/api/auth/me` | Lấy thông tin user hiện tại |

#### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/jobs` | Danh sách jobs |
| `POST` | `/api/jobs` | Tạo job mới |
| `GET` | `/api/jobs/:id` | Chi tiết job |
| `PUT` | `/api/jobs/:id` | Cập nhật job |
| `DELETE` | `/api/jobs/:id` | Xóa job |

#### Interpreters

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/interpreters` | Danh sách interpreters |
| `GET` | `/api/interpreters/:id` | Chi tiết interpreter |

#### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/job-applications` | Danh sách applications |
| `POST` | `/api/jobs/:jobId/apply` | Apply cho job |
| `PUT` | `/api/job-applications/:id` | Cập nhật application |

#### AI Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai-match/job/:jobId/match` | Match interpreters cho job |
| `GET` | `/api/ai-match/score/:jobId/:interpreterId` | Score suitability |

> **Note:** Xem chi tiết tại Swagger UI: http://localhost:4000/api-docs

---

## Database Schema

### Main Tables

| Table | Description |
|-------|-------------|
| `users` | Người dùng (admin, client, interpreter) |
| `interpreter_profiles` | Profile của interpreters |
| `client_profiles` | Profile của clients |
| `organizations` | Tổ chức/doanh nghiệp |
| `jobs` | Công việc |
| `job_applications` | Đơn ứng tuyển |
| `languages` | Ngôn ngữ của users |
| `certifications` | Chứng chỉ |
| `conversations` | Cuộc trò chuyện |
| `messages` | Tin nhắn |
| `subscription_plans` | Gói dịch vụ |
| `payments` | Thanh toán |

### Reference Tables

| Table | Description |
|-------|-------------|
| `domains` | Lĩnh vực (Medical, Legal, Business, etc.) |
| `working_modes` | Hình thức làm việc (Full-time, Part-time, etc.) |
| `levels` | Trình độ (Beginner, Intermediate, Advanced, Native) |
| `application_statuses` | Trạng thái application |

### Database Configuration

> **Note:** Hiện tại `synchronize` được set là `false` trong `DataSource.js` để tránh các vấn đề về row size.

Tables được tạo thông qua:
- SQL init scripts trong `docker/mysql/init/`
- Hoặc migrations (nếu có)

> **Warning:** Không nên bật `synchronize: true` trong production. Sử dụng migrations để quản lý schema changes.

---

## Development Workflow

### Local Development

```bash
# Backend
cd backend
npm run dev  # Hot reload với nodemon

# Frontend
cd frontend
npm start    # Hot reload với React Fast Refresh
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart service
docker-compose restart backend
```

### Code Structure

#### Backend Flow

```
Request → Routes → Middleware → Controllers → Services → Entities → Database
```

#### Frontend Flow

```
User Action → Component → Service → API Client → Backend API
```

---

## Scripts

### Backend Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Development server với hot reload |
| Production | `npm start` | Production server |
| Create Admin | `npm run create-admin` | Tạo admin user |
| Seed Demo | `npm run seed:demo` | Seed demo data |

### Frontend Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm start` | Development server |
| Build | `npm run build` | Build production |

---

**Last Updated**: 2025
