import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import chalk from 'chalk';
import { config } from '../config/environment';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format cho development với màu sắc
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const msg = String(message); // Ensure message is string
    
    // Tạo màu cho level
    let coloredLevel: string;
    switch (level) {
      case 'error':
        coloredLevel = chalk.red.bold('[ERROR]');
        break;
      case 'warn':
        coloredLevel = chalk.yellow.bold('[WARN]');
        break;
      case 'info':
        coloredLevel = chalk.blue.bold('[INFO]');
        break;
      case 'debug':
        coloredLevel = chalk.magenta.bold('[DEBUG]');
        break;
      default:
        coloredLevel = chalk.gray.bold(`[${level.toUpperCase()}]`);
    }

    // Tạo màu cho timestamp
    const coloredTimestamp = chalk.gray(timestamp);
    
    // Tạo màu cho message
    let coloredMessage: string;
    switch (level) {
      case 'error':
        coloredMessage = chalk.red(msg);
        break;
      case 'warn':
        coloredMessage = chalk.yellow(msg);
        break;
      case 'info':
        coloredMessage = chalk.cyan(msg);
        break;
      case 'debug':
        coloredMessage = chalk.magenta(msg);
        break;
      default:
        coloredMessage = msg;
    }

    let result = `${coloredTimestamp} ${coloredLevel}: ${coloredMessage}`;
    
    // Thêm metadata nếu có
    if (Object.keys(meta).length > 0) {
      result += ` ${chalk.gray(JSON.stringify(meta))}`;
    }
    
    return result;
  })
);

// Transports configuration
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: config.app.env === 'development' ? consoleFormat : logFormat,
    level: config.logging.level,
  }),
];

// File transports cho production
if (config.app.env === 'production') {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      zippedArchive: true,
    })
  );

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      zippedArchive: true,
    })
  );
}

// Tạo logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: config.app.name,
    version: config.app.version,
  },
  transports,
  exitOnError: false,
});

// Helper functions
export const logError = (message: string, error?: any, meta?: any) => {
  logger.error(message, { error: error?.stack || error, ...meta });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Logger utility functions
export const loggerUtils = {
  /**
   * Log HTTP request
   */
  logRequest: (req: any, res: any, responseTime?: number) => {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      contentLength: res.get('Content-Length')
    });
  },

  /**
   * Log authentication events
   */
  logAuth: (event: string, userId?: string, details?: any) => {
    logger.info('Auth Event', {
      event,
      userId,
      ...details
    });
  },

  /**
   * Log database operations
   */
  logDatabase: (operation: string, table: string, duration?: number, error?: any) => {
    if (error) {
      logger.error('Database Error', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack
      });
    } else {
      logger.debug('Database Operation', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined
      });
    }
  },

  /**
   * Log business logic events
   */
  logBusiness: (event: string, details?: any) => {
    logger.info('Business Event', {
      event,
      ...details
    });
  },

  /**
   * Log security events
   */
  logSecurity: (event: string, details?: any) => {
    logger.warn('Security Event', {
      event,
      ...details
    });
  },

  /**
   * Log performance metrics
   */
  logPerformance: (metric: string, value: number, unit: string = 'ms') => {
    logger.info('Performance Metric', {
      metric,
      value,
      unit
    });
  },

  /**
   * Create child logger with additional context
   */
  child: (context: Record<string, any>) => {
    return logger.child(context);
  }
};
