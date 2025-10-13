# Company Header Features - Post Job Button

## 📋 Tổng Quan

Đã thêm nút "Post Job" (Đăng tin tuyển dụng) vào Header cho user có role là **Company/Client**. Nút này xuất hiện cạnh notification bell và avatar.

## ✨ Tính Năng Mới

### 🎯 Header cho Company (Client Role)

Khi user đăng nhập với role **client** (Company), header sẽ hiển thị:

```
[Logo] [Navigation] [Post Job Button] [🔔 Bell] [👤 Avatar ▼]
```

### 📱 Responsive Design

**Desktop:**

- Nút "Post Job" ở giữa notification và avatar
- Design gradient xanh dương với hiệu ứng hover
- Icon dấu cộng + text

**Mobile:**

- Nút full-width ở đầu user actions
- Design nổi bật với gradient và shadow
- Kích thước lớn hơn để dễ nhấn

## 🎨 Design Specifications

### Desktop Button

```css
- Background: Linear gradient #0a65cc → #0845a3
- Padding: 0.625rem 1.25rem
- Border radius: 12px
- Font weight: 600
- Box shadow: 0 4px 12px rgba(10,101,204,0.3)
- Hover effect: translateY(-2px) + enhanced shadow
- Shimmer effect on hover
```

### Mobile Button

```css
- Full width
- Padding: 1rem 1.25rem
- Centered content
- Larger touch target
- Same gradient and colors
- Margin bottom for spacing
```

## 🔧 Implementation Details

### 1. Translation Keys Added

**Vietnamese (vi.js):**

```javascript
common: {
  postJob: "Đăng tin tuyển dụng";
}
```

**English (en.js):**

```javascript
common: {
  postJob: "Post a Job";
}
```

### 2. Header Component Changes

**Desktop View:**

```jsx
{
  user?.role === "client" && (
    <Link to="/post-job" className="post-job-btn">
      <svg>{/* Plus icon */}</svg>
      <span>{t("common.postJob")}</span>
    </Link>
  );
}
```

**Mobile View:**

```jsx
{
  user?.role === "client" && (
    <Link to="/post-job" className="mobile-post-job-btn">
      <svg>{/* Plus icon */}</svg>
      {t("common.postJob")}
    </Link>
  );
}
```

### 3. CSS Classes

**Desktop:**

- `.post-job-btn` - Main button style
- Gradient background with shimmer effect
- Smooth hover animations
- Box shadow for depth

**Mobile:**

- `.mobile-post-job-btn` - Full-width button
- Same visual style as desktop
- Larger touch target
- Positioned first in user actions

## 🚀 User Flow

### Đăng Ký với Company Role

1. User chọn role "Company" trong form đăng ký
2. Điền thông tin công ty (Company Name, Company Type)
3. Sau khi đăng ký thành công → Toast notification
4. **Redirect về HOME** (không phải dashboard)
5. Header hiển thị: [Post Job] [Bell] [Avatar]

### Đăng Nhập với Company Account

1. User đăng nhập với tài khoản company
2. Toast notification đăng nhập thành công
3. **Redirect về HOME**
4. Header hiển thị nút "Post Job"

### Click Post Job Button

1. Click vào nút "Post Job"
2. Navigate to `/post-job` route
3. Hiển thị form đăng tin tuyển dụng (cần implement)

## 📍 Routes Affected

### Register & Login Redirect Logic

**Interpreter:**

```javascript
navigate(ROUTES.DASHBOARD); // /dashboard
```

**Client (Company):**

```javascript
navigate(ROUTES.HOME); // /home (updated)
```

**Admin:**

```javascript
navigate("/admin/dashboard");
```

## 🎭 Conditional Rendering

### Role-Based Button Display

```javascript
// Only show for client role
{
  user?.role === "client" && <PostJobButton />;
}
```

### Other Roles

**Interpreter:**

- ✅ Bell icon
- ✅ Avatar with dropdown
- ❌ Post Job button
- ✅ "Saved Jobs" in dropdown

**Admin:**

- ✅ Bell icon
- ✅ Avatar with dropdown
- ❌ Post Job button
- ❌ "Saved Jobs" in dropdown

**Client (Company):**

- ✅ Bell icon
- ✅ Avatar with dropdown
- ✅ **Post Job button** (NEW)
- ❌ "Saved Jobs" in dropdown

## 🎨 Visual Preview

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [G] G-Bridge  [Home] [Find Job] [Dashboard]  [Đăng tin] 🔔 👤│
│                                               [tuyển dụng]    │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌──────────────────────┐
│ ☰                    │
└──────────────────────┘
  ┌────────────────────┐
  │ [Đăng tin tuyển dụng]│
  │     with icon      │
  ├────────────────────┤
  │ 👤 User Info       │
  ├────────────────────┤
  │ 👤 Profile         │
  │ 📊 Dashboard       │
  │ ⚙️ Settings        │
  │ 🚪 Logout          │
  └────────────────────┘
```

## 📝 Files Modified

### 1. Components

- `src/components/Header/Header.jsx`

  - Added Post Job button for desktop
  - Added Post Job button for mobile
  - Conditional rendering based on user role

- `src/components/Header/Header.css`
  - `.post-job-btn` styles
  - `.mobile-post-job-btn` styles
  - Gradient, animations, hover effects

### 2. Translations

- `src/translet/languages/vi.js`

  - Added `postJob: "Đăng tin tuyển dụng"`

- `src/translet/languages/en.js`
  - Added `postJob: "Post a Job"`

### 3. Pages

- `src/pages/Register/RegisterPage.jsx`

  - Updated client redirect: HOME instead of dashboard

- `src/pages/Login/LoginPage.jsx`
  - Updated client redirect: HOME instead of dashboard

## 🔮 Next Steps

### Cần Implement

1. **Post Job Page** (`/post-job`)

   - Form đăng tin tuyển dụng
   - Các fields: Job title, description, requirements, salary, etc.
   - Submit to backend API
   - Success/Error handling

2. **Company Dashboard** (`/company/dashboard`)

   - List of posted jobs
   - Job statistics
   - Applications received
   - Manage job postings

3. **Backend API**

   - POST `/api/jobs` - Create new job
   - GET `/api/jobs/company/:id` - Get company's jobs
   - PUT `/api/jobs/:id` - Update job
   - DELETE `/api/jobs/:id` - Delete job

4. **Database**
   - `jobs` table
   - Fields: id, clientId, title, description, requirements, salary, location, type, status, etc.

## 🎯 Testing Checklist

### Manual Testing

- [ ] Đăng ký với role "Company"
- [ ] Kiểm tra redirect về HOME
- [ ] Kiểm tra nút "Post Job" hiển thị trong header
- [ ] Kiểm tra nút không hiển thị cho Interpreter
- [ ] Test hover effect trên desktop
- [ ] Test responsive trên mobile
- [ ] Test click vào nút (navigate to /post-job)
- [ ] Test với cả 2 ngôn ngữ (VI/EN)
- [ ] Test dropdown avatar vẫn hoạt động
- [ ] Test notification bell vẫn hoạt động

### Visual Testing

- [ ] Button alignment đúng vị trí
- [ ] Gradient colors hiển thị đẹp
- [ ] Hover effect smooth
- [ ] Mobile button full-width
- [ ] Icon + text alignment
- [ ] Gap spacing hợp lý

## 💡 Tips

### Customize Button

Để thay đổi style của nút Post Job:

```css
/* Desktop */
.post-job-btn {
  background: linear-gradient(135deg, #custom1, #custom2);
  padding: /* custom padding */ ;
  /* etc */
}

/* Mobile */
.mobile-post-job-btn {
  /* custom styles */
}
```

### Thay đổi Icon

Trong Header.jsx, tìm phần Post Job button và thay SVG:

```jsx
<svg width="18" height="18" viewBox="0 0 24 24">
  {/* Your custom icon path */}
</svg>
```

### Thay đổi Route

Để redirect đến URL khác:

```jsx
<Link to="/custom-route" className="post-job-btn">
```

## 🔍 So Sánh Role-Based Headers

| Feature               | Interpreter | Client   | Admin           |
| --------------------- | ----------- | -------- | --------------- |
| Navigation            | ✅          | ✅       | ✅              |
| Language Switch       | ✅          | ✅       | ✅              |
| **Post Job Button**   | ❌          | ✅       | ❌              |
| Notification Bell     | ✅          | ✅       | ✅              |
| Avatar Dropdown       | ✅          | ✅       | ✅              |
| Saved Jobs (dropdown) | ✅          | ❌       | ❌              |
| Redirect after login  | Dashboard   | **Home** | Admin Dashboard |

## 🎨 Color Palette

```css
Primary Blue: #0a65cc
Darker Blue: #0845a3
Darkest Blue: #062e7a
White: #ffffff
Shadow: rgba(10, 101, 204, 0.3)
```

## 📚 Related Documentation

- [HEADER_GUIDE.md](./HEADER_GUIDE.md) - Header authentication features
- [TOAST_GUIDE.md](./TOAST_GUIDE.md) - Toast notification system
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Frontend-Backend integration

---

**Created**: 2025-10-12  
**Version**: 1.0.0  
**Status**: ✅ Completed  
**Next**: Implement Post Job Page
