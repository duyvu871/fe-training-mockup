# Stock Management API Routes

## 1. Lấy danh sách movement kho

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/movements` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền truy cập* |
| Query params | page, limit, type, productId, startDate, endDate |

### 1.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| page | Số nguyên | 1 | | Trang hiện tại (>= 1) |
| limit | Số nguyên | 20 | | Số items mỗi trang (1-100) |
| type | Chuỗi | - | | Lọc theo loại movement: IN, OUT, ADJUSTMENT |
| productId | UUID | - | | Lọc theo sản phẩm |
| startDate | Ngày | - | | Từ ngày (YYYY-MM-DD) |
| endDate | Ngày | - | | Đến ngày (YYYY-MM-DD) |

### 1.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách movement kho thành công",
  "data": {
    "movements": [
      {
        "id": "uuid",
        "productId": "uuid",
        "type": "IN",
        "quantity": 50,
        "beforeQuantity": 100,
        "afterQuantity": 150,
        "reason": "Nhập hàng từ nhà cung cấp",
        "notes": "Hàng chất lượng tốt",
        "userId": "uuid",
        "orderId": null,
        "product": {
          "name": "Cà phê sữa đá",
          "sku": "CF-SUA-DA",
          "unit": "ly"
        },
        "user": {
          "username": "admin",
          "firstName": "Quản",
          "lastName": "Trị"
        },
        "createdAt": "2025-01-20T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 2. Tạo điều chỉnh tồn kho

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/adjustment` |
| Request Method | POST |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền thực hiện* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "productId": "string",
  "newQuantity": 0,
  "reason": "string",
  "notes": "string"
}
```

### 2.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| productId | UUID | - | ✓ | ID sản phẩm cần điều chỉnh |
| newQuantity | Số nguyên | - | ✓ | Số lượng tồn kho mới (>= 0) |
| reason | Chuỗi ký tự | 255 | ✓ | Lý do điều chỉnh |
| notes | Chuỗi ký tự | 500 | | Ghi chú thêm |

### 2.3 Dữ liệu đầu ra

**Success Response (201):**
```json
{
  "success": true,
  "message": "Tạo điều chỉnh tồn kho thành công",
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "type": "ADJUSTMENT",
    "quantity": 20,
    "beforeQuantity": 100,
    "afterQuantity": 120,
    "reason": "Kiểm kê định kỳ",
    "notes": "Phát hiện thêm hàng trong kho",
    "userId": "uuid",
    "orderId": null,
    "product": {
      "name": "Cà phê sữa đá",
      "sku": "CF-SUA-DA"
    },
    "user": {
      "username": "admin"
    },
    "createdAt": "2025-01-20T14:30:00.000Z"
  },
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

## 3. Lấy chi tiết movement theo ID

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/movements/{id}` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền truy cập* |
| Path params | id (UUID của movement) |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin movement kho thành công",
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "type": "IN",
    "quantity": 50,
    "beforeQuantity": 100,
    "afterQuantity": 150,
    "reason": "Nhập hàng từ nhà cung cấp",
    "notes": "Hàng chất lượng tốt",
    "userId": "uuid",
    "orderId": null,
    "product": {
      "id": "uuid",
      "name": "Cà phê sữa đá",
      "sku": "CF-SUA-DA",
      "unit": "ly",
      "category": {
        "name": "Đồ uống"
      }
    },
    "user": {
      "id": "uuid",
      "username": "admin",
      "firstName": "Quản",
      "lastName": "Trị"
    },
    "createdAt": "2025-01-20T14:30:00.000Z"
  },
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

## 4. Lấy movement kho hôm nay

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/movements/today` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền truy cập* |
| Body data | Không có |

### 4.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy movement kho hôm nay thành công",
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "type": "OUT",
      "quantity": 2,
      "beforeQuantity": 150,
      "afterQuantity": 148,
      "reason": "Bán hàng",
      "notes": null,
      "userId": "uuid",
      "orderId": "uuid",
      "product": {
        "name": "Cà phê sữa đá",
        "sku": "CF-SUA-DA"
      },
      "user": {
        "username": "cashier01"
      },
      "createdAt": "2025-01-20T14:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-20T16:30:00.000Z"
}
```

## 5. Lấy thống kê kho hàng

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/stats` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền truy cập* |
| Body data | Không có |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê kho hàng thành công",
  "data": {
    "totalProducts": 150,
    "totalMovements": 25,
    "lowStockCount": 8,
    "outOfStockCount": 3,
    "totalStockValue": 50000000,
    "movementsToday": 12,
    "byCategory": [
      {
        "categoryName": "Đồ uống",
        "productCount": 45,
        "totalValue": 15000000
      }
    ],
    "recentMovements": [
      {
        "productName": "Cà phê sữa đá",
        "type": "OUT",
        "quantity": 2,
        "createdAt": "2025-01-20T14:30:00.000Z"
      }
    ]
  },
  "timestamp": "2025-01-20T16:30:00.000Z"
}
```

## 6. Lấy báo cáo kho hàng hàng ngày

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/daily-report` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền truy cập* |
| Query params | date |

### 6.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| date | Ngày | Hôm nay | | Ngày báo cáo (YYYY-MM-DD) |

### 6.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy báo cáo kho hàng thành công",
  "data": {
    "date": "2025-01-20",
    "totalMovements": 35,
    "inMovements": 15,
    "outMovements": 18,
    "adjustmentMovements": 2,
    "topProducts": [
      {
        "productName": "Cà phê sữa đá",
        "movementCount": 8
      },
      {
        "productName": "Trà sữa trân châu",
        "movementCount": 6
      }
    ],
    "summary": {
      "totalIn": 500,
      "totalOut": 320,
      "netChange": 180
    }
  },
  "timestamp": "2025-01-20T16:30:00.000Z"
}
```

## 7. Lấy sản phẩm có nhiều hoạt động nhất

### 7.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/stock/most-active` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: Chỉ ADMIN, OWNER, MANAGER có quyền truy cập* |
| Query params | limit, days |

### 7.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| limit | Số nguyên | 10 | | Số lượng sản phẩm trả về (1-50) |
| days | Số nguyên | 7 | | Số ngày tính từ hôm nay (>= 1) |

### 7.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy sản phẩm hoạt động nhiều nhất thành công",
  "data": [
    {
      "productId": "uuid",
      "productName": "Cà phê sữa đá",
      "movementCount": 25,
      "lastMovementAt": "2025-01-20T14:30:00.000Z",
      "types": {
        "IN": 8,
        "OUT": 15,
        "ADJUSTMENT": 2
      }
    },
    {
      "productId": "uuid",
      "productName": "Trà sữa trân châu",
      "movementCount": 18,
      "lastMovementAt": "2025-01-20T13:15:00.000Z",
      "types": {
        "IN": 5,
        "OUT": 12,
        "ADJUSTMENT": 1
      }
    }
  ],
  "timestamp": "2025-01-20T16:30:00.000Z"
}
```

## Ghi chú về Stock Movement

### Các loại Movement:
- **IN**: Nhập kho (nhập hàng, trả hàng từ khách)
- **OUT**: Xuất kho (bán hàng, trả hàng cho NCC)
- **ADJUSTMENT**: Điều chỉnh (kiểm kê, sửa sai số liệu)

### Quy trình tự động:
- Khi tạo đơn hàng → Tự động tạo movement OUT
- Khi hủy đơn hàng → Tự động tạo movement IN để hoàn trả
- Khi xác nhận thanh toán → Không tạo movement (đã trừ khi tạo đơn)

### Quyền truy cập:
- **ADMIN**: Toàn quyền
- **OWNER**: Toàn quyền  
- **MANAGER**: Toàn quyền
- **CASHIER**: Không có quyền truy cập Stock Management API
