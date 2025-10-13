# 🔗 Hướng dẫn tích hợp Frontend với Backend

## ✅ Đã hoàn thành

### 1. Backend API (Đã setup)

- ✅ Node.js + Express server chạy tại `http://localhost:4000`
- ✅ MySQL database với 3 tables: `users`, `interpreter_profiles`, `client_profiles`
- ✅ Authentication API endpoints
- ✅ Role-based authorization (admin, client, interpreter)
- ✅ JWT token authentication

### 2. Frontend Integration (Đã hoàn thành)

- ✅ Cài đặt axios
- ✅ Tạo `authService.js` - Service xử lý API calls
- ✅ Tạo `AuthContext.jsx` - Context quản lý auth state
- ✅ Cập nhật `RegisterPage.jsx` - Kết nối với API đăng ký
- ✅ Cập nhật `LoginPage.jsx` - Kết nối với API đăng nhập
- ✅ Tạo `ProtectedRoute.jsx` - Component bảo vệ routes
- ✅ Tạo `.env` file với API URL

## 🚀 Cách sử dụng

### Bước 1: Start Backend Server

```bash
cd backend
npm run dev
```

Server sẽ chạy tại: `http://localhost:4000`

### Bước 2: Start Frontend

```bash
# Ở root folder
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

### Bước 3: Test đăng ký

1. Mở browser: `http://localhost:3000/register`
2. Điền thông tin:

   - **Phiên dịch viên**:

     - Họ tên: "Nguyễn Văn A"
     - Email: "interpreter@test.com"
     - Password: "123456"
     - Role: Interpreter

   - **Doanh nghiệp**:
     - Họ tên: "Nguyễn Thị B"
     - Email: "client@test.com"
     - Password: "123456"
     - Role: Company
     - Tên công ty: "ABC Company"
     - Loại hình: Corporation

3. Click "Tạo tài khoản"
4. Nếu thành công → Tự động đăng nhập và chuyển đến Dashboard

### Bước 4: Test đăng nhập

1. Mở browser: `http://localhost:3000/login`
2. Nhập email và password đã đăng ký
3. Click "Đăng nhập"
4. Sẽ chuyển đến trang phù hợp với role

## 📚 API Endpoints đã tích hợp

### 1. Đăng ký (Register)

```javascript
POST http://localhost:4000/api/auth/register

// Request body cho Interpreter
{
  "fullName": "Nguyễn Văn A",
  "email": "interpreter@test.com",
  "password": "123456",
  "role": "interpreter"
}

// Request body cho Client
{
  "fullName": "Nguyễn Thị B",
  "email": "client@test.com",
  "password": "123456",
  "role": "client",
  "companyName": "ABC Company",
  "companyType": "corporation"
}

// Response
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "interpreter@test.com",
    "role": "interpreter",
    "isActive": true,
    "isVerified": false
  },
  "profile": {
    "id": 1,
    "languages": [],
    "profileCompleteness": 20
  }
}
```

### 2. Đăng nhập (Login)

```javascript
POST http://localhost:4000/api/auth/login

// Request body
{
  "email": "interpreter@test.com",
  "password": "123456"
}

// Response
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "interpreter@test.com",
    "role": "interpreter",
    "phone": null,
    "avatar": null,
    "isVerified": false,
    "lastLoginAt": "2025-10-12T10:30:00.000Z"
  },
  "profile": {
    "id": 1,
    "languages": [],
    "specializations": null,
    "hourlyRate": null,
    "rating": 0,
    "isAvailable": true,
    "profileCompleteness": 20
  }
}
```

### 3. Lấy thông tin user hiện tại

```javascript
GET http://localhost:4000/api/auth/me
Headers: {
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}

// Response
{
  "user": {...},
  "profile": {...}
}
```

## 💾 Data Flow

### Khi đăng ký:

1. User điền form → Frontend validate
2. Frontend gọi `authService.register(userData)`
3. Backend tạo user trong MySQL
4. Backend tạo profile (interpreter hoặc client)
5. Backend trả về token + user info
6. Frontend lưu token vào localStorage
7. Frontend redirect đến dashboard

### Khi đăng nhập:

1. User nhập email/password → Frontend validate
2. Frontend gọi `authService.login(email, password)`
3. Backend kiểm tra credentials
4. Backend update lastLoginAt
5. Backend trả về token + user info + profile
6. Frontend lưu token vào localStorage
7. Frontend redirect đến dashboard phù hợp với role

### Khi truy cập protected routes:

1. `ProtectedRoute` component check localStorage
2. Nếu có token → Check role
3. Nếu role phù hợp → Render component
4. Nếu không → Redirect về login hoặc homepage

## 🔒 Protected Routes

Để bảo vệ một route, wrap component với `ProtectedRoute`:

```javascript
import ProtectedRoute from './components/ProtectedRoute';

// Protect route - chỉ cần login
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>

// Protect route - chỉ interpreter
<Route
  path="/interpreter/profile"
  element={
    <ProtectedRoute allowedRoles={['interpreter']}>
      <ProfilePage />
    </ProtectedRoute>
  }
/>

// Protect route - chỉ client
<Route
  path="/company/dashboard"
  element={
    <ProtectedRoute allowedRoles={['client']}>
      <CompanyDashboard />
    </ProtectedRoute>
  }
/>

// Protect route - admin only
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## 📱 Sử dụng Auth trong Components

```javascript
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, profile, isAuthenticated, logout, refreshUser } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Hello {user.fullName}</h1>
      <p>Role: {user.role}</p>
      <p>Email: {user.email}</p>

      {user.role === "interpreter" && (
        <div>
          <p>Languages: {profile?.languages?.length || 0}</p>
          <p>Rating: {profile?.rating || 0}</p>
        </div>
      )}

      {user.role === "client" && (
        <div>
          <p>Company: {profile?.companyName}</p>
          <p>Type: {profile?.companyType}</p>
        </div>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Lỗi CORS

Nếu gặp lỗi CORS, check:

- Backend `server.js` đã có `cors()` middleware
- Frontend `.env` có `REACT_APP_API_URL=http://localhost:4000/api`

### Token không được lưu

- Check localStorage trong browser DevTools
- Check Network tab xem response có trả về token không

### Redirect không đúng sau login

- Check `user.role` trong response
- Check logic redirect trong `LoginPage.jsx` và `RegisterPage.jsx`

## 🎉 Done!

Bây giờ bạn đã có:

- ✅ Backend API với MySQL
- ✅ Frontend kết nối với Backend
- ✅ Authentication (Register/Login) hoạt động
- ✅ Token-based auth với localStorage
- ✅ Role-based access control
- ✅ Protected routes

Tiếp theo bạn có thể:

- Tạo thêm API endpoints (profile update, job posting, etc.)
- Hoàn thiện UI/UX
- Thêm features mới
- Deploy lên production
