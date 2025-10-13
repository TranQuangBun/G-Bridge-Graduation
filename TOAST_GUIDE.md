# Toast Notification System - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Đã thay thế `alert()` của browser bằng Toast notification đẹp và chuyên nghiệp với các tính năng:

- ✅ Tự động hiển thị và ẩn
- ✅ 4 loại thông báo: Success, Error, Warning, Info
- ✅ Progress bar hiển thị thời gian còn lại
- ✅ Animation mượt mà (slide in/out)
- ✅ Icon đẹp cho mỗi loại
- ✅ Có thể đóng thủ công
- ✅ Responsive trên mobile
- ✅ Có thể hiển thị nhiều toast cùng lúc

## 🎨 Các Loại Toast

### 1. Success (Xanh lá)

```jsx
showSuccess("Đăng nhập thành công!");
```

### 2. Error (Đỏ)

```jsx
showError("Đăng nhập thất bại. Vui lòng thử lại!");
```

### 3. Warning (Vàng/Cam)

```jsx
showWarning("Mật khẩu của bạn sắp hết hạn!");
```

### 4. Info (Xanh dương)

```jsx
showInfo("Chào mừng bạn quay lại G-Bridge!");
```

## 🔧 Cách Sử Dụng

### Bước 1: Import hook và component

```jsx
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/Toast";
```

### Bước 2: Sử dụng hook trong component

```jsx
const MyComponent = () => {
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } =
    useToast();

  // Your code...
};
```

### Bước 3: Thêm ToastContainer vào JSX

```jsx
return (
  <div className="my-page">
    <ToastContainer toasts={toasts} removeToast={removeToast} />

    {/* Your other content */}
  </div>
);
```

### Bước 4: Hiển thị toast khi cần

```jsx
const handleSubmit = async () => {
  try {
    const result = await someApiCall();

    if (result.success) {
      showSuccess("Thành công!");
      // Redirect sau 500ms để user kịp thấy toast
      setTimeout(() => navigate("/dashboard"), 500);
    } else {
      showError(result.error || "Có lỗi xảy ra!");
    }
  } catch (error) {
    showError("Lỗi kết nối!");
  }
};
```

## ⚙️ Tùy Chỉnh

### Thay đổi thời gian hiển thị (mặc định 3000ms = 3s)

```jsx
// Hiển thị 5 giây
showSuccess("Thông báo này sẽ hiển thị 5 giây", 5000);

// Hiển thị 2 giây
showError("Lỗi nhanh", 2000);
```

### Sử dụng addToast với tùy chỉnh đầy đủ

```jsx
const { addToast } = useToast();

addToast("Custom message", "success", 4000);
addToast("Another message", "error", 6000);
```

## 📍 Vị Trí

Toast sẽ xuất hiện ở:

- **Desktop**: Góc trên bên phải màn hình (top: 80px, right: 20px)
- **Mobile**: Giữa màn hình ở phía trên (top: 70px, centered)

## 🎯 Đã Áp Dụng Trong

### ✅ LoginPage (`src/pages/Login/LoginPage.jsx`)

- Thông báo đăng nhập thành công
- Thông báo lỗi đăng nhập
- Redirect sau 500ms để user thấy toast

### ✅ RegisterPage (`src/pages/Register/RegisterPage.jsx`)

- Thông báo đăng ký thành công
- Thông báo lỗi đăng ký
- Redirect sau 500ms để user thấy toast

## 📁 Cấu Trúc Files

```
src/
├── components/
│   └── Toast/
│       ├── Toast.jsx              # Component Toast đơn lẻ
│       ├── Toast.css              # Styles cho Toast
│       ├── ToastContainer.jsx     # Container chứa nhiều toasts
│       ├── ToastContainer.css     # Styles cho container
│       └── index.js               # Export barrel
├── hooks/
│   └── useToast.js                # Custom hook quản lý toasts
```

## 🎨 Thiết Kế

### Colors

- **Success**: `#10b981` (Emerald-500)
- **Error**: `#ef4444` (Red-500)
- **Warning**: `#f59e0b` (Amber-500)
- **Info**: `#3b82f6` (Blue-500)

### Animation

- **Slide in**: 0.3s cubic-bezier (bounce effect)
- **Progress bar**: Linear countdown
- **Border left**: 4px solid color theo type

### Shadow

- Multiple shadow layers cho depth
- Box shadow: `0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)`

## 📱 Responsive

### Desktop (> 768px)

- Width: 320px - 420px
- Position: Fixed top-right
- Gap between toasts: 12px

### Mobile (≤ 768px)

- Width: 280px - calc(100vw - 32px)
- Position: Fixed top-center
- Smaller icons and text

## 🚀 Ví Dụ Nâng Cao

### Hiển thị nhiều toasts liên tiếp

```jsx
const handleMultipleActions = async () => {
  showInfo("Đang xử lý...");

  try {
    await step1();
    showSuccess("Bước 1 hoàn thành!");

    await step2();
    showSuccess("Bước 2 hoàn thành!");

    await step3();
    showSuccess("Hoàn tất tất cả!");
  } catch (error) {
    showError("Có lỗi xảy ra ở bước " + error.step);
  }
};
```

### Form validation với toast

```jsx
const validateForm = () => {
  if (!email) {
    showError("Vui lòng nhập email!");
    return false;
  }

  if (!password) {
    showError("Vui lòng nhập mật khẩu!");
    return false;
  }

  if (password.length < 6) {
    showWarning("Mật khẩu phải có ít nhất 6 ký tự!");
    return false;
  }

  return true;
};
```

### Loading state với toast

```jsx
const handleUpload = async (file) => {
  const toastId = showInfo("Đang tải lên...", 0); // 0 = không tự động ẩn

  try {
    await uploadFile(file);
    removeToast(toastId); // Xóa toast "Đang tải lên"
    showSuccess("Tải lên thành công!");
  } catch (error) {
    removeToast(toastId);
    showError("Tải lên thất bại!");
  }
};
```

## 🔍 So Sánh

### ❌ Trước (Browser Alert)

```jsx
// Xấu, blocking UI, không customize được
alert("Đăng nhập thành công!");
```

### ✅ Bây giờ (Custom Toast)

```jsx
// Đẹp, không blocking, có animation, nhiều options
showSuccess("Đăng nhập thành công!");
```

## 💡 Tips & Best Practices

1. **Timing**: Đặt timeout 500ms trước khi redirect để user kịp thấy toast
2. **Message**: Giữ message ngắn gọn, rõ ràng (< 60 ký tự)
3. **Type**: Chọn đúng type cho từng tình huống
   - Success: Hành động thành công
   - Error: Lỗi, thất bại
   - Warning: Cảnh báo, lưu ý
   - Info: Thông tin chung
4. **Duration**:
   - Success: 3s (mặc định)
   - Error: 4-5s (để user đọc kỹ)
   - Warning: 4-5s
   - Info: 3s

## 🎯 Tương Lai

Có thể mở rộng thêm:

- [ ] Toast với actions (Undo, Retry, etc.)
- [ ] Toast với images/avatars
- [ ] Toast position options (top, bottom, left, right)
- [ ] Toast with sound effects
- [ ] Toast với rich content (HTML)
- [ ] Queue management (giới hạn số toast hiển thị)

## 🐛 Troubleshooting

### Toast không hiển thị?

1. Check đã import `useToast` hook chưa
2. Check đã thêm `<ToastContainer>` vào JSX chưa
3. Check console có lỗi không

### Toast không tự ẩn?

1. Check `duration` có được truyền đúng không
2. Check `onClose` có được bind đúng không

### Multiple toasts chồng lên nhau?

- Đây là tính năng, không phải bug! Toasts sẽ stack theo chiều dọc với gap 12px

---

**Created**: 2025-10-12  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
