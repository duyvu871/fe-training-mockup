// swagger.config.js

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // hoặc '3.1.0' nếu bạn cần dùng version mới hơn
    info: {
      title: 'Tên API của bạn',
      version: '1.0.0',
      description: 'Tài liệu mô tả API sử dụng Swagger UI',
      contact: {
        name: 'Tên bạn hoặc nhóm phát triển',
        email: 'email@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000', // Thay bằng domain của bạn
        description: 'Server local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.js', './src/routes/**/*.ts'], // Đường dẫn tới file định nghĩa API
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
