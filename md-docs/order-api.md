# Order API Routes

## 1. Tạo đơn hàng mới

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders` |
| Request Method | POST |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token}<br/>*Ghi chú: access_token lấy được ở hàm đăng nhập* |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "items": [
    {
      "productId": "string",
      "quantity": 0,
      "unitPrice": 0
    }
  ],
  "customerName": "string",
  "customerPhone": "string",
  "discountAmount": 0,
  "paymentMethod": "CASH|CARD|TRANSFER",
  "notes": "string"
}
```

### 1.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| items | Mảng | - | ✓ | Danh sách sản phẩm trong đơn hàng (tối thiểu 1 item) |
| productId | UUID | - | ✓ | ID sản phẩm |
| quantity | Số nguyên | - | ✓ | Số lượng sản phẩm (tối thiểu 1) |
| unitPrice | Số thập phân | - | ✓ | Đơn giá sản phẩm (>= 0) |
| customerName | Chuỗi ký tự | 255 | | Tên khách hàng (mặc định "Khách lẻ") |
| customerPhone | Chuỗi ký tự | 15 | | Số điện thoại khách hàng (định dạng VN) |
| discountAmount | Số thập phân | - | | Số tiền giảm giá (mặc định 0, >= 0) |
| paymentMethod | Chuỗi | - | ✓ | Phương thức thanh toán: CASH, CARD, TRANSFER |
| notes | Chuỗi ký tự | 500 | | Ghi chú đơn hàng |

### 1.3 Dữ liệu đầu ra

**Success Response (201):**
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250120-001",
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0987654321",
    "totalAmount": 150000,
    "discountAmount": 15000,
    "finalAmount": 135000,
    "paymentMethod": "CASH",
    "status": "PENDING",
    "notes": "Giao hàng tận nơi",
    "cashierId": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000,
        "product": {
          "name": "Cà phê sữa đá",
          "sku": "CF-SUA-DA"
        }
      }
    ],
    "createdAt": "2025-01-20T10:30:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 2. Lấy danh sách đơn hàng

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Query params | page, limit, status, userId, startDate, endDate, sortBy, sortOrder |

### 2.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| page | Số nguyên | 1 | | Trang hiện tại (>= 1) |
| limit | Số nguyên | 10 | | Số items mỗi trang (1-100) |
| status | Chuỗi | - | | Lọc theo trạng thái: PENDING, COMPLETED, CANCELLED, REFUNDED |
| userId | UUID | - | | Lọc theo ID người dùng |
| startDate | Ngày | - | | Từ ngày (YYYY-MM-DD) |
| endDate | Ngày | - | | Đến ngày (YYYY-MM-DD) |
| sortBy | Chuỗi | - | | Sắp xếp theo: createdAt, total, status |
| sortOrder | Chuỗi | - | | Thứ tự sắp xếp: asc, desc |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng thành công",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20250120-001",
        "customerName": "Nguyễn Văn A",
        "customerPhone": "0987654321",
        "finalAmount": 135000,
        "paymentMethod": "CASH",
        "status": "COMPLETED",
        "createdAt": "2025-01-20T10:30:00.000Z",
        "itemCount": 2
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 3. Lấy chi tiết đơn hàng theo ID

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders/{id}` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Path params | id (UUID của đơn hàng) |

### 3.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin đơn hàng thành công",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250120-001",
    "customerName": "Nguyễn Văn A",
    "customerPhone": "0987654321",
    "totalAmount": 150000,
    "discountAmount": 15000,
    "finalAmount": 135000,
    "paymentMethod": "CASH",
    "status": "COMPLETED",
    "notes": "Giao hàng tận nơi",
    "cashierId": "uuid",
    "cashier": {
      "username": "cashier01",
      "firstName": "Thu",
      "lastName": "Ngân"
    },
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000,
        "product": {
          "name": "Cà phê sữa đá",
          "sku": "CF-SUA-DA",
          "unit": "ly"
        }
      }
    ],
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:35:00.000Z"
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 4. Cập nhật trạng thái đơn hàng

### 4.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders/{id}/status` |
| Request Method | POST |
| Request Header | Content-Type: application/json<br/>Authorization: Bearer {access_token} |
| Body data | Xem chi tiết JSON schema bên dưới |

**JSON Schema:**
```json
{
  "status": "PENDING|COMPLETED|CANCELLED|REFUNDED",
  "notes": "string"
}
```

### 4.2 Dữ liệu đầu vào

| **Tên trường** | **Kiểu dữ liệu** | **Kích thước tối đa** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|-----------------------|--------------|-------------|
| status | Chuỗi | - | ✓ | Trạng thái mới: PENDING, COMPLETED, CANCELLED, REFUNDED |
| notes | Chuỗi ký tự | 500 | | Ghi chú khi cập nhật trạng thái |

### 4.3 Quy tắc chuyển đổi trạng thái

- **PENDING**: Có thể chuyển sang COMPLETED, CANCELLED
- **COMPLETED**: Có thể chuyển sang REFUNDED (Admin only)  
- **CANCELLED**: Không thể chuyển
- **REFUNDED**: Không thể chuyển

*Ghi chú: User thường chỉ có thể chuyển PENDING → COMPLETED, Admin có thể chuyển mọi trạng thái*

## 5. Hủy đơn hàng

### 5.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders/{id}/cancel` |
| Request Method | POST |
| Request Header | Authorization: Bearer {access_token} |
| Path params | id (UUID của đơn hàng) |

### 5.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Hủy đơn hàng thành công",
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20250120-001",
    "status": "CANCELLED",
    "updatedAt": "2025-01-20T10:35:00.000Z"
  },
  "timestamp": "2025-01-20T10:35:00.000Z"
}
```

*Ghi chú: Khi hủy đơn hàng, hệ thống sẽ tự động hoàn trả số lượng tồn kho cho các sản phẩm trong đơn hàng*

## 6. Lấy thống kê đơn hàng

### 6.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders/stats` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Body data | Không có |

### 6.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê đơn hàng thành công",
  "data": {
    "stats": {
      "totalOrders": 150,
      "completedOrders": 140,
      "pendingOrders": 5,
      "cancelledOrders": 5,
      "totalRevenue": 15000000,
      "todayOrders": 25,
      "todayRevenue": 2500000
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

## 7. Báo cáo doanh thu hàng ngày

### 7.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/orders/reports/daily` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Query params | date |

### 7.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| date | Ngày | Hôm nay | | Ngày báo cáo (YYYY-MM-DD) |

### 7.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy báo cáo doanh thu thành công",
  "data": {
    "date": "2025-01-20",
    "totalOrders": 25,
    "totalRevenue": 2500000,
    "averageOrderValue": 100000,
    "paymentMethods": {
      "CASH": 15,
      "CARD": 8,
      "TRANSFER": 2
    },
    "hourlyData": [
      {
        "hour": 8,
        "orders": 2,
        "revenue": 150000
      }
    ]
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```
