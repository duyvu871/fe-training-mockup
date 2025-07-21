# Category API Routes

## 1. Tạo danh mục mới

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/categories` |
| Request Method | POST |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền tạo danh mục* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "name": "string",
  "description": "string",
  "isActive": true
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| name | Chuỗi ký tự | 100 | ✓ | Tên danh mục (duy nhất) |
| description | Chuỗi ký tự | 500 | | Mô tả danh mục |
| isActive | Boolean | - | | Trạng thái hoạt động (mặc định true) |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**
```json
{
  "success": true,
  "message": "Tạo danh mục thành công",
  "data": {
    "id": "uuid",
    "name": "Đồ uống",
    "description": "Các loại đồ uống nóng và lạnh",
    "isActive": true,
    "productCount": 0,
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 2. Lấy danh sách danh mục

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/categories` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Query params | isActive |

### 2.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| isActive | Boolean | - | | Lọc theo trạng thái hoạt động |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công",
  "data": [
    {
      "id": "uuid",
      "name": "Đồ uống",
      "description": "Các loại đồ uống nóng và lạnh",
      "isActive": true,
      "productCount": 15,
      "createdAt": "2025-01-20T10:30:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Thức ăn nhanh",
      "description": "Các món ăn nhanh, tiện lợi",
      "isActive": true,
      "productCount": 8,
      "createdAt": "2025-01-20T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 3. Lấy chi tiết danh mục theo ID

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/categories/{id}` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Path params | id (UUID của danh mục) |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin danh mục thành công",
  "data": {
    "id": "uuid",
    "name": "Đồ uống",
    "description": "Các loại đồ uống nóng và lạnh",
    "isActive": true,
    "productCount": 15,
    "products": [
      {
        "id": "uuid",
        "name": "Cà phê sữa đá",
        "sku": "CF-SUA-DA",
        "price": 25000,
        "stock": 100
      }
    ],
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 4. Cập nhật danh mục

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/categories/{id}` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền cập nhật* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "name": "string",
  "description": "string",
  "isActive": true
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| name | Chuỗi ký tự | 100 | | Tên danh mục (duy nhất) |
| description | Chuỗi ký tự | 500 | | Mô tả danh mục |
| isActive | Boolean | - | | Trạng thái hoạt động |

### 4.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật danh mục thành công",
  "data": {
    "id": "uuid",
    "name": "Đồ uống - cập nhật",
    "description": "Các loại đồ uống nóng và lạnh - đã cập nhật",
    "isActive": true,
    "productCount": 15,
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T11:30:00.000Z"
  },
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

## 5. Xóa danh mục

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/categories/{id}` |
| Request Method | DELETE |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền xóa* |
| Path params | id (UUID của danh mục) |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Xóa danh mục thành công",
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Không thể xóa danh mục có sản phẩm",
  "error": "CATEGORY_HAS_PRODUCTS",
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

*Ghi chú: Chỉ có thể xóa danh mục không có sản phẩm nào*

## 6. Lấy thống kê danh mục

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/categories/stats` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền truy cập* |
| Body data | Không có |

### 6.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê danh mục thành công",
  "data": {
    "stats": {
      "total": 8,
      "active": 7,
      "inactive": 1,
      "withProducts": 6,
      "withoutProducts": 2,
      "mostProductsCategory": {
        "name": "Đồ uống",
        "productCount": 25
      },
      "categoryDistribution": [
        {
          "name": "Đồ uống",
          "productCount": 25,
          "percentage": 35.7
        },
        {
          "name": "Thức ăn nhanh",
          "productCount": 18,
          "percentage": 25.7
        },
        {
          "name": "Bánh kẹo",
          "productCount": 12,
          "percentage": 17.1
        }
      ],
      "recentActivities": [
        {
          "action": "CREATE",
          "categoryName": "Thức uống có cồn",
          "createdAt": "2025-01-20T09:30:00.000Z"
        }
      ]
    }
  },
  "timestamp": "2025-01-20T11:30:00.000Z"
}
```

## Quy tắc nghiệp vụ

### Tạo danh mục:
- Tên danh mục phải duy nhất trong hệ thống
- Tên không được chứa ký tự đặc biệt
- Mặc định isActive = true

### Cập nhật danh mục:
- Không thể cập nhật tên trùng với danh mục khác
- Có thể tạm dừng danh mục (isActive = false)
- Khi tạm dừng, sản phẩm thuộc danh mục vẫn có thể bán

### Xóa danh mục:
- Chỉ xóa được danh mục không có sản phẩm
- Nếu có sản phẩm, cần chuyển sản phẩm sang danh mục khác trước
- Không thể khôi phục sau khi xóa

### Quyền truy cập:
- **ADMIN**: Toàn quyền CRUD và xem thống kê
- **CASHIER**: Chỉ có thể xem danh sách (để chọn khi tạo/sửa sản phẩm)
