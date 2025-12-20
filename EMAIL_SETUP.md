# Hướng dẫn cài đặt Email Service để gửi mail reset password

## 1. Cài đặt package nodemailer

```bash
cd backend
npm install nodemailer
```

## 2. Cấu hình SMTP trong file .env

### Sử dụng Gmail (Khuyến nghị cho development)

1. **Tạo App Password cho Gmail:**

   - Truy cập: https://myaccount.google.com/security
   - Bật "2-Step Verification" (nếu chưa bật)
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Other" (đặt tên: G-Bridge Backend)
   - Copy mật khẩu 16 ký tự được tạo ra

2. **Cập nhật file .env:**

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

### Sử dụng Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_NAME=G-Bridge
SMTP_FROM_EMAIL=your-email@outlook.com
```

### Sử dụng SendGrid (Khuyến nghị cho production)

1. Đăng ký tài khoản tại: https://sendgrid.com/
2. Tạo API Key
3. Cấu hình:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_NAME=G-Bridge
SMTP_FROM_EMAIL=verified-email@yourdomain.com
```

### Sử dụng AWS SES (Production grade)

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM_NAME=G-Bridge
SMTP_FROM_EMAIL=verified@yourdomain.com
```

## 3. Kiểm tra cấu hình

Sau khi cấu hình, restart backend server:

```bash
npm run dev
```

Thử gửi email reset password:

1. Mở frontend: http://localhost:3000/forgot-password
2. Nhập email đã đăng ký
3. Kiểm tra hộp thư đến (inbox) hoặc spam

## 4. Lưu ý

- **Gmail**: Giới hạn 500 emails/ngày (Free tier)
- **SendGrid**: 100 emails/ngày miễn phí
- **AWS SES**: $0.10 per 1,000 emails
- Luôn sử dụng App Password cho Gmail (không dùng password chính)
- Trong development, nếu không cấu hình SMTP, reset URL sẽ được log ra console

## 5. Troubleshooting

### Lỗi "Invalid login credentials"

- Kiểm tra lại SMTP_USER và SMTP_PASS
- Với Gmail: Đảm bảo đã bật 2-Step Verification và tạo App Password

### Lỗi "Connection timeout"

- Kiểm tra firewall/antivirus có chặn port 587 không
- Thử đổi SMTP_PORT sang 465 và SMTP_SECURE=true

### Email vào spam

- Cấu hình SPF, DKIM records cho domain
- Sử dụng dịch vụ email chuyên nghiệp (SendGrid, AWS SES)
- Verify domain với email service provider

## 6. Email Template

Email được gửi có thiết kế chuyên nghiệp với:

- Header gradient đẹp mắt
- Button CTA rõ ràng
- Link dự phòng nếu button không hoạt động
- Cảnh báo thời gian hết hạn (1 giờ)
- Footer với thông tin contact

Template có thể tùy chỉnh tại: `backend/src/utils/EmailService.js`
