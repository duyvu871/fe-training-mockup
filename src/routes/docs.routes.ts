/**
 * Documentation Routes - Swagger UI
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import { config } from '../config/environment';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import * as yaml from 'js-yaml';
import { logger } from '../utils/logger';

export function createDocsRoutes(): Router {
  const router = Router();

  // Load swagger spec từ file JSON
  const swaggerDocument = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'swagger.json'), 'utf8'));
  // Swagger UI options
  const swaggerUIOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 6px; }
    `,
    customSiteTitle: 'POS API Documentation',
    customfavIcon: '/favicon.ico'
  };

  /**
   * @swagger
   * /docs:
   *   get:
   *     summary: API Documentation
   *     description: Swagger UI interface for API documentation
   *     tags: [Documentation]
   *     responses:
   *       200:
   *         description: API documentation page
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   */
  router.use('/', swaggerUi.serve);
  if (process.env.NODE_ENV === 'production') {
    router.get('/', swaggerUi.setup(swaggerDocument, swaggerUIOptions));
  } else {
    router.get('/', swaggerUi.setup(swaggerSpec, swaggerUIOptions));
  }

  /**
   * @swagger
   * /docs/json:
   *   get:
   *     summary: OpenAPI JSON Specification
   *     description: Raw OpenAPI specification in JSON format
   *     tags: [Documentation]
   *     responses:
   *       200:
   *         description: OpenAPI specification
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  router.get('/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  /**
   * @swagger
   * /docs/yaml:
   *   get:
   *     summary: OpenAPI YAML Specification
   *     description: Raw OpenAPI specification in YAML format
   *     tags: [Documentation]
   *     responses:
   *       200:
   *         description: OpenAPI specification in YAML
   *         content:
   *           text/yaml:
   *             schema:
   *               type: string
   */
  router.get('/yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(swaggerSpec));
  });

  // Development only: API explorer with additional tools
  if (config.app.env === 'development') {
    /**
     * Development API Explorer
     */
    router.get('/explorer', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>POS API Explorer - Development</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .btn { display: inline-block; padding: 10px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
            .btn:hover { background: #2563eb; }
            .endpoint { background: #f8fafc; padding: 10px; border-radius: 4px; margin: 5px 0; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏪 POS API Explorer</h1>
            <p>Development environment - Explore and test the API</p>
            
            <div class="card">
              <h2>📚 Documentation</h2>
              <a href="/docs" class="btn">Swagger UI</a>
              <a href="/docs/json" class="btn">OpenAPI JSON</a>
              <a href="/docs/yaml" class="btn">OpenAPI YAML</a>
              <a href="/docs/api" class="btn">API Docs (HTML)</a>
              <a href="/docs/markdown" class="btn">Markdown Viewer</a>
            </div>
            
            <div class="card">
              <h2>🔗 Quick Links</h2>
              <div class="endpoint">GET /health - Health check</div>
              <div class="endpoint">POST /api/auth/login - Login</div>
              <div class="endpoint">GET /api/products - List products</div>
              <div class="endpoint">POST /api/orders - Create order</div>
            </div>
            
            <div class="card">
              <h2>🧪 Test Accounts</h2>
              <div>
                <strong>Admin:</strong> admin@pos.local / password123<br>
                <strong>Cashier:</strong> cashier@pos.com / cashier123
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  }

  // ==========================================
  // MARKDOWN API DOCUMENTATION ENDPOINTS
  // ==========================================

  /**
   * @swagger
   * /docs/api/{name}:
   *   get:
   *     summary: Get API Documentation in Markdown
   *     description: Get detailed API documentation for specific modules in markdown format
   *     tags: [Documentation]
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *           enum: [auth, order, product, stock, category, user, dashboard]
   *         description: The API module name to get documentation for
   *       - in: query
   *         name: format
   *         schema:
   *           type: string
   *           enum: [markdown, html]
   *           default: html
   *         description: Response format (markdown or html)
   *     responses:
   *       200:
   *         description: API documentation content
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *           text/markdown:
   *             schema:
   *               type: string
   *       404:
   *         description: Documentation not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 message:
   *                   type: string
   */
  router.get('/api/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const format = req.query.format || 'html';
      
      // Validate module name
      const validModules = ['auth', 'order', 'product', 'stock', 'category', 'user', 'dashboard'];
      if (!validModules.includes(name)) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Documentation for module '${name}' not found. Available modules: ${validModules.join(', ')}`
        });
      }

      // Read markdown file
      const mdFilePath = path.join(process.cwd(), 'md-docs', `${name}-api.md`);
      
      if (!fs.existsSync(mdFilePath)) {
        return res.status(404).json({
          error: 'FILE_NOT_FOUND',
          message: `Documentation file '${name}-api.md' not found`
        });
      }

      const markdownContent = fs.readFileSync(mdFilePath, 'utf-8');

      // Return raw markdown
      if (format === 'markdown') {
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        return res.send(markdownContent);
      }

      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent);

      // Return styled HTML
      const styledHtml = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${name.toUpperCase()} API Documentation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1, h2, h3, h4, h5, h6 {
              color: #2d3748;
              margin-top: 2em;
              margin-bottom: 0.5em;
            }
            h1 {
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
              color: #3b82f6;
            }
            h2 {
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
            }
            code {
              background: #f7fafc;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              color: #d53f8c;
              font-size: 0.9em;
            }
            pre {
              background: #2d3748;
              color: #e2e8f0;
              padding: 15px;
              border-radius: 6px;
              overflow-x: auto;
              margin: 1em 0;
            }
            pre code {
              background: none;
              color: inherit;
              padding: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th, td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            th {
              background: #3b82f6;
              color: white;
              font-weight: 600;
            }
            tbody tr:hover {
              background: #f7fafc;
            }
            .back-btn {
              display: inline-block;
              padding: 8px 16px;
              background: #6b7280;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .back-btn:hover {
              background: #4b5563;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 0.8em;
              font-weight: bold;
              margin: 2px;
            }
            .badge.get { background: #10b981; color: white; }
            .badge.post { background: #3b82f6; color: white; }
            .badge.put { background: #f59e0b; color: white; }
            .badge.delete { background: #ef4444; color: white; }
            .endpoint-summary {
              background: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 1em 0;
              border-radius: 0 6px 6px 0;
            }
            blockquote {
              border-left: 4px solid #fbbf24;
              background: #fffbeb;
              padding: 15px;
              margin: 1em 0;
              border-radius: 0 6px 6px 0;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <a href="/docs" class="back-btn">← Quay lại Swagger UI</a>
            ${htmlContent}
            <hr style="margin: 2em 0;">
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              Generated from <code>${name}-api.md</code> | 
              <a href="/docs/api/${name}?format=markdown">Xem định dạng Markdown</a> | 
              <a href="/docs">Swagger UI</a>
            </p>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(styledHtml);

    } catch (error) {
      logger.error('Error serving markdown documentation:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Unable to load documentation'
      });
    }
  });

  /**
   * @swagger
   * /docs/api:
   *   get:
   *     summary: List Available API Documentation
   *     description: Get a list of all available API documentation modules
   *     tags: [Documentation]
   *     responses:
   *       200:
   *         description: List of available documentation modules
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 modules:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       name:
   *                         type: string
   *                       title:
   *                         type: string
   *                       url:
   *                         type: string
   *                       markdownUrl:
   *                         type: string
   */
  router.get('/api', (req, res) => {
    try {
      const mdDocsPath = path.join(process.cwd(), 'md-docs');
      
      if (!fs.existsSync(mdDocsPath)) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'API documentation directory not found'
        });
      }

      // Read available markdown files
      const files = fs.readdirSync(mdDocsPath).filter(file => file.endsWith('-api.md'));
      
      const modules = files.map(file => {
        const name = file.replace('-api.md', '');
        const titleMap: Record<string, string> = {
          auth: 'Xác thực & Phân quyền',
          order: 'Quản lý Đơn hàng',
          product: 'Quản lý Sản phẩm',
          stock: 'Quản lý Tồn kho',
          category: 'Quản lý Danh mục',
          user: 'Quản lý Người dùng',
          dashboard: 'Dashboard & Thống kê'
        };
        
        return {
          name,
          title: titleMap[name] || name,
          url: `/docs/api/${name}`,
          markdownUrl: `/docs/api/${name}?format=markdown`
        };
      });

      // Check if request wants JSON
      if (req.headers.accept?.includes('application/json')) {
        return res.json({ modules });
      }

      // Return HTML list
      const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>API Documentation Index</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #3b82f6;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .module-list {
              list-style: none;
              padding: 0;
            }
            .module-item {
              margin: 15px 0;
              padding: 15px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              background: #f8fafc;
            }
            .module-title {
              font-size: 18px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 5px;
            }
            .module-links a {
              display: inline-block;
              padding: 6px 12px;
              margin: 5px 5px 5px 0;
              border-radius: 4px;
              text-decoration: none;
              font-size: 14px;
            }
            .btn-primary {
              background: #3b82f6;
              color: white;
            }
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            .btn-primary:hover { background: #2563eb; }
            .btn-secondary:hover { background: #4b5563; }
            .back-btn {
              display: inline-block;
              padding: 8px 16px;
              background: #6b7280;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin-bottom: 20px;
            }
            .back-btn:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <a href="/docs" class="back-btn">← Quay lại Swagger UI</a>
            <h1>📚 Tài liệu API</h1>
            <p>Danh sách tài liệu API chi tiết cho từng module của hệ thống POS:</p>
            
            <ul class="module-list">
              ${modules.map(module => `
                <li class="module-item">
                  <div class="module-title">${module.title}</div>
                  <div class="module-links">
                    <a href="${module.url}" class="btn-primary">Xem HTML</a>
                    <a href="/docs/markdown/${module.name}" class="btn-secondary">Xem Markdown</a>
                    <a href="${module.markdownUrl}" class="btn-secondary">Tải Raw</a>
                  </div>
                </li>
              `).join('')}
            </ul>
            
            <hr style="margin: 2em 0;">
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              <a href="/docs">Swagger UI</a> | 
              <a href="/docs/json">OpenAPI JSON</a> | 
              <a href="/docs/yaml">OpenAPI YAML</a>
            </p>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);

    } catch (error) {
      logger.error('Error listing API documentation:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Unable to list documentation'
      });
    }
  });

  // ==========================================
  // HANDLEBARS MARKDOWN VIEWER ROUTES
  // ==========================================

  /**
   * @swagger
   * /docs/markdown:
   *   get:
   *     summary: Markdown Documentation Viewer (HBS)
   *     description: View API documentation in raw markdown format using Handlebars template
   *     tags: [Documentation]
   *     responses:
   *       200:
   *         description: Markdown viewer page
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   */
  router.get('/markdown', (req, res) => {
    try {
      const mdDocsPath = path.join(process.cwd(), 'md-docs');
      
      if (!fs.existsSync(mdDocsPath)) {
        return res.status(404).render('error', {
          title: 'Không tìm thấy',
          message: 'Thư mục tài liệu API không tồn tại',
          statusCode: 404
        });
      }

      // Get available modules
      const files = fs.readdirSync(mdDocsPath).filter(file => file.endsWith('-api.md'));
      
      const modules = files.map(file => {
        const name = file.replace('-api.md', '');
        const titleMap: Record<string, string> = {
          auth: 'Xác thực & Phân quyền',
          order: 'Quản lý Đơn hàng', 
          product: 'Quản lý Sản phẩm',
          stock: 'Quản lý Tồn kho',
          category: 'Quản lý Danh mục',
          user: 'Quản lý Người dùng',
          dashboard: 'Dashboard & Thống kê'
        };
        
        return {
          name,
          title: titleMap[name] || name,
          active: false
        };
      });

      res.render('pages/markdown-viewer', {
        title: 'Tài liệu API (Markdown)',
        description: 'Xem tài liệu API ở định dạng markdown thuần',
        modules,
        markdownContent: null,
        fileName: null,
        moduleName: null
      });
    } catch (error) {
      logger.error('Error rendering markdown viewer:', error);
      res.status(500).render('error', {
        title: 'Lỗi hệ thống',
        message: 'Không thể tải trang xem tài liệu',
        statusCode: 500
      });
    }
  });

  /**
   * @swagger
   * /docs/markdown/{name}:
   *   get:
   *     summary: View Specific API Documentation in Markdown (HBS)
   *     description: View specific module API documentation in raw markdown format
   *     tags: [Documentation]
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *           enum: [auth, order, product, stock, category, user, dashboard]
   *         description: The API module name to view
   *     responses:
   *       200:
   *         description: Markdown content for the specified module
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *       404:
   *         description: Documentation not found
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   */
  router.get('/markdown/:name', (req, res) => {
    try {
      const { name } = req.params;
      
      // Validate module name
      const validModules = ['auth', 'order', 'product', 'stock', 'category', 'user', 'dashboard'];
      if (!validModules.includes(name)) {
        return res.status(404).render('error', {
          title: 'Không tìm thấy',
          message: `Tài liệu cho module '${name}' không tồn tại. Các module có sẵn: ${validModules.join(', ')}`,
          statusCode: 404
        });
      }

      const mdDocsPath = path.join(process.cwd(), 'md-docs');
      const mdFilePath = path.join(mdDocsPath, `${name}-api.md`);
      
      if (!fs.existsSync(mdFilePath)) {
        return res.status(404).render('error', {
          title: 'Không tìm thấy',
          message: `File tài liệu '${name}-api.md' không tồn tại`,
          statusCode: 404
        });
      }

      // Read markdown content
      const markdownContent = fs.readFileSync(mdFilePath, 'utf-8');
      const stats = fs.statSync(mdFilePath);

      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent);

      // Get available modules for navigation
      const files = fs.readdirSync(mdDocsPath).filter(file => file.endsWith('-api.md'));
      
      const modules = files.map(file => {
        const moduleName = file.replace('-api.md', '');
        const titleMap: Record<string, string> = {
          auth: 'Xác thực & Phân quyền (auth)',
          order: 'Quản lý Đơn hàng (order)',
          product: 'Quản lý Sản phẩm (product)', 
          stock: 'Quản lý Tồn kho (stock)',
          category: 'Quản lý Danh mục (category)',
          user: 'Quản lý Người dùng (user)',
          dashboard: 'Dashboard & Thống kê (dashboard)'
        };
        
        return {
          name: moduleName,
          title: titleMap[moduleName] || moduleName,
          active: moduleName === name
        };
      });

      const titleMap: Record<string, string> = {
        auth: 'Tài liệu API - Xác thực & Phân quyền',
        order: 'Tài liệu API - Quản lý Đơn hàng',
        product: 'Tài liệu API - Quản lý Sản phẩm',
        stock: 'Tài liệu API - Quản lý Tồn kho', 
        category: 'Tài liệu API - Quản lý Danh mục',
        user: 'Tài liệu API - Quản lý Người dùng',
        dashboard: 'Tài liệu API - Dashboard & Thống kê'
      };

      res.render('pages/markdown-viewer', {
        title: titleMap[name] || `Tài liệu API - ${name.toUpperCase()}`,
        description: `Xem tài liệu API cho module ${name} ở định dạng markdown thuần`,
        pageClass: 'bg-zinc-950',
        modules,
        markdownContent,
        htmlContent,
        fileName: `${name}-api.md`,
        moduleName: name,
        fileSize: markdownContent.length,
        hideNav: true,
        lastModified: stats.mtime.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      });

    } catch (error) {
      logger.error('Error serving markdown documentation:', error);
      res.status(500).render('error', {
        title: 'Lỗi hệ thống',
        message: 'Không thể tải tài liệu',
        statusCode: 500
      });
    }
  });

  return router;
}
