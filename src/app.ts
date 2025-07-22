import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import cors from 'cors';

import { config } from './config/environment';
import { logger } from './utils/logger';
import { disconnectDatabase } from './utils/database-health';
import { createApiRoutes, createHealthRoutes, createDebugRoutes, createDocsRoutes } from './routes';
import { createRootRoute } from './routes/root.routes';
import { prisma } from './config/database';
import {
  securityHeaders,
  corsConfig,
  generalRateLimit,
  requestLogger,
  validateContentType,
  requestSizeLimit,
  globalErrorHandler,
  notFoundHandler
} from './middleware';
import { createWebRoutes } from './routes/web.routes';
import { handlebarsHelpers } from './views/helpers';

const app = express();

// ==========================================
// MIDDLEWARE BẢO MẬT & CƠ BẢN
// ==========================================

// Request logging (should be first)
if (config.app.env === 'development') {
  app.use(requestLogger);
}
app.set('trust proxy', 1); // Trust first proxy for secure headers

// Security headers
app.use(securityHeaders);

// CORS configuration
// app.use(corsConfig);
app.use(cors({
  origin: "*"
}));
// Rate limiting
app.use(generalRateLimit);

// Request size limiting
app.use(requestSizeLimit);

// Content type validation
app.use(validateContentType);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});


// ==========================================
// VIEW ENGINE SETUP
// ==========================================

// Handlebars view engine setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(process.cwd(), 'src', 'views', 'layouts'),
  partialsDir: path.join(process.cwd(), 'src', 'views', 'partials'),
  helpers: handlebarsHelpers
}));
app.set('view engine', 'hbs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

// Static files
app.use(express.static(path.join(process.cwd(), 'public')));

// ==========================================
// HEALTH CHECK & DEBUG ROUTES
// ==========================================

// Health check routes
app.use('/', createWebRoutes());
app.use('/health', createHealthRoutes());

// Debug routes (development only)
if (config.app.env === 'development') {
  app.use(createDebugRoutes());
}

// ==========================================
// API ROUTES
// ==========================================

// Root API endpoint
app.use('/api', createRootRoute());

// Mount API routes
app.use('/api', createApiRoutes(prisma));

// API Documentation routes
app.use('/docs', createDocsRoutes());

// ==========================================
// ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// ==========================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await disconnectDatabase();
  process.exit(0);
});

export { app };
