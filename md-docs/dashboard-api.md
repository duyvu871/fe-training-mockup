# Dashboard API Routes

## 1. Lấy thống kê dashboard tổng quan

### 1.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/dashboard/stats` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token}<br/>*Ghi chú: access_token lấy được ở hàm đăng nhập* |
| Body data | Không có |

### 1.2 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê dashboard thành công",
  "data": {
    "stats": {
      "sales": {
        "today": 15750000,
        "thisWeek": 87500000,
        "thisMonth": 245000000,
        "growth": 12.5
      },
      "orders": {
        "today": 45,
        "pending": 8,
        "completed": 37,
        "cancelled": 2
      },
      "products": {
        "total": 156,
        "lowStock": 8,
        "outOfStock": 3
      },
      "customers": {
        "total": 12,
        "new": 4,
        "returning": 8
      }
    }
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

### 1.3 Mô tả các trường dữ liệu

| **Tên trường** | **Kiểu dữ liệu** | **Ghi chú** |
|----------------|------------------|-------------|
| sales.today | Số thập phân | Doanh thu hôm nay (VND) |
| sales.thisWeek | Số thập phân | Doanh thu tuần này (VND) |
| sales.thisMonth | Số thập phân | Doanh thu tháng này (VND) |
| sales.growth | Số thập phân | Tỷ lệ tăng trưởng so với tháng trước (%) |
| orders.today | Số nguyên | Số đơn hàng hôm nay |
| orders.pending | Số nguyên | Số đơn hàng đang chờ |
| orders.completed | Số nguyên | Số đơn hàng đã hoàn thành |
| orders.cancelled | Số nguyên | Số đơn hàng đã hủy |
| products.total | Số nguyên | Tổng số sản phẩm |
| products.lowStock | Số nguyên | Số sản phẩm sắp hết hàng |
| products.outOfStock | Số nguyên | Số sản phẩm hết hàng |
| customers.total | Số nguyên | Tổng số khách hàng |
| customers.new | Số nguyên | Khách hàng mới (tháng này) |
| customers.returning | Số nguyên | Khách hàng quay lại |

## 2. Lấy sản phẩm bán chạy nhất

### 2.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/dashboard/top-products` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Query params | limit |

### 2.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| limit | Số nguyên | 5 | | Số lượng sản phẩm bán chạy cần lấy (1-20) |

### 2.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy sản phẩm bán chạy thành công",
  "data": {
    "products": [
      {
        "productId": "123e4567-e89b-12d3-a456-426614174000",
        "productName": "Cà phê sữa đá",
        "totalSold": 125,
        "revenue": 3750000,
        "category": "Đồ uống",
        "unit": "ly"
      },
      {
        "productId": "123e4567-e89b-12d3-a456-426614174001",
        "productName": "Trà sữa trân châu",
        "totalSold": 98,
        "revenue": 2940000,
        "category": "Đồ uống",
        "unit": "ly"
      }
    ]
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

### 2.4 Mô tả các trường dữ liệu

| **Tên trường** | **Kiểu dữ liệu** | **Ghi chú** |
|----------------|------------------|-------------|
| productId | UUID | ID sản phẩm |
| productName | Chuỗi ký tự | Tên sản phẩm |
| totalSold | Số nguyên | Tổng số lượng đã bán (tháng này) |
| revenue | Số thập phân | Doanh thu từ sản phẩm (VND) |
| category | Chuỗi ký tự | Tên danh mục |
| unit | Chuỗi ký tự | Đơn vị tính |

## 3. Lấy hoạt động gần đây

### 3.1 Mô tả

| **Thuộc tính** | **Giá trị** |
|----------------|-------------|
| Request URL | `/api/dashboard/recent-activity` |
| Request Method | GET |
| Request Header | Authorization: Bearer {access_token} |
| Query params | limit |

### 3.2 Tham số query

| **Tên trường** | **Kiểu dữ liệu** | **Mặc định** | **Bắt buộc** | **Ghi chú** |
|----------------|------------------|--------------|--------------|-------------|
| limit | Số nguyên | 10 | | Số lượng hoạt động cần lấy (1-50) |

### 3.3 Dữ liệu đầu ra

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lấy hoạt động gần đây thành công",
  "data": {
    "activities": [
      {
        "type": "payment",
        "description": "Đơn hàng #ORD-20250120-001 - Nguyễn Văn A",
        "amount": 150000,
        "timestamp": "2025-01-20T14:30:00.000Z",
        "user": "cashier01"
      },
      {
        "type": "stock",
        "description": "Nhập kho - Cà phê sữa đá",
        "amount": 50,
        "timestamp": "2025-01-20T13:15:00.000Z",
        "user": "admin"
      },
      {
        "type": "order",
        "description": "Đơn hàng #ORD-20250120-002 - Trần Thị B",
        "amount": 85000,
        "timestamp": "2025-01-20T12:45:00.000Z",
        "user": "cashier02"
      }
    ]
  },
  "timestamp": "2025-01-20T15:30:00.000Z"
}
```

### 3.4 Mô tả các trường dữ liệu

| **Tên trường** | **Kiểu dữ liệu** | **Ghi chú** |
|----------------|------------------|-------------|
| type | Chuỗi ký tự | Loại hoạt động: payment, stock, order, user |
| description | Chuỗi ký tự | Mô tả hoạt động |
| amount | Số | Số tiền (VND) hoặc số lượng |
| timestamp | DateTime | Thời gian thực hiện |
| user | Chuỗi ký tự | Tên người thực hiện |

### 3.5 Các loại hoạt động

| **Loại** | **Mô tả** | **Amount** |
|----------|-----------|------------|
| payment | Thanh toán đơn hàng | Số tiền thanh toán |
| stock | Xuất nhập kho | Số lượng thay đổi |
| order | Tạo đơn hàng mới | Tổng tiền đơn hàng |
| user | Hoạt động người dùng | 0 (không áp dụng) |

## Quy tắc nghiệp vụ

### Thống kê dashboard:
- Dữ liệu được cập nhật realtime
- Doanh thu tính theo finalAmount (sau giảm giá)
- Tăng trưởng so sánh với cùng kỳ tháng trước
- Khách hàng mới = khách hàng có đơn hàng đầu tiên trong tháng

### Sản phẩm bán chạy:
- Tính theo số lượng đã bán trong tháng hiện tại
- Chỉ tính đơn hàng có status COMPLETED
- Sắp xếp theo doanh thu giảm dần

### Hoạt động gần đây:
- Hiển thị các hoạt động trong 24h gần nhất
- Sắp xếp theo thời gian giảm dần (mới nhất trước)
- Lọc theo quyền người dùng (CASHIER chỉ thấy hoạt động của mình)

### Quyền truy cập:
- **ADMIN**: Xem tất cả thống kê
- **CASHIER**: Xem thống kê cơ bản, hoạt động của mình
