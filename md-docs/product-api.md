# Product API Routes

## 1. Tạo sản phẩm mới

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products` |
| Request Method | POST |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền tạo sản phẩm* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "name": "string",
  "sku": "string",
  "description": "string",
  "price": 0,
  "cost": 0,
  "stock": 0,
  "minStock": 0,
  "unit": "string",
  "barcode": "string",
  "image": "string",
  "categoryId": "string"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| name | Chuỗi ký tự | 255 | ✓ | Tên sản phẩm |
| sku | Chuỗi ký tự | 100 | ✓ | Mã SKU (duy nhất) |
| description | Chuỗi ký tự | 1000 | | Mô tả sản phẩm |
| price | Số thập phân | - | ✓ | Giá bán (>= 0) |
| cost | Số thập phân | - | | Giá vốn (>= 0) |
| stock | Số nguyên | - | | Số lượng tồn kho (>= 0, mặc định 0) |
| minStock | Số nguyên | - | | Số lượng tồn kho tối thiểu (>= 0, mặc định 0) |
| unit | Chuỗi ký tự | 50 | | Đơn vị tính (cái, lon, kg, ly, ...) |
| barcode | Chuỗi ký tự | 100 | | Mã vạch sản phẩm |
| image | Chuỗi ký tự | 500 | | URL hình ảnh sản phẩm |
| categoryId | UUID | - | ✓ | ID danh mục sản phẩm |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**
```json
{
  "success": true,
  "message": "Tạo sản phẩm thành công",
  "data": {
    "id": "uuid",
    "name": "Cà phê sữa đá",
    "sku": "CF-SUA-DA",
    "description": "Cà phê phin truyền thống với sữa đặc",
    "price": 25000,
    "cost": 15000,
    "stock": 100,
    "minStock": 10,
    "unit": "ly",
    "barcode": "1234567890123",
    "image": "https://example.com/cafe-sua-da.jpg",
    "categoryId": "uuid",
    "isActive": true,
    "category": {
      "id": "uuid",
      "name": "Đồ uống"
    },
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 2. Lấy danh sách sản phẩm

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Query params | page, limit, search, categoryId, isActive |

### 2.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| page | Số nguyên | 1 | | Trang hiện tại (>= 1) |
| limit | Số nguyên | 20 | | Số items mỗi trang (1-100) |
| search | Chuỗi ký tự | - | | Tìm kiếm theo tên, SKU hoặc barcode |
| categoryId | UUID | - | | Lọc theo danh mục |
| isActive | Boolean | - | | Lọc theo trạng thái hoạt động |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm thành công",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Cà phê sữa đá",
        "sku": "CF-SUA-DA",
        "price": 25000,
        "stock": 100,
        "minStock": 10,
        "unit": "ly",
        "isActive": true,
        "category": {
          "id": "uuid",
          "name": "Đồ uống"
        },
        "createdAt": "2025-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 3. Lấy chi tiết sản phẩm theo ID

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products/{id}` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Path params | id (UUID của sản phẩm) |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin sản phẩm thành công",
  "data": {
    "id": "uuid",
    "name": "Cà phê sữa đá",
    "sku": "CF-SUA-DA",
    "description": "Cà phê phin truyền thống với sữa đặc",
    "price": 25000,
    "cost": 15000,
    "stock": 100,
    "minStock": 10,
    "unit": "ly",
    "barcode": "1234567890123",
    "image": "https://example.com/cafe-sua-da.jpg",
    "categoryId": "uuid",
    "isActive": true,
    "category": {
      "id": "uuid",
      "name": "Đồ uống",
      "description": "Các loại đồ uống nóng và lạnh"
    },
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 4. Cập nhật sản phẩm

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products/{id}` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền cập nhật* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "name": "string",
  "sku": "string", 
  "description": "string",
  "price": 0,
  "cost": 0,
  "minStock": 0,
  "unit": "string",
  "barcode": "string",
  "image": "string",
  "categoryId": "string",
  "isActive": true
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| name | Chuỗi ký tự | 255 | | Tên sản phẩm |
| sku | Chuỗi ký tự | 100 | | Mã SKU (duy nhất) |
| description | Chuỗi ký tự | 1000 | | Mô tả sản phẩm |
| price | Số thập phân | - | | Giá bán (>= 0) |
| cost | Số thập phân | - | | Giá vốn (>= 0) |
| minStock | Số nguyên | - | | Số lượng tồn kho tối thiểu (>= 0) |
| unit | Chuỗi ký tự | 50 | | Đơn vị tính |
| barcode | Chuỗi ký tự | 100 | | Mã vạch sản phẩm |
| image | Chuỗi ký tự | 500 | | URL hình ảnh sản phẩm |
| categoryId | UUID | - | | ID danh mục sản phẩm |
| isActive | Boolean | - | | Trạng thái hoạt động |

*Ghi chú: Không thể cập nhật trực tiếp trường `stock`, phải sử dụng API Stock Management*

## 5. Xóa sản phẩm

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products/{id}` |
| Request Method | DELETE |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền xóa* |
| Path params | id (UUID của sản phẩm) |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Xóa sản phẩm thành công",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

*Ghi chú: Chỉ có thể xóa sản phẩm chưa có trong đơn hàng nào*

## 6. Lấy sản phẩm sắp hết hàng

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products/low-stock` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Body data | Không có |

### 6.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy sản phẩm sắp hết hàng thành công",
  "data": [
    {
      "id": "uuid",
      "name": "Cà phê sữa đá",
      "sku": "CF-SUA-DA",
      "price": 25000,
      "stock": 5,
      "minStock": 10,
      "unit": "ly",
      "category": {
        "name": "Đồ uống"
      }
    }
  ],
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 7. Cập nhật tồn kho sản phẩm

### 7.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/products/{id}/stock` |
| Request Method | PUT |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN có quyền cập nhật* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "stock": 0,
  "reason": "string"
}
```

### 7.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| stock | Số nguyên | - | ✓ | Số lượng tồn kho mới (>= 0) |
| reason | Chuỗi ký tự | 255 | ✓ | Lý do cập nhật tồn kho |

### 7.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật tồn kho thành công",
  "data": {
    "id": "uuid",
    "name": "Cà phê sữa đá",
    "stock": 120,
    "minStock": 10,
    "stockMovement": {
      "id": "uuid",
      "type": "ADJUSTMENT",
      "quantity": 20,
      "beforeQuantity": 100,
      "afterQuantity": 120,
      "reason": "Nhập hàng định kỳ"
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```
