# 🔐 Hướng dẫn tạo tài khoản Admin

Có 4 cách để tạo tài khoản admin trong hệ thống G-Bridge:

## Cách 1: Đăng ký qua Trang Web (Khuyến nghị)

### Bước 1: Truy cập trang đăng ký admin

Truy cập: `http://localhost:3000/admin/register`

### Bước 2: Điền thông tin

- **Họ và tên**: Tên đầy đủ của admin
- **Email**: Email để đăng nhập
- **Mật khẩu**: Mật khẩu (tối thiểu 6 ký tự)
- **Xác nhận mật khẩu**: Nhập lại mật khẩu

### Bước 3: Đăng nhập

Sau khi đăng ký thành công, bạn sẽ được tự động đăng nhập và chuyển đến trang admin dashboard.

## Cách 2: Sử dụng Script

### Bước 1: Chạy script tạo admin

```bash
cd backend
npm run create-admin
```

Script sẽ tạo admin user với thông tin mặc định:
- **Email**: `admin@gbridge.com`
- **Password**: `Admin123!`
- **Role**: `admin`

### Bước 2: Tùy chỉnh thông tin admin (Tùy chọn)

Nếu muốn tạo admin với email/password khác, set environment variables:

```bash
ADMIN_EMAIL=your-email@example.com \
ADMIN_PASSWORD=YourSecurePassword \
ADMIN_NAME="Your Name" \
npm run create-admin
```

## Cách 3: Tạo qua Database trực tiếp

### Bước 1: Kết nối vào MySQL

```bash
# Nếu dùng Docker
docker exec -it gbridge-mysql mysql -u root -prootpassword

# Hoặc nếu chạy local
mysql -u root -p
```

### Bước 2: Chọn database và tạo admin

```sql
USE gbridge_db;

-- Tạo admin user (password hash cho "Admin123!")
INSERT INTO users (email, passwordHash, fullName, role, isActive, isVerified, createdAt, updatedAt)
VALUES (
  'admin@gbridge.com',
  '$2b$10$rQZ8K5X5X5X5X5X5X5X5Xe5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X',
  'System Administrator',
  'admin',
  1,
  1,
  NOW(),
  NOW()
);
```

**Lưu ý**: Bạn cần hash password trước. Có thể dùng script Node.js để hash:

```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('YourPassword', 10);
console.log(hash);
```

## Cách 4: Tạo qua API (Nếu đã có admin khác)

Nếu bạn đã có một admin user, có thể tạo admin mới qua API hoặc trực tiếp trong database với role = 'admin'.

## Đăng nhập Admin

Sau khi tạo admin user:

1. Truy cập trang đăng nhập: `http://localhost:3000/login`
2. Nhập thông tin:
   - Email: Email bạn đã đăng ký
   - Password: Mật khẩu bạn đã đặt
3. Sau khi đăng nhập, bạn sẽ được chuyển đến dashboard
4. Truy cập trang admin: `http://localhost:3000/admin/dashboard`

**Hoặc** nếu bạn đã đăng ký qua trang web, bạn sẽ được tự động đăng nhập sau khi đăng ký thành công.

## Truy cập các trang Admin

Sau khi đăng nhập với tài khoản admin, bạn có thể truy cập:

- **Dashboard Admin**: `/admin/dashboard`
- **Duyệt chứng chỉ**: `/admin/certifications`
- **Duyệt tổ chức**: `/admin/organizations`
- **Tạo thông báo hệ thống**: `/admin/notifications`
- **Duyệt công việc**: `/admin/jobs/moderation`

## Bảo mật

⚠️ **QUAN TRỌNG**: 
- Đổi mật khẩu mặc định ngay sau lần đăng nhập đầu tiên
- Sử dụng mật khẩu mạnh trong môi trường production
- Không chia sẻ thông tin đăng nhập admin
- Trong môi trường production, nên cân nhắc thêm bảo mật cho trang đăng ký admin (ví dụ: IP whitelist, rate limiting)

## Troubleshooting

### Lỗi: "Admin user already exists"
- Script đã phát hiện admin user đã tồn tại
- Bạn có thể đăng nhập với email đó hoặc xóa user cũ và tạo lại

### Lỗi: "Database connection failed"
- Đảm bảo MySQL đang chạy
- Kiểm tra thông tin kết nối trong `.env`
- Đảm bảo database `gbridge_db` đã được tạo

### Không thể đăng nhập
- Kiểm tra email và password đã đúng chưa
- Kiểm tra user có `role = 'admin'` trong database
- Kiểm tra `isActive = 1` và `isVerified = 1`


