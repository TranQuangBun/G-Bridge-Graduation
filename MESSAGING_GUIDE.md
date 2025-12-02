# 📱 Hướng dẫn sử dụng tính năng Chat/Messaging

## 🎯 Khi nào bạn thấy nút "Nhắn tin" (💬)?

### ✅ Điều kiện để hiển thị nút chat:

**Nút chat chỉ xuất hiện khi:**
1. ✅ Application status = **"approved"** (đã được chấp nhận)
2. ✅ Bạn đang xem chi tiết application trong modal

---

## 👥 Theo từng Role:

### 🏢 **CLIENT (Nhà tuyển dụng):**

**Vị trí hiển thị nút chat:**
- 📍 Trang: **My Applications** (`/dashboard/applications`)
- 📍 Vị trí: Trong **Modal chi tiết application** (khi click "View Details")
- 📍 Vị trí cụ thể: Phần **Modal Actions** (dưới cùng của modal)

**Khi nào thấy:**
1. ✅ Bạn đã **chấp nhận** đơn ứng tuyển (click "Chấp nhận")
2. ✅ Application status = **"approved"**
3. ✅ Bạn đang xem chi tiết application của một interpreter

**Các nút trong modal (Client view):**
```
┌─────────────────────────────────┐
│  [Xem CV] [Chấp nhận] [Từ chối] │
│  [Liên hệ ứng viên] [💬 Nhắn tin] │ ← Nút chat ở đây
└─────────────────────────────────┘
```

---

### 👤 **INTERPRETER (Phiên dịch viên):**

**Vị trí hiển thị nút chat:**
- 📍 Trang: **My Applications** (`/dashboard/applications`)
- 📍 Vị trí: Trong **Modal chi tiết application** (khi click "View Details")
- 📍 Vị trí cụ thể: Phần **Modal Actions** (dưới cùng của modal)

**Khi nào thấy:**
1. ✅ Nhà tuyển dụng đã **chấp nhận** đơn ứng tuyển của bạn
2. ✅ Application status = **"approved"**
3. ✅ Bạn đang xem chi tiết application của mình

**Các nút trong modal (Interpreter view):**
```
┌─────────────────────────────────┐
│  [💬 Nhắn tin] [Liên hệ công ty] │ ← Nút chat ở đây
│  [Rút đơn]                       │
└─────────────────────────────────┘
```

---

## 🔄 Quy trình hoàn chỉnh:

### **Bước 1: Ứng viên nộp đơn**
- Interpreter apply cho job
- Status = **"pending"**
- ❌ **KHÔNG có nút chat** (chưa được chấp nhận)

### **Bước 2: Nhà tuyển dụng chấp nhận**
- Client click "Chấp nhận" trong modal application
- Status = **"approved"**
- ✅ **CẢ HAI** đều thấy nút chat

### **Bước 3: Bắt đầu chat**
- Click nút **"💬 Nhắn tin"**
- Hệ thống tự động:
  - Tạo conversation (nếu chưa có)
  - Chuyển đến trang Messages (`/messages`)
  - Mở conversation với người kia

---

## 📍 Các vị trí khác có thể có nút chat:

### **1. Trang Messages (`/messages`)**
- ✅ Luôn có sẵn khi đã có conversation
- ✅ Hiển thị danh sách tất cả conversations
- ✅ Click vào conversation để chat

### **2. Từ URL**
- ✅ Có thể truy cập trực tiếp: `/messages?conversation=123`
- ✅ Hệ thống tự động mở conversation đó

---

## ⚠️ Lưu ý quan trọng:

### **Khi KHÔNG thấy nút chat:**
- ❌ Application status ≠ "approved"
- ❌ Application status = "pending" → Chưa được chấp nhận
- ❌ Application status = "rejected" → Đã bị từ chối
- ❌ Application status = "withdrawn" → Đã rút đơn

### **Backend Protection:**
- 🔒 Backend **KIỂM TRA** approval trước khi tạo conversation
- 🔒 Nếu không có approved application → **LỖI 403**
- 🔒 Chỉ client-interpreter pair với approved application mới chat được

---

## 🎨 UI/UX:

### **Nút chat:**
- 🟢 Màu xanh lá (green gradient)
- 💬 Icon: 💬
- 📝 Text: "Nhắn tin" / "Start Chat"
- ✨ Hiệu ứng hover: Scale up + shadow

### **Vị trí trong modal:**
- 📍 Ở phần **Modal Actions** (dưới cùng)
- 📍 Bên cạnh các nút khác (Contact, Accept, Reject)
- 📍 Chỉ hiển thị khi status = "approved"

---

## 📝 Tóm tắt nhanh:

| Role | Khi nào thấy? | Ở đâu? |
|------|---------------|--------|
| **Client** | Application đã approved | Modal chi tiết application |
| **Interpreter** | Application đã approved | Modal chi tiết application |
| **Cả hai** | Đã có conversation | Trang Messages (`/messages`) |

---

## 🚀 Cách sử dụng:

1. **Nhà tuyển dụng**: Chấp nhận application → Thấy nút chat → Click để chat
2. **Ứng viên**: Đợi được chấp nhận → Thấy nút chat → Click để chat
3. **Cả hai**: Vào `/messages` để xem tất cả conversations

---

**Last Updated**: 2025

