# G-Bridge Backend (Auth + MySQL)

Simple Express + Sequelize backend to support signup & login.

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Create database manually:

```sql
CREATE DATABASE gbridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Install deps:

```bash
npm install
```

4. Run dev:

```bash
npm run dev
```

## Auth Endpoints

| Method | Path               | Body                              | Description  |
| ------ | ------------------ | --------------------------------- | ------------ |
| POST   | /api/auth/register | fullName,email,password,role?     | Create user  |
| POST   | /api/auth/login    | email,password                    | Get JWT      |
| GET    | /api/auth/me       | - (Authorization: Bearer <token>) | Current user |

Roles: `interpreter` (default) or `employer`.

Password stored hashed with bcrypt (10 rounds). JWT expires in 7 days.
