-- Optimized indexes for POS API performance
-- This script creates indexes after the main database setup

\c pos_db;

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users("isActive");
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users("lastLoginAt");

-- Indexes for categories table
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories("isActive");

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_active ON products("isActive");
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Full-text search index for product names (Vietnamese support)
CREATE INDEX IF NOT EXISTS idx_products_name_search 
ON products USING gin(to_tsvector('vietnamese', name));

-- Composite index for product search
CREATE INDEX IF NOT EXISTS idx_products_search_composite 
ON products("categoryId", "isActive", name, sku);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders("createdById");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders("createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_total ON orders(total);

-- Composite index for order filtering
CREATE INDEX IF NOT EXISTS idx_orders_filter_composite 
ON orders(status, "paymentStatus", "createdAt" DESC);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items("productId");

-- Composite index for order items
CREATE INDEX IF NOT EXISTS idx_order_items_composite 
ON order_items("orderId", "productId");

-- Indexes for stock_movements table
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements("productId");
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements("createdById");
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements("createdAt");

-- Composite index for stock movement history
CREATE INDEX IF NOT EXISTS idx_stock_movements_composite 
ON stock_movements("productId", "createdAt" DESC);

-- Indexes for refresh_tokens table
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens("expiresAt");

-- Composite index for token cleanup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_cleanup 
ON refresh_tokens("userId", "expiresAt");

-- Performance monitoring views
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock,
    p."minStock",
    c.name as category_name,
    (p."minStock" - p.stock) as shortage
FROM products p
JOIN categories c ON p."categoryId" = c.id
WHERE p.stock <= p."minStock" 
  AND p."isActive" = true
ORDER BY shortage DESC;

-- Sales summary view
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    DATE(o."createdAt") as sale_date,
    COUNT(*) as order_count,
    SUM(o.total) as total_revenue,
    SUM(o.subtotal) as subtotal_revenue,
    AVG(o.total) as avg_order_value
FROM orders o
WHERE o.status = 'COMPLETED'
  AND o."paymentStatus" = 'PAID'
GROUP BY DATE(o."createdAt")
ORDER BY sale_date DESC;

-- Product sales ranking view
CREATE OR REPLACE VIEW v_product_sales_ranking AS
SELECT 
    p.id,
    p.name,
    p.sku,
    SUM(oi.quantity) as total_sold,
    SUM(oi.subtotal) as total_revenue,
    COUNT(DISTINCT oi."orderId") as order_count,
    AVG(oi.price) as avg_price
FROM products p
JOIN order_items oi ON p.id = oi."productId"
JOIN orders o ON oi."orderId" = o.id
WHERE o.status = 'COMPLETED'
  AND o."paymentStatus" = 'PAID'
GROUP BY p.id, p.name, p.sku
ORDER BY total_sold DESC;

-- Grant permissions on views
GRANT SELECT ON v_low_stock_products TO pos_user;
GRANT SELECT ON v_daily_sales TO pos_user;
GRANT SELECT ON v_product_sales_ranking TO pos_user;
