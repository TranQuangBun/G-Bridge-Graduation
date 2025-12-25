# Payment Flow & Use Cases

## Tổng quan

Hệ thống thanh toán của G-Bridge cho phép người dùng đăng ký các gói subscription để sử dụng các tính năng premium như AI Matching, Advanced Filters, và các tính năng nâng cao khác.

## Các thành phần chính

### 1. Pricing Page (`/pricing`)
- Hiển thị danh sách các gói subscription
- Cho phép chuyển đổi giữa billing monthly/yearly
- Hiển thị giá và tính năng của từng gói
- Xử lý việc mua gói

### 2. Payment Service (`paymentService.js`)
- Quản lý tất cả các API calls liên quan đến payment
- Hỗ trợ 3 phương thức thanh toán: PayPal, VNPay, MoMo
- Xử lý verification và subscription management

### 3. Payment Callback (`/payment/*/callback`)
- Xử lý callback từ payment gateway
- Verify payment status
- Cập nhật subscription status

### 4. Subscription Hook (`useSubscription`)
- Hook để kiểm tra subscription status
- Sử dụng trong các component để enable/disable features

---

## Use Cases

### UC-1: Xem danh sách gói subscription

**Actor:** User (chưa đăng nhập hoặc đã đăng nhập)

**Preconditions:**
- User truy cập trang Pricing

**Flow:**
1. User truy cập `/pricing`
2. System load danh sách gói từ database (`subscriptionPlanService.getActivePlans()`)
3. System hiển thị các gói:
   - Free Plan (miễn phí)
   - Pro Plan ($10/tháng)
   - Team Plan ($15/tháng)
   - Enterprise Plan ($21/tháng)
4. User có thể chuyển đổi giữa Monthly/Yearly billing
5. System hiển thị giá tương ứng với billing period đã chọn

**Postconditions:**
- User thấy danh sách gói và giá cả
- User có thể chọn gói để mua

---

### UC-2: Mua gói subscription (VNPay)

**Actor:** Authenticated User

**Preconditions:**
- User đã đăng nhập
- User đang ở trang Pricing
- User chọn một gói có giá > 0

**Flow:**
1. User click nút "Get Started" trên một gói
2. System kiểm tra authentication:
   - Nếu chưa đăng nhập → Redirect đến `/login`
   - Nếu đã đăng nhập → Tiếp tục
3. System kiểm tra gói:
   - Nếu là Free plan → Hiển thị error (không thể mua qua payment gateway)
   - Nếu là paid plan → Mở modal chọn phương thức thanh toán
4. User chọn phương thức thanh toán "VNPay"
5. System gọi API `paymentService.createVNPayPayment(planId)`
6. Backend tạo payment URL và trả về
7. System redirect user đến VNPay payment page
8. User thực hiện thanh toán trên VNPay
9. VNPay redirect về `/payment/vnpay/callback` với query parameters
10. System verify payment qua `paymentService.verifyVNPayPayment()`
11. Nếu thành công:
    - Cập nhật subscription status
    - Hiển thị success message
    - Redirect về `/pricing` hoặc dashboard
12. Nếu thất bại:
    - Hiển thị error message
    - User có thể thử lại

**Postconditions:**
- Nếu thành công: User có active subscription
- Nếu thất bại: User vẫn chưa có subscription

**Alternative Flows:**
- User hủy thanh toán trên VNPay → Redirect về với status failed
- Payment timeout → System hiển thị error

---

### UC-3: Mua gói subscription (MoMo)

**Actor:** Authenticated User

**Preconditions:**
- User đã đăng nhập
- User đang ở trang Pricing
- User chọn một gói có giá > 0

**Flow:**
1. User click nút "Get Started" trên một gói
2. System kiểm tra authentication → Mở modal chọn phương thức
3. User chọn phương thức thanh toán "MoMo"
4. System gọi API `paymentService.createMoMoPayment(planId)`
5. Backend tạo payment URL và trả về
6. System redirect user đến MoMo payment page
7. User thực hiện thanh toán trên MoMo (QR Code hoặc app)
8. MoMo redirect về `/payment/momo/callback` với query parameters
9. System verify payment qua `paymentService.verifyMoMoPayment()`
10. Nếu thành công:
    - Cập nhật subscription status
    - Hiển thị success message
    - Redirect về `/pricing` hoặc dashboard
11. Nếu thất bại:
    - Hiển thị error message

**Postconditions:**
- Nếu thành công: User có active subscription
- Nếu thất bại: User vẫn chưa có subscription

---

### UC-4: Mua gói subscription (PayPal)

**Actor:** Authenticated User

**Preconditions:**
- User đã đăng nhập
- User đang ở trang Pricing
- User chọn một gói có giá > 0

**Flow:**
1. User click nút "Get Started" trên một gói
2. System kiểm tra authentication → Mở modal chọn phương thức
3. User chọn phương thức thanh toán "PayPal"
4. System gọi API `paymentService.createPayPalPayment(planId)`
5. Backend tạo PayPal order và trả về
6. System hiển thị success message và redirect
7. (Future: Integrate PayPal SDK để xử lý payment trực tiếp)

**Postconditions:**
- Payment được tạo, chờ verification từ PayPal

---

### UC-5: Kiểm tra subscription status

**Actor:** Authenticated User

**Preconditions:**
- User đã đăng nhập
- Component sử dụng `useSubscription` hook

**Flow:**
1. Component mount hoặc user authentication thay đổi
2. Hook gọi `paymentService.getSubscriptionStatus()`
3. Backend trả về subscription data:
   ```json
   {
     "success": true,
     "data": {
       "id": 1,
       "status": "active",
       "plan": {
         "id": 2,
         "name": "Pro Plan"
       },
       "startDate": "2024-01-01",
       "endDate": "2024-02-01"
     }
   }
   ```
4. Hook trả về:
   - `subscription`: Subscription object
   - `loading`: Loading state
   - `hasActiveSubscription`: Boolean (true nếu status === "active")

**Postconditions:**
- Component có thông tin subscription để enable/disable features

**Usage:**
- Dashboard hiển thị subscription status và countdown
- AI features check `hasActiveSubscription` để enable/disable
- Advanced filters check subscription trước khi cho phép sử dụng

---

### UC-6: Xem lịch sử thanh toán

**Actor:** Authenticated User

**Preconditions:**
- User đã đăng nhập

**Flow:**
1. User truy cập trang Payment History (nếu có)
2. System gọi `paymentService.getPaymentHistory()`
3. Backend trả về danh sách các payment records
4. System hiển thị:
   - Payment date
   - Amount
   - Payment method
   - Status (success/failed)
   - Plan purchased

**Postconditions:**
- User thấy lịch sử thanh toán của mình

---

### UC-7: Hủy subscription

**Actor:** Authenticated User với active subscription

**Preconditions:**
- User có active subscription
- User muốn hủy subscription

**Flow:**
1. User truy cập Settings hoặc Subscription management page
2. User click nút "Cancel Subscription"
3. System hiển thị confirmation dialog
4. User xác nhận hủy
5. System gọi `paymentService.cancelSubscription()`
6. Backend cập nhật subscription status thành "cancelled"
7. System hiển thị success message
8. Subscription sẽ hết hạn vào ngày `endDate`, không được renew

**Postconditions:**
- Subscription status = "cancelled"
- Subscription vẫn active cho đến `endDate`
- Sau `endDate`, user mất quyền truy cập premium features

---

## Flow Diagram

```
┌─────────────────┐
│   Pricing Page  │
│  (View Plans)   │
└────────┬────────┘
         │
         │ User clicks "Get Started"
         ▼
┌─────────────────┐
│ Check Auth      │
│ - Not logged in │───► Redirect to /login
│ - Logged in     │
└────────┬────────┘
         │
         │ Open Payment Method Modal
         ▼
┌─────────────────┐
│ Select Method   │
│ - PayPal        │
│ - VNPay         │
│ - MoMo          │
└────────┬────────┘
         │
         │ Create Payment
         ▼
┌─────────────────┐
│ Payment Gateway │
│ (External)      │
└────────┬────────┘
         │
         │ User completes payment
         ▼
┌─────────────────┐
│ Callback URL    │
│ /payment/*/     │
│ callback        │
└────────┬────────┘
         │
         │ Verify Payment
         ▼
┌─────────────────┐
│ Update          │
│ Subscription    │
└────────┬────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│ Redirect to     │
│ Pricing/Dashboard│
└─────────────────┘
```

---

## API Endpoints

### Payment Service Methods

1. **Get Subscription Plans**
   - `GET /payments/plans`
   - Returns: List of active subscription plans

2. **Create VNPay Payment**
   - `POST /payments/vnpay/create`
   - Body: `{ planId: number }`
   - Returns: `{ success: true, data: { paymentUrl: string } }`

3. **Create MoMo Payment**
   - `POST /payments/momo/create`
   - Body: `{ planId: number }`
   - Returns: `{ success: true, data: { paymentUrl: string } }`

4. **Create PayPal Payment**
   - `POST /payments/paypal/create`
   - Body: `{ planId: number }`
   - Returns: `{ success: true, data: { orderId: string, ... } }`

5. **Verify VNPay Payment**
   - `GET /payments/vnpay/verify?{queryParams}`
   - Returns: `{ success: true, data: { payment: {...}, subscription: {...} } }`

6. **Verify MoMo Payment**
   - `GET /payments/momo/verify?{queryParams}`
   - Returns: `{ success: true, data: { payment: {...}, subscription: {...} } }`

7. **Get Subscription Status**
   - `GET /payments/subscription`
   - Returns: `{ success: true, data: { id, status, plan, startDate, endDate } }`

8. **Get Payment History**
   - `GET /payments/history`
   - Returns: `{ success: true, data: [payment records] }`

9. **Cancel Subscription**
   - `POST /payments/subscription/cancel`
   - Returns: `{ success: true, message: "..." }`

---

## Subscription Status

### Status Values
- `active`: Subscription đang hoạt động
- `expired`: Subscription đã hết hạn
- `cancelled`: Subscription đã bị hủy
- `pending`: Subscription đang chờ thanh toán

### Subscription Features

Khi user có `active` subscription, họ có quyền truy cập:

1. **AI Features:**
   - AI Matching (Job-Interpreter matching)
   - AI Recommended Interpreters
   - AI Ranked Applications
   - AI Suggested Jobs

2. **Advanced Features:**
   - Advanced Search Filters
   - Priority in search results
   - Advanced Analytics

3. **Premium Features:**
   - Unlimited applications
   - Export data
   - Priority support

---

## Error Handling

### Common Errors

1. **Authentication Required**
   - Error: User chưa đăng nhập
   - Action: Redirect to `/login` với return URL

2. **Free Plan Purchase**
   - Error: Không thể mua Free plan qua payment gateway
   - Action: Hiển thị error message, yêu cầu contact support

3. **Payment Creation Failed**
   - Error: Backend không tạo được payment URL
   - Action: Hiển thị error, cho phép retry

4. **Payment Verification Failed**
   - Error: Payment không được verify thành công
   - Action: Hiển thị error, user có thể contact support

5. **Payment Timeout**
   - Error: User không hoàn thành payment trong thời gian quy định
   - Action: Payment tự động expire, user cần tạo payment mới

---

## Security Considerations

1. **Authentication Check**
   - Tất cả payment operations yêu cầu authentication
   - Token được lưu trong localStorage

2. **Payment Verification**
   - Tất cả payments được verify qua backend
   - Không trust payment gateway response trực tiếp

3. **Subscription Status Check**
   - Subscription status được check từ backend
   - Frontend chỉ hiển thị, không quyết định access control

4. **Payment URL Security**
   - Payment URLs được tạo bởi backend
   - Frontend không tự tạo payment URLs

---

## Testing Scenarios

### Test Case 1: Successful VNPay Payment
1. User đăng nhập
2. Chọn Pro Plan
3. Chọn VNPay
4. Complete payment trên VNPay
5. Verify subscription được activate

### Test Case 2: Failed Payment
1. User đăng nhập
2. Chọn Pro Plan
3. Chọn VNPay
4. Cancel payment trên VNPay
5. Verify subscription không được activate

### Test Case 3: Subscription Expiry
1. User có subscription sắp hết hạn
2. Verify features bị disable sau khi hết hạn
3. User cần renew để tiếp tục sử dụng

### Test Case 4: Multiple Payment Methods
1. Test với VNPay
2. Test với MoMo
3. Test với PayPal
4. Verify tất cả đều hoạt động đúng

---

## Future Enhancements

1. **PayPal SDK Integration**
   - Integrate PayPal SDK để xử lý payment trực tiếp trong app
   - Không cần redirect ra ngoài

2. **Payment History Page**
   - Tạo dedicated page để xem payment history
   - Filter và search payments

3. **Subscription Management Page**
   - Page để quản lý subscription
   - Upgrade/Downgrade plans
   - View billing history

4. **Auto-renewal**
   - Tự động renew subscription khi hết hạn
   - Email notification trước khi renew

5. **Trial Period**
   - Free trial cho new users
   - Auto-convert to paid after trial

---

## Notes

- Tất cả payment amounts được tính bằng USD
- Yearly billing có discount 10%
- Free plan không thể mua qua payment gateway
- Subscription status được check real-time từ backend
- Payment callbacks được handle tự động khi user quay lại từ gateway

