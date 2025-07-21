-- Initialize database for POS API
-- This script runs when PostgreSQL container starts for the first time

-- Force PostgreSQL to use md5 hashing for passwords (instead of scram-sha-256)
ALTER SYSTEM SET password_encryption = 'md5';

-- Create user only if it doesn't exist (avoid dropping current user)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pos_user') THEN
        CREATE ROLE pos_user LOGIN PASSWORD 'pos_password';
    END IF;
END $$;

-- Create database owned by that user (only if it doesn't exist)
SELECT 'CREATE DATABASE pos_db OWNER pos_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pos_db')\gexec

-- Connect to the pos_db database
\c pos_db;

-- Create extensions for POS API functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension for full-text search (tìm kiếm sản phẩm)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Extension for unaccented search (tìm kiếm không dấu tiếng Việt)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Extension for fuzzy string matching (tìm kiếm gần đúng)
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Create text search configuration for Vietnamese (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'vietnamese'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE pos_db TO pos_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pos_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pos_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO pos_user;

-- Grant usage on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pos_user;
