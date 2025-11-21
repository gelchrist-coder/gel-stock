-- User Data Sync Tables for GEL-STOCK
-- This schema allows storing user products, sales, and settings in the database
-- for cross-device synchronization

-- User Products Table
CREATE TABLE IF NOT EXISTS user_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    category VARCHAR(100) DEFAULT 'Uncategorized',
    reorder_level INT DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    CONSTRAINT fk_user_products FOREIGN KEY (user_id) REFERENCES users(phone)
);

-- User Sales Table
CREATE TABLE IF NOT EXISTS user_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    sale_id VARCHAR(255) NOT NULL UNIQUE,
    items LONGTEXT NOT NULL COMMENT 'JSON array of sale items',
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_sale_id (sale_id),
    CONSTRAINT fk_user_sales FOREIGN KEY (user_id) REFERENCES users(phone)
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    business_name VARCHAR(255),
    theme VARCHAR(50) DEFAULT 'light',
    currency VARCHAR(10) DEFAULT 'GHS',
    low_stock_level INT DEFAULT 5,
    settings_json LONGTEXT COMMENT 'JSON object with additional settings',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_user_settings FOREIGN KEY (user_id) REFERENCES users(phone)
);

-- User Credits/Debts Table (optional, for credit sales)
CREATE TABLE IF NOT EXISTS user_credits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    amount_owed DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_user_credits FOREIGN KEY (user_id) REFERENCES users(phone)
);
