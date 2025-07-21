import { EnvConfig } from '@/types/config/environment';
import dotenv from 'dotenv';
import { z } from 'zod';

const PROJECT_ROOT = process.cwd();
const ENVPATHS = {
    development: `.env`,
    production: `.env.prod`,
    test: `.env.test`,
} as const;

console.log(`Loading environment variables from: ${ENVPATHS[process.env.NODE_ENV || 'development'] || ENVPATHS.development}`);

// Load environment variables
const dotenvConf = dotenv.config({
    path: ENVPATHS[process.env.NODE_ENV || 'development'] || ENVPATHS.development,
});

// Schema validation cho environment variables sử dụng Zod
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().positive()).default('3000'),

    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_EXPIRE: z.string().default('15m'),
    JWT_REFRESH_EXPIRE: z.string().default('7d'),

    // Security
    BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default('12'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE_MAX_SIZE: z.string().default('20m'),
    LOG_FILE_MAX_FILES: z.string().default('14d'),

    // File Upload
    MAX_FILE_SIZE: z.string().default('5mb'),
    UPLOAD_PATH: z.string().default('./uploads'),

    // Application
    APP_NAME: z.string().default('POS API'),
    APP_VERSION: z.string().default('1.0.0'),
    APP_URL: z.string().url().default('http://localhost:3000'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error('❌ Lỗi cấu hình environment variables:');
    parseResult.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}

const envVars = parseResult.data;

export const config: EnvConfig = {
    app: {
        env: envVars.NODE_ENV,
        port: envVars.PORT,
        name: envVars.APP_NAME,
        version: envVars.APP_VERSION,
        url: envVars.APP_URL,
    },

    database: {
        url: envVars.DATABASE_URL,
    },

    jwt: {
        secret: envVars.JWT_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        expire: envVars.JWT_EXPIRE,
        refreshExpire: envVars.JWT_REFRESH_EXPIRE,
    },

    security: {
        bcryptRounds: envVars.BCRYPT_ROUNDS,
    },

    cors: {
        origin: envVars.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()),
    },

    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    },

    logging: {
        level: envVars.LOG_LEVEL,
        file: {
            maxSize: envVars.LOG_FILE_MAX_SIZE,
            maxFiles: envVars.LOG_FILE_MAX_FILES,
        },
    },

    upload: {
        maxSize: envVars.MAX_FILE_SIZE,
        path: envVars.UPLOAD_PATH,
    },
};

// Hàm để mask sensitive data cho logging
const maskSensitiveData = (value: string): string => {
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
};

// Hàm để tạo config object an toàn cho logging
export const getSafeConfigForLogging = () => ({
    app: {
        env: config.app.env,
        port: config.app.port,
        name: config.app.name,
        version: config.app.version,
        url: config.app.url,
    },
    database: {
        url: config.database.url.replace(/:\/\/([^:]+):([^@]+)@/, `://***:${maskSensitiveData('password')}@`),
    },
    jwt: {
        secret: maskSensitiveData(config.jwt.secret),
        refreshSecret: maskSensitiveData(config.jwt.refreshSecret),
        expire: config.jwt.expire,
        refreshExpire: config.jwt.refreshExpire,
    },
    security: {
        bcryptRounds: config.security.bcryptRounds,
    },
    cors: {
        origin: config.cors.origin,
    },
    rateLimit: {
        windowMs: config.rateLimit.windowMs,
        maxRequests: config.rateLimit.maxRequests,
    },
    logging: {
        level: config.logging.level,
        file: config.logging.file,
    },
    upload: {
        maxSize: config.upload.maxSize,
        path: config.upload.path,
    },
});

// Log config khi khởi tạo ở development mode
if (config.app.env === 'development') {
    console.log('\n🔧 Configuration loaded in development mode:');
    console.log('=====================================');
    console.table(getSafeConfigForLogging());
    console.log('=====================================\n');
}
