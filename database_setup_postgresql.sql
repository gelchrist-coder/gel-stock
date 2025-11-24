-- GEL-STOCK Database Schema for PostgreSQL
-- Business Management System
-- Created for PostgreSQL 9.5+

-- Create UUID extension (optional, for better ID generation)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INTEGER,
    selling_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    supplier_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    city VARCHAR(50),
    country VARCHAR(50),
    total_purchases DECIMAL(12, 2) DEFAULT 0,
    last_purchase_date TIMESTAMP,
    loyalty_points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Items Table (line items for each sale)
CREATE TABLE sales_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    payment_terms VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Settings Table
CREATE TABLE business_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    value_type VARCHAR(20),
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_sales_items_sale ON sales_items(sale_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- Insert Sample Business Settings
INSERT INTO business_settings (setting_key, setting_value, value_type, description, is_editable) VALUES
('business_name', 'GEL-STOCK', 'string', 'Name of the business', TRUE),
('business_type', 'Business Management System', 'string', 'Type of business', TRUE),
('currency', 'GHS', 'string', 'Currency code', TRUE),
('timezone', 'Africa/Accra', 'string', 'Business timezone', TRUE),
('tax_rate', '0.00', 'decimal', 'VAT or tax rate percentage', TRUE),
('low_stock_threshold', '20', 'integer', 'Minimum stock level alert', TRUE),
('notification_email', 'admin@gelstock.com', 'string', 'Email for notifications', TRUE),
('phone', '+233000000000', 'string', 'Business phone number', TRUE);

-- Insert Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, city, country) VALUES
('Supplier One', 'John Mensah', '+233244567890', 'john@supplier1.gh', '123 Business St', 'Accra', 'Ghana'),
('Supplier Two', 'Ama Boateng', '+233245678901', 'ama@supplier2.gh', '456 Commerce Ave', 'Kumasi', 'Ghana');

-- Insert Sample Products
INSERT INTO products (sku, name, description, category_id, selling_price, cost_price, stock_quantity, reorder_level, supplier_id) VALUES
('PROD-001', 'Product A', 'Sample product one', 1, 25.00, 15.00, 50, 10, 1),
('PROD-002', 'Product B', 'Sample product two', 1, 35.00, 20.00, 30, 10, 1),
('PROD-003', 'Product C', 'Sample product three', 2, 45.00, 25.00, 20, 10, 2),
('PROD-004', 'Product D', 'Sample product four', 2, 55.00, 30.00, 15, 10, 2);

-- Insert Sample Customers
INSERT INTO customers (name, phone, email, city, country) VALUES
('Kofi Acheampong', '+233241234567', 'kofi@email.com', 'Accra', 'Ghana'),
('Abena Osei', '+233242345678', 'abena@email.com', 'Kumasi', 'Ghana'),
('Benjamin Quarmyne', '+233243456789', 'benjamin@email.com', 'Takoradi', 'Ghana');

-- Insert Sample Sales
INSERT INTO sales (customer_id, total_amount, payment_method, status) VALUES
(1, 75.00, 'cash', 'completed'),
(2, 125.50, 'mobile_money', 'completed'),
(3, 200.00, 'bank_transfer', 'completed');

-- Insert Sample Sales Items
INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 2, 25.00, 50.00),
(1, 2, 1, 35.00, 35.00),
(2, 3, 2, 45.00, 90.00),
(2, 1, 1, 25.00, 25.00),
(3, 4, 2, 55.00, 110.00),
(3, 3, 1, 45.00, 45.00);

-- Create Views for easier reporting
CREATE VIEW sales_summary AS
SELECT 
    DATE(s.created_at) as sale_date,
    COUNT(*) as total_sales,
    SUM(s.total_amount) as total_revenue,
    AVG(s.total_amount) as avg_sale_amount
FROM sales s
WHERE s.status = 'completed'
GROUP BY DATE(s.created_at)
ORDER BY sale_date DESC;

CREATE VIEW product_performance AS
SELECT 
    p.id,
    p.sku,
    p.name,
    SUM(si.quantity) as total_sold,
    SUM(si.subtotal) as total_revenue,
    p.stock_quantity,
    (p.selling_price - p.cost_price) as profit_per_unit
FROM products p
LEFT JOIN sales_items si ON p.id = si.product_id
GROUP BY p.id, p.sku, p.name, p.stock_quantity, p.selling_price, p.cost_price
ORDER BY total_revenue DESC;

-- Grant permissions (optional, if using separate user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gel_stock_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gel_stock_user;
