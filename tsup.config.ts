import { log } from 'console';
import { copyFile, mkdir } from 'fs/promises';
import { glob } from 'glob';
import { join } from 'path/win32';
import { defineConfig, Options } from 'tsup';

export default defineConfig(async (options: Options) => ({
  ...options,
  // Define the entry points for the build
  entry: ["./src/**/*.ts", 'prisma/seed.ts'],
  format: ['cjs', 'esm'],
  target: 'node18',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  minify: false, // Disable minify to avoid issues in production
  splitting: false,
  dts: false,
  exclude: ["**/*.hbs", "**/*.html"],
  external: [
    '@mapbox/node-pre-gyp',
    'aws-sdk',
    'mock-aws-s3',
    'nock',
    '@jsdevtools/ono',
    '*.node',
    'snappy',
    'bcrypt',
    'express',
    '@prisma/client',
    'bcrypt',
    'bcryptjs',
    'jsonwebtoken',
    'winston',
    'winston-daily-rotate-file',
    'cors',
    'helmet',
    'dotenv',
    'joi',
    'express-rate-limit',
    'express-validator',
    'swagger-jsdoc',
    'swagger-ui-express',
    '*.hbs'
  ],
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  tsconfig: "./tsconfig.json",
  onSuccess: async () => {
    // Copy handlebars templates
    const templateFiles = glob.sync('src/views/**/*.hbs');
    for (const file of templateFiles) {
      log(`Copying template: ${file}`);
      const destPath = file.replace('src/', 'dist/src/');
      await mkdir(join(process.cwd(), destPath, '..'), { recursive: true });
      await copyFile(file, destPath);
    }
  }
}));
