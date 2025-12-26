# G-Bridge Platform - Workflow Design Document

> Tài liệu thiết kế luồng nghiệp vụ chuẩn cho G-Bridge Platform

---

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Luồng đăng ký và xác thực](#luồng-đăng-ký-và-xác-thực)
3. [Luồng Client (Doanh nghiệp)](#luồng-client-doanh-nghiệp)
4. [Luồng Interpreter (Phiên dịch viên)](#luồng-interpreter-phien-dịch-viên)
5. [Luồng Admin](#luồng-admin)
6. [Luồng Job và Application](#luồng-job-và-application)
7. [Luồng Messaging](#luồng-messaging)
8. [Luồng Payment](#luồng-payment)
9. [Luồng AI Matching](#luồng-ai-matching)
10. [Triển khai](#triển-khai)

---

## Tổng quan

G-Bridge Platform có 3 loại người dùng chính:

| Role | Mô tả | Quyền hạn |
|------|-------|-----------|
| **Admin** | Quản trị viên hệ thống | Duyệt tổ chức, chứng chỉ, công việc; Quản lý người dùng; Xem doanh thu |
| **Client** | Doanh nghiệp/Tổ chức | Đăng tin tuyển dụng; Tìm phiên dịch viên; Quản lý ứng tuyển |
| **Interpreter** | Phiên dịch viên | Tìm việc; Ứng tuyển; Quản lý profile |

---

## Luồng đăng ký và xác thực

### 1. Đăng ký User

#### 1.1. Interpreter Registration

```
User → Register Page → Chọn role "Interpreter"
  → Điền thông tin (email, password, fullName, phone, address)
  → Submit
  → Backend tạo User với role="interpreter"
  → Backend tự động tạo InterpreterProfile với:
    - verificationStatus = "pending"
    - isAvailable = true
    - languages = []
  → Backend tính toán profileCompleteness
  → Trả về token và user data
  → Frontend lưu token vào localStorage
  → Redirect về Home hoặc Profile để hoàn thiện profile
```

**Validation:**
- Email phải unique
- Password phải đủ mạnh (min 8 chars, có chữ hoa, số, ký tự đặc biệt)
- Không cho phép đăng ký role="admin" qua public endpoint

**Post-registration:**
- User có thể đăng nhập ngay
- User nên hoàn thiện profile (languages, certifications, experience)

#### 1.2. Client Registration

```
User → Register Page → Chọn role "Client"
  → Điền thông tin (email, password, fullName, companyName, companyType, phone, address)
  → Submit
  → Backend tạo User với role="client"
  → Backend tự động tạo ClientProfile với:
    - companyName = fullName (hoặc companyName từ form)
    - verificationStatus = "pending"
    - accountStatus = "pending_approval"
  → Trả về token và user data
  → Frontend lưu token vào localStorage
  → Redirect về Home hoặc Dashboard
```

**Post-registration:**
- User có thể đăng nhập ngay
- User cần tạo Organization profile để đăng job
- Organization cần được Admin approve trước khi có thể đăng job

#### 1.3. Admin Creation

**KHÔNG có public registration cho Admin**

Admin chỉ được tạo qua:
1. Environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) + script `create-admin.js`
2. Trực tiếp trong database (manual)

### 2. Đăng nhập

```
User → Login Page → Nhập email và password
  → Submit
  → Backend verify credentials
  → Backend tạo JWT token
  → Trả về token và full user data (với profiles, languages, certifications)
  → Frontend lưu token và user vào localStorage
  → Redirect dựa trên role:
    - Admin → /admin/dashboard
    - Client → /dashboard
    - Interpreter → /dashboard
```

**Token Management:**
- Token được lưu trong localStorage
- Token được gửi trong header `Authorization: Bearer <token>`
- Token có expiry time (mặc định 7 ngày)
- Auto logout nếu token expired (401 response)

### 3. Forgot/Reset Password

```
User → Forgot Password Page → Nhập email
  → Submit
  → Backend generate reset token và expiry (1 hour)
  → Backend gửi email với reset link
  → User click link → Reset Password Page
  → User nhập password mới
  → Backend verify token và expiry
  → Backend update password
  → Clear reset token
  → Redirect về Login
```

---

## Luồng Client (Doanh nghiệp)

### 1. Tạo Organization Profile

```
Client → Dashboard → "Tạo tổ chức" hoặc "Quản lý tổ chức"
  → Form tạo Organization:
    - name, description, address, phone, email
    - businessLicense (file upload)
    - website (optional)
  → Submit
  → Backend tạo Organization với:
    - approvalStatus = "pending"
    - isActive = false
    - ownerUserId = current user id
  → Backend upload businessLicense lên ImgBB
  → Lưu Organization vào database
  → Tạo notification cho Admin
  → Redirect về Dashboard với message "Đang chờ Admin duyệt"
```

**Validation:**
- Client chỉ có thể tạo 1 Organization (hoặc giới hạn số lượng)
- Business license là required
- Organization phải được Admin approve trước khi có thể đăng job

### 2. Đăng Job

```
Client → Post Job Page → Điền form:
  - title, descriptions, responsibility, benefits
  - province, commune, address
  - workingModeId, domainIds (multiple)
  - requiredLanguages (multiple với levelId)
  - requiredCertificates (optional)
  - salaryType, minSalary, maxSalary
  - expirationDate
  - quantity
  - contactEmail, contactPhone
  → Submit
  → Backend validate:
    - Organization phải được approve
    - Tất cả required fields
  → Backend tạo Job với:
    - reviewStatus = "pending"
    - statusOpenStop = "open"
    - organizationId = client's organization id
  → Backend tạo JobDomain, JobRequiredLanguage, JobRequiredCertificate
  → Tạo notification cho Admin
  → Trả về job data
  → Frontend hiển thị message "Job đang chờ Admin duyệt"
  → Redirect về Dashboard hoặc My Jobs
```

**Post-creation:**
- Job không hiển thị public cho đến khi được Admin approve
- Client có thể xem job trong "My Jobs" với status "pending"

### 3. Quản lý Applications

```
Client → Dashboard → My Applications hoặc Job Detail → Applications tab
  → Xem danh sách applications cho job
  → Mỗi application có status: pending, approved, rejected, withdrawn
  → Client có thể:
    - Xem application details (cover letter, resume, interpreter profile)
    - Accept application → status = "approved"
    - Reject application → status = "rejected" (có thể thêm reviewNotes)
  → Backend update application status
  → Backend tạo notification cho Interpreter
  → Tạo conversation nếu chưa có (khi accept)
```

**Business Rules:**
- Client chỉ có thể accept/reject applications cho jobs của mình
- Một job có thể có nhiều applications approved (tùy quantity)
- Khi accept, tự động tạo conversation để Client và Interpreter có thể chat

### 4. Tìm Interpreter

```
Client → Find Interpreter Page
  → Filter/Search:
    - languages, domains, levels
    - province, availability
    - certifications
  → Xem danh sách interpreters
  → Click "AI Recommendations" (optional):
    - Gửi requirements lên AI service
    - AI trả về top interpreters với scores
    - Hiển thị inline thay thế danh sách hiện tại
  → Click interpreter để xem profile
  → Save interpreter (optional)
  → Contact interpreter (tạo conversation)
```

---

## Luồng Interpreter (Phiên dịch viên)

### 1. Hoàn thiện Profile

```
Interpreter → Profile Page
  → Cập nhật thông tin cơ bản (phone, address, avatar)
  → Thêm Languages:
    - languageId, levelId, domainIds (multiple)
  → Thêm Certifications:
    - name, issuingOrganization, issueDate, expiryDate
    - credentialId, description (optional)
    - certificateDocument (file upload - image hoặc PDF)
  → Submit
  → Backend lưu vào database
  → Backend tính toán lại profileCompleteness
  → Nếu có certification mới → status = "pending", tạo notification cho Admin
```

**Profile Completeness:**
- Tính dựa trên: languages, certifications, experience, avatar
- Hiển thị progress bar trong profile

### 2. Tìm việc và Ứng tuyển

```
Interpreter → Find Job Page
  → Filter/Search:
    - province, domain, workingMode
    - salary range
    - keywords
  → Xem danh sách jobs (chỉ jobs đã được approve và status = "open")
  → Click "AI Recommendations" (optional):
    - Gửi interpreter profile lên AI service
    - AI trả về top jobs với match scores
    - Hiển thị inline thay thế danh sách hiện tại
  → Click job để xem chi tiết
  → Save job (optional)
  → Apply for job:
    - Upload resume (PDF) hoặc dùng profile link
    - Viết cover letter
    - Submit
  → Backend tạo JobApplication với:
    - statusId = "pending" (từ ApplicationStatus table)
    - applicationDate = now
  → Backend upload resume lên ImgBB
  → Backend tạo notification cho Client
  → Frontend hiển thị success message
  → Redirect về My Applications
```

**Business Rules:**
- Interpreter chỉ có thể apply 1 lần cho mỗi job
- Interpreter không thể apply cho job đã expired hoặc closed
- Application status: pending → approved/rejected/withdrawn

### 3. Quản lý Applications

```
Interpreter → Dashboard → My Applications
  → Xem danh sách applications với status:
    - pending: Đang chờ Client xem xét
    - approved: Đã được chấp nhận
    - rejected: Đã bị từ chối
    - withdrawn: Đã rút lại
  → Click application để xem chi tiết
  → Nếu approved:
    - Có thể chat với Client
    - Có thể request job completion (khi hoàn thành công việc)
  → Nếu pending:
    - Có thể withdraw application
```

### 4. Job Completion Flow

```
Interpreter → My Applications → Application (status = "approved")
  → Click "Request Completion"
  → Backend tạo completion request:
    - completionRequestedBy = interpreterId
    - status vẫn là "approved"
  → Backend tạo notification cho Client
  → Client nhận notification
  → Client → My Applications → Application
    → Xem completion request
    → Click "Confirm Completion":
      - Backend set completedAt = now
      - Backend set completionConfirmedBy = clientId
      - Backend có thể update job status (nếu cần)
    → Hoặc "Cancel Request" (nếu Interpreter request nhầm)
```

---

## Luồng Admin

### 1. Duyệt Organization

```
Admin → Admin Dashboard → Organizations
  → Xem danh sách organizations với approvalStatus:
    - pending: Chờ duyệt
    - approved: Đã duyệt
    - rejected: Đã từ chối
  → Filter theo status
  → Click organization để xem chi tiết:
    - Thông tin tổ chức
    - Business license document
    - Owner information
  → Approve:
    - Set approvalStatus = "approved"
    - Set isActive = true
    - Tạo notification cho Owner
  → Reject:
    - Set approvalStatus = "rejected"
    - Set isActive = false
    - Nhập rejectionReason
    - Tạo notification cho Owner với lý do
```

**Business Rules:**
- Organization phải được approve trước khi Client có thể đăng job
- Admin có thể xem lại rejected organizations và approve lại

### 2. Duyệt Certificate

```
Admin → Admin Dashboard → Certifications
  → Xem danh sách certifications với status = "pending"
  → Click certification để xem chi tiết:
    - Certificate information
    - Certificate document (image hoặc PDF)
    - Interpreter profile
  → Approve:
    - Set status = "verified"
    - Tạo notification cho Interpreter
  → Reject:
    - Set status = "rejected"
    - Nhập rejectionReason
    - Tạo notification cho Interpreter với lý do
```

### 3. Duyệt Job

```
Admin → Admin Dashboard → Job Moderation
  → Xem danh sách jobs với reviewStatus = "pending"
  → Filter theo status, organization, date
  → Click job để xem chi tiết:
    - Job information
    - Organization information (nếu chưa approve, có thể approve luôn)
    - Required languages, certificates
  → Approve:
    - Set reviewStatus = "approved"
    - Set reviewerId = adminId
    - Job sẽ hiển thị public
    - Tạo notification cho Client
  → Reject:
    - Set reviewStatus = "rejected"
    - Set reviewerId = adminId
    - Nhập reviewNotes (required)
    - Tạo notification cho Client với lý do
```

**Business Rules:**
- Job phải được approve trước khi hiển thị public
- Nếu Organization chưa được approve, Admin có thể approve Organization và Job cùng lúc

### 4. Quản lý Users

```
Admin → Admin Dashboard → User Management
  → Xem danh sách users với filters:
    - role (admin, client, interpreter)
    - isActive, isVerified
    - search by name, email
  → Click user để xem chi tiết
  → Có thể:
    - Toggle active status (ban/unban user)
    - Xem user's jobs, applications, payments
    - Xem user's profile, certifications
```

---

## Luồng Job và Application

### 1. Job Lifecycle

```
Job Created (reviewStatus = "pending")
  ↓
Admin Approve → reviewStatus = "approved", statusOpenStop = "open"
  ↓
Job hiển thị public → Interpreters có thể apply
  ↓
Có applications → Client xem và accept/reject
  ↓
Application approved → Conversation created
  ↓
Job có thể:
  - Tiếp tục nhận applications (nếu quantity > số approved)
  - Client close job → statusOpenStop = "closed"
  - Job expired → statusOpenStop = "expired" (tự động)
```

### 2. Application Lifecycle

```
Interpreter Apply → Application created (status = "pending")
  ↓
Client xem application
  ↓
Client Accept → status = "approved"
  → Conversation created (nếu chưa có)
  → Notification cho Interpreter
  ↓
Interpreter và Client chat, làm việc
  ↓
Interpreter Request Completion → completionRequestedBy set
  ↓
Client Confirm Completion → completedAt set, completionConfirmedBy set
  ↓
Application completed
```

**Alternative Flows:**
- Client Reject → status = "rejected", notification cho Interpreter
- Interpreter Withdraw → status = "withdrawn" (chỉ khi pending)

### 3. Job Status và Visibility

| reviewStatus | statusOpenStop | Public Visible | Can Apply |
|--------------|----------------|----------------|-----------|
| pending | open | ❌ | ❌ |
| approved | open | ✅ | ✅ |
| approved | closed | ✅ | ❌ |
| approved | expired | ✅ | ❌ |
| rejected | open | ❌ | ❌ |

---

## Luồng Messaging

### 1. Tạo Conversation

```
Conversation được tạo tự động khi:
  - Client accept application → Conversation giữa Client và Interpreter
  - User manually tạo conversation (từ Find Interpreter/Find Job)
```

### 2. Chat Flow

```
User → Messages Page
  → Xem danh sách conversations
  → Click conversation để mở chat window
  → Gửi message:
    - Type message
    - Có thể attach file (image, PDF)
    - Submit
  → Backend lưu message vào database
  → Backend gửi real-time notification (nếu có WebSocket)
  → Frontend hiển thị message ngay
  → Recipient nhận notification
```

**Message Features:**
- Real-time chat (nếu có WebSocket, hoặc polling)
- File attachments
- Read receipts (optional)
- Message deletion (soft delete)

---

## Luồng Subscription Plans và Payment

### 1. Subscription Plans Overview

Hệ thống có 4 gói subscription:

| Plan | Price | maxJobPosts | maxInterpreterViews | Key Features |
|------|-------|-------------|---------------------|--------------|
| **Free** | $0 | 1 | 5 | Basic profile, 1 application/month, basic notifications |
| **Pro** | $10/month | Unlimited | Unlimited | Unlimited applications, AI matching, advanced filters, priority support |
| **Team** | $15/month | Unlimited | Unlimited | Team members (up to 10), analytics, shared pool, bulk operations |
| **Enterprise** | $21/month | Unlimited | Unlimited | Unlimited team members, dedicated manager, custom integrations, SLA |

**Plan Features:**
- `maxJobPosts`: Số lượng job posts được phép (null = unlimited)
- `maxInterpreterViews`: Số lần xem interpreter profile (null = unlimited)
- `features`: JSON array chứa danh sách tính năng

### 2. Subscription Purchase Flow

```
User → Pricing Page
  → Xem danh sách subscription plans (load từ database)
  → Chọn plan
  → Click "Subscribe" hoặc "Get Started"
  → Backend tạo Payment record với:
    - userId = current user id
    - planId = selected plan id
    - amount = plan.price
    - currency = plan.currency
    - paymentGateway = "vnpay" hoặc "momo"
    - orderId = unique order ID
    - status = "pending"
  → Backend tạo payment URL (VNPay hoặc MoMo)
  → Redirect user đến payment gateway
  → User thanh toán
  → Payment gateway callback → Backend webhook
  → Backend verify payment signature
  → Backend update Payment status = "completed"
  → Backend tạo/update UserSubscription:
    - userId = current user id
    - planId = selected plan id
    - paymentId = payment id
    - startDate = now
    - endDate = now + plan.duration (theo durationType: monthly/yearly)
    - status = "active"
    - autoRenew = false (mặc định)
  → Backend update User:
    - isPremium = true
    - premiumExpiresAt = endDate
  → Backend tạo notification cho User:
    - type = "PAYMENT_SUCCESS"
    - title = "Subscription activated"
    - message = "Your subscription has been activated successfully"
  → Redirect user về success page
  → User có thể sử dụng các tính năng premium ngay
```

**Business Rules:**
- User chỉ có thể có 1 active subscription tại một thời điểm
- Nếu user đã có subscription active, phải cancel hoặc đợi expire trước khi mua mới
- Payment phải được verify trước khi activate subscription

### 3. Subscription Limits và Checks

#### 3.1. Job Posting Limit (Client)

```
Client → Post Job Page → Submit job
  → Backend kiểm tra subscription:
    - Lấy UserSubscription của client (active)
    - Nếu không có subscription → dùng Free plan limits
    - Lấy plan.maxJobPosts
  → Backend đếm số jobs đã đăng trong tháng hiện tại:
    - SELECT COUNT(*) FROM jobs 
      WHERE organizationId IN (SELECT id FROM organizations WHERE ownerUserId = clientId)
      AND MONTH(createdAt) = MONTH(NOW())
      AND YEAR(createdAt) = YEAR(NOW())
  → So sánh:
    - Nếu maxJobPosts = null → Unlimited → Cho phép
    - Nếu maxJobPosts = -1 → Unlimited → Cho phép
    - Nếu số jobs đã đăng < maxJobPosts → Cho phép
    - Nếu số jobs đã đăng >= maxJobPosts → Từ chối
  → Nếu vượt quá limit:
    - Return error: "You have reached your job posting limit for this month. Please upgrade your plan."
    - Hiển thị upgrade prompt trong frontend
  → Nếu trong limit:
    - Tiếp tục tạo job như bình thường
```

**Free Plan:** maxJobPosts = 1 → Chỉ được đăng 1 job/tháng

#### 3.2. Job Application Limit (Interpreter)

```
Interpreter → Find Job Page → Apply for job
  → Backend kiểm tra subscription:
    - Lấy UserSubscription của interpreter (active)
    - Nếu không có subscription → dùng Free plan limits
  → Backend đếm số applications trong tháng hiện tại:
    - SELECT COUNT(*) FROM job_applications 
      WHERE interpreterId = interpreterId
      AND MONTH(applicationDate) = MONTH(NOW())
      AND YEAR(applicationDate) = YEAR(NOW())
  → So sánh với plan limits:
    - Free plan: 1 application/month
    - Pro/Team/Enterprise: Unlimited
  → Nếu vượt quá limit (Free plan):
    - Return error: "You have reached your application limit for this month (1 application). Please upgrade to Pro plan for unlimited applications."
    - Hiển thị upgrade prompt
  → Nếu trong limit:
    - Tiếp tục tạo application như bình thường
```

**Free Plan:** 1 application/month → Cần upgrade để apply nhiều hơn

#### 3.3. Interpreter Profile Views Limit (Client)

```
Client → Find Interpreter Page → Click interpreter để xem profile
  → Backend kiểm tra subscription:
    - Lấy UserSubscription của client (active)
    - Nếu không có subscription → dùng Free plan limits
    - Lấy plan.maxInterpreterViews
  → Backend đếm số lần đã xem interpreter profiles trong tháng:
    - Có thể track trong một bảng riêng hoặc dùng analytics
    - SELECT COUNT(*) FROM interpreter_views 
      WHERE clientId = clientId
      AND MONTH(viewedAt) = MONTH(NOW())
      AND YEAR(viewedAt) = YEAR(NOW())
  → So sánh:
    - Nếu maxInterpreterViews = null → Unlimited → Cho phép
    - Nếu maxInterpreterViews = -1 → Unlimited → Cho phép
    - Nếu số lần đã xem < maxInterpreterViews → Cho phép
    - Nếu số lần đã xem >= maxInterpreterViews → Từ chối
  → Nếu vượt quá limit:
    - Return error: "You have reached your interpreter profile view limit for this month. Please upgrade your plan."
    - Hiển thị upgrade prompt
  → Nếu trong limit:
    - Ghi lại view (nếu cần track)
    - Hiển thị full profile
```

**Free Plan:** maxInterpreterViews = 5 → Chỉ được xem 5 profiles/tháng

#### 3.4. AI Matching Feature Access

```
User → Find Job/Find Interpreter Page → Click "Get AI Recommendations"
  → Backend kiểm tra subscription:
    - Lấy UserSubscription của user (active)
    - Kiểm tra plan.features có chứa "AI enhanced matching" hoặc "AI matching"
  → Nếu không có subscription hoặc plan không có AI feature:
    - Return error: "AI matching is only available for Pro, Team, and Enterprise plans. Please upgrade to access this feature."
    - Hiển thị upgrade prompt
  → Nếu có AI feature:
    - Tiếp tục gọi AI service như bình thường
```

**Free Plan:** Không có AI matching → Cần upgrade để sử dụng

### 4. Subscription Expiration và Renewal

#### 4.1. Subscription Expiration Check

```
Backend Cron Job (chạy hàng ngày hoặc khi user login)
  → Query tất cả UserSubscriptions với:
    - status = "active"
    - endDate < NOW()
  → Với mỗi expired subscription:
    - Update UserSubscription:
      - status = "expired"
    - Update User:
      - isPremium = false
      - premiumExpiresAt = null
    - Tạo notification cho User:
      - type = "SUBSCRIPTION_EXPIRING"
      - title = "Subscription expired"
      - message = "Your subscription has expired. Renew to continue using premium features."
  → User mất quyền truy cập premium features
  → User tự động chuyển về Free plan limits
```

#### 4.2. Subscription Renewal

```
User → Dashboard → Subscription tab
  → Xem subscription hiện tại (nếu có)
  → Click "Renew" hoặc "Upgrade"
  → Chọn plan mới (có thể giữ nguyên hoặc upgrade)
  → Backend tạo Payment mới
  → User thanh toán
  → Payment success → Backend:
    - Update UserSubscription:
      - startDate = now
      - endDate = now + plan.duration
      - status = "active"
    - Update User:
      - isPremium = true
      - premiumExpiresAt = endDate
  → User tiếp tục sử dụng premium features
```

#### 4.3. Auto-Renewal (Future Feature)

```
User → Dashboard → Subscription Settings
  → Toggle "Auto-renewal"
  → Backend update UserSubscription:
    - autoRenew = true
  → Khi subscription sắp expire (7 ngày trước):
    - Backend tự động tạo Payment mới
    - Backend charge user (nếu có payment method saved)
    - Backend renew subscription tự động
  → Nếu payment fail:
    - Tạo notification cho user
    - Subscription vẫn expire như bình thường
```

### 5. Subscription Cancellation

```
User → Dashboard → Subscription tab
  → Click "Cancel Subscription"
  → Backend update UserSubscription:
    - status = "cancelled"
    - cancelledAt = now
    - cancellationReason = user input (optional)
  → Subscription vẫn active cho đến endDate
  → User vẫn có thể sử dụng premium features cho đến endDate
  → Sau endDate:
    - User tự động chuyển về Free plan
    - isPremium = false
  → Tạo notification:
    - title = "Subscription cancelled"
    - message = "Your subscription will remain active until [endDate]"
```

**Business Rules:**
- Cancelled subscription vẫn active cho đến endDate
- User không được refund (trừ khi có policy khác)
- User có thể renew lại bất cứ lúc nào

### 6. Payment Webhook

```
Payment Gateway → Backend Webhook Endpoint
  → Backend verify signature/checksum
  → Backend tìm Payment bằng orderId
  → Backend update Payment:
    - status = "completed" (nếu success) hoặc "failed" (nếu fail)
    - transactionId = gateway transaction ID
    - paidAt = now (nếu success)
  → Nếu payment success:
    - Backend tạo/update UserSubscription
    - Backend update User.isPremium = true
    - Backend tạo notification cho User
  → Nếu payment fail:
    - Backend tạo notification cho User với lý do
  → Return success response cho gateway
```

### 7. Subscription Plans ảnh hưởng đến các luồng hiện tại

#### 7.1. Job Posting Flow (Updated)

```
Client → Post Job Page → Submit
  → Backend kiểm tra Organization approval (như cũ)
  → Backend kiểm tra Job Posting Limit (NEW):
    - Lấy subscription plan
    - Đếm số jobs đã đăng trong tháng
    - So sánh với maxJobPosts
  → Nếu vượt quá limit:
    - Return error với upgrade prompt
  → Nếu trong limit:
    - Tiếp tục tạo job như bình thường
```

#### 7.2. Job Application Flow (Updated)

```
Interpreter → Find Job Page → Apply
  → Backend kiểm tra Job Application Limit (NEW):
    - Lấy subscription plan
    - Đếm số applications trong tháng
    - So sánh với plan limits (Free: 1/month, Others: unlimited)
  → Nếu vượt quá limit:
    - Return error với upgrade prompt
  → Nếu trong limit:
    - Tiếp tục tạo application như bình thường
```

#### 7.3. Find Interpreter Flow (Updated)

```
Client → Find Interpreter Page → View Profile
  → Backend kiểm tra Interpreter Views Limit (NEW):
    - Lấy subscription plan
    - Đếm số lần đã xem profiles trong tháng
    - So sánh với maxInterpreterViews
  → Nếu vượt quá limit:
    - Return error với upgrade prompt
    - Chỉ hiển thị basic info (không full profile)
  → Nếu trong limit:
    - Ghi lại view
    - Hiển thị full profile
```

#### 7.4. AI Matching Flow (Updated)

```
User → Find Job/Find Interpreter → Click "AI Recommendations"
  → Backend kiểm tra AI Feature Access (NEW):
    - Lấy subscription plan
    - Kiểm tra plan.features có "AI matching"
  → Nếu không có access:
    - Return error với upgrade prompt
  → Nếu có access:
    - Tiếp tục gọi AI service
```

---

## Luồng AI Matching

### 1. AI Suggest Interpreters (cho Job)

```
Client → Post Job Page → Submit job
  → Job được tạo thành công
  → Client click "Get AI Recommendations" (manual trigger)
  → Frontend gửi request đến Backend:
    - POST /api/ai-match/job/:jobId/match
    - maxResults = 10
  → Backend gọi AI Service:
    - POST /api/v1/match/job-to-interpreters
    - Body: { jobId, maxResults }
  → AI Service:
    - Lấy job details từ database
    - Lấy tất cả available interpreters
    - Phân tích và match
    - Trả về top interpreters với scores và reasons
  → Backend trả về results
  → Frontend hiển thị inline (thay thế UI hiện tại):
    - Danh sách interpreters với suitability scores
    - Recommendation text cho mỗi interpreter
    - Match details (reasons, strengths, weaknesses)
  → Client có thể:
    - Xem chi tiết từng interpreter
    - Save interpreter
    - Contact interpreter
```

### 2. AI Suggest Jobs (cho Interpreter)

```
Interpreter → Find Job Page
  → Click "Get AI Recommendations" (manual trigger)
  → Frontend gửi request đến Backend:
    - POST /api/ai-match/interpreter/:interpreterId/match-jobs
    - maxResults = 10
  → Backend gọi AI Service:
    - POST /api/v1/match/interpreter-to-jobs
    - Body: { interpreterId, maxResults }
  → AI Service:
    - Lấy interpreter profile từ database
    - Lấy tất cả open và approved jobs
    - Phân tích và match
    - Trả về top jobs với scores và reasons
  → Backend trả về results
  → Frontend hiển thị inline (thay thế UI hiện tại):
    - Danh sách jobs với match scores
    - Recommendation text cho mỗi job
    - Match details
  → Interpreter có thể:
    - Xem chi tiết job
    - Apply for job
    - Save job
```

**Important:**
- AI Matching là **manual trigger** (user phải click button)
- Results hiển thị **inline** (thay thế danh sách hiện tại), không phải modal
- Nếu AI service không available, hiển thị error message, không block user

---

## Triển khai

### Các thay đổi đã thực hiện:

#### 1. Backend - Job Creation Flow

**File:** `backend/src/controllers/JobController.js`

- ✅ **Organization Approval Check**: Thêm validation để đảm bảo Organization phải được approve (`approvalStatus = "approved"`) và active (`isActive = true`) trước khi có thể đăng job
- ✅ **Review Status**: Đảm bảo job được tạo với `reviewStatus = "pending"` để chờ Admin duyệt
- ✅ **Admin Notification**: Tự động tạo notification cho tất cả admin users khi có job mới cần duyệt

**Code Changes:**
```javascript
// Verify organization exists and is approved
const organization = await organizationRepository.findOne({
  where: { id: parseInt(organizationId) },
});

if (!organization) {
  return sendError(res, "Organization not found", 404);
}

if (organization.approvalStatus !== "approved") {
  return sendError(
    res,
    "Organization must be approved before posting jobs. Please wait for admin approval.",
    403
  );
}

// Job created with reviewStatus = "pending"
const job = jobRepository.create({
  // ... other fields
  reviewStatus: "pending",
});

// Notify all admins
const admins = await userRepository.find({
  where: { role: "admin", isActive: true },
});
for (const admin of admins) {
  await notificationService.createNotification({
    recipientId: admin.id,
    type: NotificationType.JOB_REVIEW_STATUS,
    title: "New job pending review",
    // ...
  });
}
```

#### 2. Backend - Application Acceptance Flow

**File:** `backend/src/controllers/JobController.js`

- ✅ **Conversation Auto-Creation**: Tự động tạo conversation giữa Client và Interpreter khi application được accept
- ✅ **Notification**: Đảm bảo notification được gửi cho Interpreter khi application được accept

**Code Changes:**
```javascript
// After accepting application
await conversationService.getOrCreateConversation(
  clientId,
  interpreterId,
  true // Skip approval check since application is already approved
);
```

#### 3. Backend - Job Visibility

**File:** `backend/src/controllers/JobController.js`

- ✅ **Public Job Filter**: Chỉ hiển thị jobs đã được approve (`reviewStatus = "approved"`) cho public users
- ✅ **Status Filter**: Mặc định chỉ hiển thị jobs với `statusOpenStop = "open"`

**Code Changes:**
```javascript
// Default filter: only show approved jobs
if (!reviewStatus) {
  queryBuilder.where("job.reviewStatus = :reviewStatus", { 
    reviewStatus: "approved" 
  });
  hasWhere = true;
}
```

#### 4. Workflow Documentation

**File:** `WORKFLOW_DESIGN.md`

- ✅ Tạo tài liệu chi tiết về tất cả các luồng nghiệp vụ
- ✅ Mô tả rõ ràng các bước trong mỗi luồng
- ✅ Định nghĩa business rules và validations
- ✅ Mô tả status transitions và visibility rules

### Các thay đổi còn lại (Optional):

1. **Application Status Transitions:**
   - Kiểm tra và đảm bảo tất cả status transitions đúng (pending → approved/rejected/withdrawn)
   - Hiện tại đã đúng, nhưng có thể thêm validation chặt chẽ hơn

2. **Admin Approval Notifications:**
   - Kiểm tra và đảm bảo notifications được tạo đúng lúc cho tất cả admin actions
   - Hiện tại đã có notifications, nhưng có thể review lại

3. **Frontend:**
   - Đảm bảo UI flow đúng với workflow
   - Đảm bảo error handling đầy đủ
   - Đảm bảo loading states
   - Clean up code thừa

4. **Database:**
   - Đảm bảo tất cả status enums đúng
   - Đảm bảo constraints đúng

5. **Documentation:**
   - Update API documentation
   - Update user guides

---

**Last Updated:** 2025

