/**
 * Swagger Configuration for POS API
 */

import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './environment';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'POS API Documentation',
    version: '1.0.0',
    description: `
# 🏪 POS API Documentation

## 📋 Giới thiệu dự án

**POS API** là hệ thống backend API cho ứng dụng Point of Sale (Thu ngân), được xây dựng để phục vụ việc **mock frontend** và **demo các tính năng quản lý cửa hàng**.

### 🎯 Mục đích chính
- **🖥️ Mock API cho Frontend**: Cung cấp API hoàn chỉnh để frontend developers có thể phát triển và test UI mà không cần backend thật
- **� Learning & Demo**: Minh họa các best practices trong việc xây dựng RESTful API với TypeScript
- **🧪 Prototype**: Tạo prototype nhanh cho các ứng dụng POS/retail management

### 🏗️ Kiến trúc hệ thống
\`\`\`
Frontend (React/Vue/Angular)
    ↕️ HTTP/REST API
Backend API (Node.js + Express + TypeScript)
    ↕️ Prisma ORM  
Database (PostgreSQL)
\`\`\`

## ✨ Tính năng chính

### 🔐 Authentication & Authorization
- **JWT Authentication**: Access token + Refresh token
- **Role-based Access Control**: Admin và Cashier roles
- **Secure Login**: Email-based authentication với password hashing

### 📦 Product Management
- **CRUD Operations**: Tạo, đọc, cập nhật, xóa sản phẩm
- **Inventory Tracking**: Theo dõi tồn kho real-time
- **Category Management**: Phân loại sản phẩm theo danh mục
- **Search & Filter**: Tìm kiếm theo tên, SKU, barcode
- **Pagination**: Hỗ trợ phân trang cho dataset lớn

### 🛒 Order Processing
- **Order Creation**: Tạo đơn hàng với multiple items
- **Payment Methods**: Cash, Card, Bank Transfer
- **Order Status**: Pending → Completed → Cancelled
- **Invoice Generation**: Tạo hóa đơn cho đơn hàng

### 📊 Stock Management
- **Stock Movements**: Theo dõi nhập/xuất kho
- **Low Stock Alerts**: Cảnh báo sản phẩm sắp hết
- **Stock Adjustments**: Điều chỉnh tồn kho manual
- **Movement History**: Lịch sử thay đổi tồn kho

### 👥 User Management
- **User Profiles**: Quản lý thông tin người dùng
- **Role Assignment**: Phân quyền Admin/Cashier
- **Profile Updates**: Cập nhật thông tin cá nhân
- **Password Management**: Đổi mật khẩu bảo mật

## 🔧 Tech Stack

### Backend Core
- **Runtime**: Node.js 18+ với ES Modules
- **Framework**: Express.js 4.x + TypeScript 5.x
- **Build Tool**: tsup (fast TypeScript bundler)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Authentication**: JWT với bcrypt password hashing

### API & Documentation
- **API Spec**: OpenAPI 3.0 (Swagger)
- **Validation**: express-validator với custom rules
- **Error Handling**: Centralized error middleware
- **Logging**: Winston với structured logging

### Development Tools
- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Testing**: Vitest cho unit/integration tests
- **Containerization**: Docker với multi-stage builds
- **Frontend Demo**: Handlebars + Tailwind CSS

## 🚀 API Base URL
**Development**: \`${config.app.url || 'http://localhost:3000'}\`  
**Production**: \`https://your-domain.com\`

## 🔐 Authentication Flow

\`\`\`mermaid
sequenceDiagram
    Client->>API: POST /api/auth/login
    API->>Client: { accessToken, refreshToken, user }
    Client->>API: GET /api/products (Bearer token)
    API->>Client: { success, data: products[] }
    Note over Client,API: Token expires after 15 minutes
    Client->>API: POST /api/auth/refresh
    API->>Client: { new accessToken }
\`\`\`

### Header Authorization
\`\`\`http
Authorization: Bearer <your_access_token>
Content-Type: application/json
\`\`\`

## 📝 Response Format

### ✅ Success Response
\`\`\`json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
\`\`\`

### ❌ Error Response
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-01-20T10:30:00.000Z"
}
\`\`\`

## 🧪 Demo Data

### Test Accounts
| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@pos.local | password123 | Full system access |
| Cashier | cashier@pos.com | cashier123 | POS operations only |

### Sample Products
- Coca Cola 330ml - 15,000 VND
- Pepsi 330ml - 14,000 VND  
- Snack Pack - 25,000 VND
- Coffee Cup - 35,000 VND

## 📈 Usage Statistics
- **Endpoints**: 25+ REST API endpoints
- **Database Tables**: 8 core entities
- **Authentication**: JWT with 15min/7day expiry
- **Validation Rules**: 50+ field validators
- **Error Codes**: 20+ standardized error types

---
💡 **Tip**: Sử dụng **Try it out** trong Swagger UI để test API trực tiếp!
`,
    contact: {
      name: 'POS API Support',
      email: 'support@pos-api.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: config.app.url || 'http://localhost:3000',
      description: config.app.env === 'production' ? 'Production Server' : 'Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token từ /api/auth/login'
      }
    },
    schemas: {
      // Response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-20T10:30:00.000Z'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'An error occurred'
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR'
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      example: 'email'
                    },
                    message: {
                      type: 'string',
                      example: 'Invalid email format'
                    }
                  }
                }
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-20T10:30:00.000Z'
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            example: 150,
            description: 'Tổng số records'
          },
          page: {
            type: 'integer',
            example: 1,
            description: 'Trang hiện tại'
          },
          limit: {
            type: 'integer',
            example: 20,
            description: 'Số items mỗi trang'
          },
          totalPages: {
            type: 'integer',
            example: 8,
            description: 'Tổng số trang'
          },
          hasNext: {
            type: 'boolean',
            example: true,
            description: 'Có trang tiếp theo không'
          },
          hasPrev: {
            type: 'boolean',
            example: false,
            description: 'Có trang trước không'
          }
        }
      },
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          username: {
            type: 'string',
            example: 'admin'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@pos.local'
          },
          role: {
            type: 'string',
            enum: ['admin', 'cashier'],
            example: 'admin'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-20T10:30:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-20T10:30:00.000Z'
          }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          username: {
            type: 'string'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          role: {
            type: 'string',
            enum: ['admin', 'cashier']
          },
          isActive: {
            type: 'boolean'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      // Auth schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@pos.local'
          },
          password: {
            type: 'string',
            example: 'password123'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/UserProfile'
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              expiresIn: {
                type: 'integer',
                example: 900,
                description: 'Access token expiry in seconds'
              }
            }
          }
        }
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      },
      // Product schemas
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Coca Cola 330ml'
          },
          sku: {
            type: 'string',
            example: 'COCA-330ML'
          },
          description: {
            type: 'string',
            example: 'Nước ngọt có gas Coca Cola lon 330ml'
          },
          price: {
            type: 'number',
            format: 'decimal',
            example: 15000
          },
          cost: {
            type: 'number',
            format: 'decimal',
            example: 12000
          },
          stock: {
            type: 'integer',
            example: 100
          },
          minStock: {
            type: 'integer',
            example: 10
          },
          unit: {
            type: 'string',
            example: 'lon'
          },
          barcode: {
            type: 'string',
            example: '1234567890123'
          },
          image: {
            type: 'string',
            example: '/images/products/coca-cola.jpg'
          },
          categoryId: {
            type: 'string',
            format: 'uuid'
          },
          category: {
            $ref: '#/components/schemas/Category'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'sku', 'price', 'categoryId'],
        properties: {
          name: {
            type: 'string',
            example: 'Coca Cola 330ml'
          },
          sku: {
            type: 'string',
            example: 'COCA-330ML'
          },
          description: {
            type: 'string',
            example: 'Nước ngọt có gas Coca Cola lon 330ml'
          },
          price: {
            type: 'number',
            format: 'decimal',
            example: 15000
          },
          cost: {
            type: 'number',
            format: 'decimal',
            example: 12000
          },
          stock: {
            type: 'integer',
            example: 100
          },
          minStock: {
            type: 'integer',
            example: 10
          },
          unit: {
            type: 'string',
            example: 'lon'
          },
          barcode: {
            type: 'string',
            example: '1234567890123'
          },
          image: {
            type: 'string',
            example: '/images/products/coca-cola.jpg'
          },
          categoryId: {
            type: 'string',
            format: 'uuid'
          }
        }
      },
      // Category schemas
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Đồ uống'
          },
          description: {
            type: 'string',
            example: 'Các loại đồ uống, nước ngọt'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      CreateCategoryRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'Đồ uống'
          },
          description: {
            type: 'string',
            example: 'Các loại đồ uống, nước ngọt'
          }
        }
      },
      // Order schemas
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          orderNumber: {
            type: 'string',
            example: 'ORD-20250120-001'
          },
          total: {
            type: 'number',
            format: 'decimal',
            example: 45000
          },
          subtotal: {
            type: 'number',
            format: 'decimal',
            example: 40000
          },
          tax: {
            type: 'number',
            format: 'decimal',
            example: 4000
          },
          discount: {
            type: 'number',
            format: 'decimal',
            example: 0
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled'],
            example: 'completed'
          },
          paymentMethod: {
            type: 'string',
            enum: ['cash', 'card', 'transfer'],
            example: 'cash'
          },
          createdById: {
            type: 'string',
            format: 'uuid'
          },
          createdBy: {
            $ref: '#/components/schemas/User'
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem'
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          orderId: {
            type: 'string',
            format: 'uuid'
          },
          productId: {
            type: 'string',
            format: 'uuid'
          },
          product: {
            $ref: '#/components/schemas/Product'
          },
          quantity: {
            type: 'integer',
            example: 2
          },
          price: {
            type: 'number',
            format: 'decimal',
            example: 15000
          },
          subtotal: {
            type: 'number',
            format: 'decimal',
            example: 30000
          }
        }
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['items', 'paymentMethod'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: {
                  type: 'string',
                  format: 'uuid'
                },
                quantity: {
                  type: 'integer',
                  minimum: 1,
                  example: 2
                }
              }
            }
          },
          paymentMethod: {
            type: 'string',
            enum: ['cash', 'card', 'transfer'],
            example: 'cash'
          },
          discount: {
            type: 'number',
            format: 'decimal',
            example: 0
          }
        }
      },
      // Stock movement schemas
      StockMovement: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          productId: {
            type: 'string',
            format: 'uuid'
          },
          product: {
            $ref: '#/components/schemas/Product'
          },
          type: {
            type: 'string',
            enum: ['SALE', 'PURCHASE', 'ADJUSTMENT'],
            example: 'SALE'
          },
          quantity: {
            type: 'integer',
            example: -2
          },
          reason: {
            type: 'string',
            example: 'Bán hàng'
          },
          reference: {
            type: 'string',
            example: 'ORD-20250120-001'
          },
          previousStock: {
            type: 'integer',
            example: 100
          },
          newStock: {
            type: 'integer',
            example: 98
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      StockAdjustmentRequest: {
        type: 'object',
        required: ['productId', 'quantity', 'reason'],
        properties: {
          productId: {
            type: 'string',
            format: 'uuid'
          },
          quantity: {
            type: 'integer',
            example: 10
          },
          reason: {
            type: 'string',
            example: 'Điều chỉnh tồn kho'
          }
        }
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            example: 'admin'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@pos.local'
          }
        }
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: {
            type: 'string',
            example: 'password123'
          },
          newPassword: {
            type: 'string',
            example: 'newpassword123'
          }
        }
      },
      // Dashboard schemas
      DashboardStats: {
        type: 'object',
        properties: {
          sales: {
            type: 'object',
            properties: {
              today: {
                type: 'number',
                description: 'Doanh thu hôm nay',
                example: 15750000
              },
              thisWeek: {
                type: 'number',
                description: 'Doanh thu tuần này',
                example: 87500000
              },
              thisMonth: {
                type: 'number',
                description: 'Doanh thu tháng này',
                example: 245000000
              },
              growth: {
                type: 'number',
                description: 'Tỷ lệ tăng trưởng (%)',
                example: 12.5
              }
            }
          },
          orders: {
            type: 'object',
            properties: {
              today: {
                type: 'integer',
                description: 'Số đơn hàng hôm nay',
                example: 45
              },
              pending: {
                type: 'integer',
                description: 'Đơn hàng chờ xử lý',
                example: 8
              },
              completed: {
                type: 'integer',
                description: 'Đơn hàng hoàn thành',
                example: 37
              },
              cancelled: {
                type: 'integer',
                description: 'Đơn hàng đã hủy',
                example: 2
              }
            }
          },
          products: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                description: 'Tổng số sản phẩm',
                example: 156
              },
              lowStock: {
                type: 'integer',
                description: 'Sản phẩm sắp hết hàng',
                example: 8
              },
              outOfStock: {
                type: 'integer',
                description: 'Sản phẩm hết hàng',
                example: 3
              }
            }
          },
          customers: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                description: 'Tổng số khách hàng',
                example: 12
              },
              new: {
                type: 'integer',
                description: 'Khách hàng mới (30 ngày)',
                example: 4
              },
              returning: {
                type: 'integer',
                description: 'Khách hàng quay lại',
                example: 8
              }
            }
          }
        }
      },
      TopSellingProduct: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            format: 'uuid',
            description: 'ID sản phẩm'
          },
          productName: {
            type: 'string',
            description: 'Tên sản phẩm',
            example: 'Cà phê sữa đá'
          },
          totalSold: {
            type: 'integer',
            description: 'Tổng số lượng bán',
            example: 125
          },
          revenue: {
            type: 'number',
            description: 'Doanh thu từ sản phẩm',
            example: 3750000
          }
        }
      },
      RecentActivity: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['order', 'payment', 'stock'],
            description: 'Loại hoạt động'
          },
          description: {
            type: 'string',
            description: 'Mô tả hoạt động',
            example: 'Đơn hàng #12345678 - Nguyễn Văn A'
          },
          amount: {
            type: 'number',
            description: 'Số tiền/số lượng',
            example: 150000
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian hoạt động'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Xác thực và quản lý phiên làm việc'
    },
    {
      name: 'Users',
      description: 'Quản lý người dùng'
    },
    {
      name: 'Products',
      description: 'Quản lý sản phẩm'
    },
    {
      name: 'Categories',
      description: 'Quản lý danh mục sản phẩm'
    },
    {
      name: 'Orders',
      description: 'Quản lý đơn hàng'
    },
    {
      name: 'Stock',
      description: 'Quản lý kho hàng'
    },
    {
      name: 'Dashboard',
      description: 'Dashboard và thống kê'
    },
    {
      name: 'Health',
      description: 'Kiểm tra sức khỏe hệ thống'
    }
  ]
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/types/*.ts'
  ]
};

// Generate swagger spec
export const swaggerSpec = swaggerJSDoc(options);

// Export config for use in routes
export const swaggerConfig = {
  definition: swaggerDefinition,
  options
};
