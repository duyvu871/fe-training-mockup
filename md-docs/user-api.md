# User Management API Routes

## 1. Tạo người dùng mới

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users` |
| Request Method | POST |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền tạo người dùng* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "role": "ADMIN|CASHIER"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| username | Chuỗi ký tự | 50 | ✓ | Tên đăng nhập (duy nhất, 3-50 ký tự) |
| email | Chuỗi ký tự | 255 | ✓ | Email (duy nhất, định dạng email hợp lệ) |
| password | Chuỗi ký tự | 72 | ✓ | Mật khẩu (tối thiểu 6 ký tự) |
| firstName | Chuỗi ký tự | 50 | | Họ |
| lastName | Chuỗi ký tự | 50 | | Tên |
| phone | Chuỗi ký tự | 15 | | Số điện thoại VN (0xxxxxxxxx) |
| role | Chuỗi | - | ✓ | Vai trò: ADMIN hoặc CASHIER |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**
```json
{
  "success": true,
  "message": "Tạo người dùng thành công",
  "data": {
    "id": "uuid",
    "username": "cashier01",
    "email": "cashier01@example.com",
    "firstName": "Trần",
    "lastName": "Thị B",
    "phone": "0987654321",
    "role": "CASHIER",
    "isActive": true,
    "lastLoginAt": null,
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 2. Lấy danh sách người dùng

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền truy cập* |
| Query params | page, limit, search, role, isActive |

### 2.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| page | Số nguyên | 1 | | Trang hiện tại (>= 1) |
| limit | Số nguyên | 20 | | Số items mỗi trang (1-100) |
| search | Chuỗi ký tự | - | | Tìm kiếm theo username, email, họ tên |
| role | Chuỗi | - | | Lọc theo vai trò: ADMIN, CASHIER |
| isActive | Boolean | - | | Lọc theo trạng thái hoạt động |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "admin",
        "email": "admin@pos.local",
        "firstName": "Quản",
        "lastName": "Trị",
        "phone": "0123456789",
        "role": "ADMIN",
        "isActive": true,
        "lastLoginAt": "2025-01-20T09:30:00.000Z",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 3. Lấy chi tiết người dùng theo ID

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users/{id}` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền truy cập* |
| Path params | id (UUID của người dùng) |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": "uuid",
    "username": "cashier01",
    "email": "cashier01@example.com",
    "firstName": "Trần",
    "lastName": "Thị B",
    "phone": "0987654321",
    "role": "CASHIER",
    "isActive": true,
    "lastLoginAt": "2025-01-20T08:30:00.000Z",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z",
    "stats": {
      "totalOrders": 45,
      "totalRevenue": 2250000,
      "lastOrderAt": "2025-01-20T09:45:00.000Z"
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 4. Cập nhật thông tin người dùng

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users/{id}` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền cập nhật* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "role": "ADMIN|CASHIER",
  "isActive": true
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| username | Chuỗi ký tự | 50 | | Tên đăng nhập (duy nhất, 3-50 ký tự) |
| email | Chuỗi ký tự | 255 | | Email (duy nhất, định dạng email hợp lệ) |
| firstName | Chuỗi ký tự | 50 | | Họ |
| lastName | Chuỗi ký tự | 50 | | Tên |
| phone | Chuỗi ký tự | 15 | | Số điện thoại VN (0xxxxxxxxx) |
| role | Chuỗi | - | | Vai trò: ADMIN hoặc CASHIER |
| isActive | Boolean | - | | Trạng thái hoạt động |

### 4.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật người dùng thành công",
  "data": {
    "id": "uuid",
    "username": "cashier01_updated",
    "email": "cashier01_updated@example.com",
    "firstName": "Trần",
    "lastName": "Thị B",
    "phone": "0987654321",
    "role": "CASHIER",
    "isActive": true,
    "lastLoginAt": "2025-01-20T08:30:00.000Z",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-20T11:30:00.000Z"
  },
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

## 5. Xóa người dùng

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users/{id}` |
| Request Method | DELETE |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền xóa* |
| Path params | id (UUID của người dùng) |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Xóa người dùng thành công",
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Không thể xóa chính mình",
  "error": "CANNOT_DELETE_SELF",
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

*Ghi chú: Admin không thể xóa chính mình*

## 6. Reset mật khẩu người dùng

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users/{id}/reset-password` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền reset* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "newPassword": "string"
}
```

### 6.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| newPassword | Chuỗi ký tự | 72 | ✓ | Mật khẩu mới (tối thiểu 6 ký tự) |

### 6.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Reset mật khẩu thành công",
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

## 7. Lấy thống kê người dùng

### 7.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/users/stats` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền truy cập* |
| Body data | Không có |

### 7.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê người dùng thành công",
  "data": {
    "stats": {
      "total": 25,
      "active": 22,
      "inactive": 3,
      "admins": 2,
      "cashiers": 23,
      "newThisMonth": 3,
      "loginStats": {
        "todayLogins": 15,
        "thisWeekLogins": 22,
        "neverLoggedIn": 2
      },
      "topPerformers": [
        {
          "username": "cashier01",
          "totalOrders": 156,
          "totalRevenue": 7800000
        },
        {
          "username": "cashier02", 
          "totalOrders": 134,
          "totalRevenue": 6700000
        }
      ],
      "recentActivities": [
        {
          "action": "LOGIN",
          "username": "cashier01",
          "timestamp": "2025-01-20T09:30:00.000Z"
        },
        {
          "action": "CREATE",
          "username": "cashier03",
          "timestamp": "2025-01-20T08:15:00.000Z"
        }
      ]
    }
  },
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

## Quy tắc nghiệp vụ

### Tạo người dùng:
- Username và email phải duy nhất trong hệ thống
- Mật khẩu sẽ được mã hóa bằng bcrypt
- Mặc định isActive = true
- Không thể tạo nhiều hơn 1 ADMIN (có thể cấu hình)

### Cập nhật người dùng:
- Không thể cập nhật username/email trùng với người khác
- Có thể tạm khóa tài khoản (isActive = false)
- Admin có thể thay đổi role của người khác

### Xóa người dùng:
- Admin không thể xóa chính mình
- Xóa vĩnh viễn, không thể khôi phục
- Các đơn hàng của user vẫn được giữ lại

### Quyền truy cập:
- **ADMIN**: Toàn quyền quản lý user
- **CASHIER**: Không có quyền truy cập User Management API

### Bảo mật:
- Mật khẩu không bao giờ được trả về trong response
- Token sẽ bị vô hiệu hóa khi user bị khóa
- Ghi log tất cả hoạt động quản lý user
