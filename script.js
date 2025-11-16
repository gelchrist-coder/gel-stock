// J'MONIC ENTERPRISE - Business Management System
class NaturalHairBusinessManager {
    constructor() {
        // API path for GitHub Pages deployment
        this.apiBase = './api/';
        this.products = [];
        this.sales = [];
        this.currentTransactionFilter = 'all'; // Initialize transaction filter
        this.isLoggedIn = false;
        this.isDemoMode = false;
        this.currentUser = null;
        
        this.initializeAuthSystem();
    }
    
    // Authentication System
    initializeAuthSystem() {
        // Check if user is already logged in or in demo mode
        const sessionUser = sessionStorage.getItem('gel_user');
        const demoMode = sessionStorage.getItem('gel_demo_mode');
        
        if (sessionUser) {
            this.isLoggedIn = true;
            this.currentUser = JSON.parse(sessionUser);
            this.showDashboard();
            this.initializeSystem();
        } else if (demoMode === 'true') {
            this.isDemoMode = true;
            this.currentUser = { name: 'demo', email: 'demo@gel-stock.com', role: 'demo' };
            this.showDashboard();
            this.initializeSystem();
        } else {
            this.showLoginScreen();
        }
    }
    
    /**
     * Save data to localStorage and sync to cloud if available
     * @param {string} key - Storage key
     * @param {string} value - Data to store
     */
    saveToStorage(key, value) {
        // Always save to localStorage
        localStorage.setItem(key, value);
        
        // If in demo mode and cloud sync is available, sync to cloud
        if (this.isDemoMode && window.CloudSync) {
            try {
                if (key === 'jmonic_products') {
                    const products = JSON.parse(value);
                    window.CloudSync.syncProductsToCloud(products);
                } else if (key === 'jmonic_sales') {
                    const sales = JSON.parse(value);
                    window.CloudSync.syncSalesToCloud(sales);
                }
            } catch (error) {
                console.warn('Cloud sync error:', error);
                // Silently fail - local storage is still working
            }
        }
    }
    
    /**
     * Setup cloud sync event listeners to update UI when data changes on other devices
     */
    setupCloudSyncListeners() {
        // Listen for product changes from cloud
        window.addEventListener('cloud-sync-products', (event) => {
            console.log('📱 Cloud sync - Products updated from another device');
            const products = event.detail;
            
            // Update local data
            this.products = products;
            
            // Refresh product tables and displays
            this.displayProducts();
            this.displayInventory();
            this.loadDashboardData();
            
            // Show notification
            this.showLiveNotification(
                'Data Updated',
                'Products synced from another device',
                'info',
                'fa-cloud'
            );
        });
        
        // Listen for sales changes from cloud
        window.addEventListener('cloud-sync-sales', (event) => {
            console.log('📱 Cloud sync - Sales updated from another device');
            const sales = event.detail;
            
            // Update local data
            this.sales = sales;
            
            // Refresh sales tables and displays
            this.displaySales();
            this.loadDashboardData();
            this.updateRecentSalesDisplay();
            
            // Show notification
            this.showLiveNotification(
                'Data Updated',
                'Sales synced from another device',
                'info',
                'fa-cloud'
            );
        });
    }
    
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }
    }
    
    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'flex';
        }
        
        // Update mobile header with user info
        updateMobileHeader(this.currentUser);
    }
    
    logout() {
        sessionStorage.removeItem('gel_user');
        sessionStorage.removeItem('gel_demo_mode');
        this.isLoggedIn = false;
        this.isDemoMode = false;
        this.currentUser = null;
        
        // Reset mobile header to demo state
        updateMobileHeader(null);
        
        window.location.reload();
    }
    
    /**
     * Update user profile
     */
    updateProfile() {
        try {
            const fullName = document.getElementById('profileFullName')?.value || '';
            const businessName = document.getElementById('profileBusinessName')?.value || '';
            const phone = document.getElementById('profilePhone')?.value || '';
            const email = document.getElementById('profileEmail')?.value || '';
            
            if (!fullName || !businessName) {
                this.showLiveNotification('Error', 'Full name and business name are required', 'error', 'fa-exclamation-circle');
                return;
            }
            
            // Update current user
            this.currentUser.name = fullName;
            this.currentUser.businessName = businessName;
            this.currentUser.phone = phone;
            this.currentUser.email = email;
            
            // Save to session storage
            sessionStorage.setItem('gel_user', JSON.stringify(this.currentUser));
            
            // Update header with new business name
            const headerBusinessName = document.getElementById('headerBusinessName');
            if (headerBusinessName) {
                headerBusinessName.textContent = businessName;
            }
            
            // Update mobile header
            updateMobileHeader(this.currentUser);
            
            this.showLiveNotification('Success', 'Profile updated successfully', 'success', 'fa-check-circle');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showLiveNotification('Error', 'Failed to update profile', 'error', 'fa-exclamation-circle');
        }
    }
    
    /**
     * Load profile data into form
     */
    loadProfileData() {
        try {
            if (this.currentUser) {
                document.getElementById('profileFullName').value = this.currentUser.name || '';
                document.getElementById('profileBusinessName').value = this.currentUser.businessName || '';
                document.getElementById('profilePhone').value = this.currentUser.phone || '';
                document.getElementById('profileEmail').value = this.currentUser.email || '';
                document.getElementById('profileRole').value = this.currentUser.role || 'User';
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
    
    /**
     * Show delete account confirmation
     */
    showDeleteAccountConfirm() {
        const confirmed = confirm(
            '⚠️ WARNING: This action cannot be undone!\n\n' +
            'Are you sure you want to delete your account?\n\n' +
            'This will permanently delete:\n' +
            '- Your account and profile\n' +
            '- All products and inventory\n' +
            '- All sales records\n' +
            '- All business data\n\n' +
            'Type "DELETE MY ACCOUNT" to confirm:'
        );
        
        if (confirmed) {
            const userConfirmation = prompt('Type DELETE MY ACCOUNT to confirm permanent deletion:');
            if (userConfirmation === 'DELETE MY ACCOUNT') {
                this.deleteAccount();
            } else {
                this.showLiveNotification('Cancelled', 'Account deletion cancelled', 'info', 'fa-info-circle');
            }
        }
    }
    
    /**
     * Delete user account permanently
     */
    deleteAccount() {
        try {
            // Clear all user data
            localStorage.clear();
            sessionStorage.clear();
            
            // Reset all properties
            this.isLoggedIn = false;
            this.isDemoMode = false;
            this.currentUser = null;
            this.products = [];
            this.sales = [];
            
            // Show notification and redirect to login
            this.showLiveNotification('Account Deleted', 'Your account has been permanently deleted', 'success', 'fa-trash');
            
            // Redirect to login after short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showLiveNotification('Error', 'Failed to delete account', 'error', 'fa-exclamation-circle');
        }
    }
    
    async initializeSystem() {
        console.log('J\'MONIC ENTERPRISE System Initializing...');
        console.log('API Base URL:', this.apiBase);
        console.log('User Role:', this.currentUser?.role);
        
        // Migrate existing products to include category field if missing
        this.migrateProductsWithoutCategory();
        
        // Initialize settings first to ensure they're always available
        this.loadSettings();
        this.initializeHeaderDropdowns();
        
        // Setup cloud sync listeners for demo mode
        if (this.isDemoMode) {
            this.setupCloudSyncListeners();
        }
        // Detect if running on GitHub Pages (static hosting, no PHP backend)
        const isGitHubPages = window.location.hostname.includes('github.io');
        
        if (isGitHubPages) {
            console.warn('⚠️ Running on GitHub Pages (static hosting - no PHP backend available)');
            console.warn('System will work in offline mode with localStorage only.');
            this.showInitialHelpMessage();
            return;
        }
        
        // First test the connection (only if not on GitHub Pages)
        try {
            console.log('Testing API connection...');
            const testResult = await this.apiCall('test.php');
            console.log('✅ API Connection successful:', testResult.data);
            
            // If connection works, load dashboard data
            await this.loadDashboardData();
            console.log('System Ready - J\'MONIC ENTERPRISE Dashboard Loaded!');
        } catch (error) {
            console.warn('❌ API Connection failed:', error.message);
            console.warn('System will work in offline mode.');
            this.showInitialHelpMessage();
        }
    }

    migrateProductsWithoutCategory() {
        try {
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            let needsMigration = false;

            // Check if any products are missing the category field
            products.forEach(product => {
                if (!product.category) {
                    product.category = 'Uncategorized';
                    needsMigration = true;
                }
            });

            // Save migrated products if needed
            if (needsMigration) {
                localStorage.setItem('jmonic_products', JSON.stringify(products));
                console.log('✅ Products migrated to include category field');
            }
        } catch (error) {
            console.error('Error migrating products:', error);
        }
    }

    
    showInitialHelpMessage() {
        // Update KPI cards with helpful messages
        const kpiCards = document.querySelectorAll('.kpi-card .kpi-value');
        if (kpiCards.length >= 4) {
            kpiCards[0].textContent = 'GHS 0.00';
            kpiCards[1].textContent = '0';
            kpiCards[2].textContent = '0';
            kpiCards[3].textContent = '0';
        }
        
        // Show help message in alerts
        const alertsList = document.querySelector('.alert-list');
        if (alertsList) {
            alertsList.innerHTML = `
                <div class="alert-item">
                    <div class="alert-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="alert-content">
                        <p>Server connection issue detected</p>
                        <span class="alert-action">Please ensure your web server is running and database is configured</span>
                    </div>
                </div>
                <div class="alert-item">
                    <div class="alert-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <div class="alert-content">
                        <p>Check BACKEND_SETUP.md for setup instructions</p>
                        <span class="alert-action">Import database and update config.php</span>
                    </div>
                </div>
            `;
        }
    }

    // API Methods
    async apiCall(endpoint, method = 'GET', data = null) {
        // Temporary localStorage-based solution until PHP backend is set up
        try {
            console.log('Using localStorage backend for:', endpoint, method);
            
            if (endpoint === 'products.php') {
                return this.handleProductsAPI(method, data);
            } else if (endpoint === 'sales.php') {
                return this.handleSalesAPI(method, data);
            } else if (endpoint === 'dashboard.php') {
                return this.handleDashboardAPI();
            }
            
            // Fallback for unknown endpoints
            return { success: true, data: [], message: 'Backend not configured' };
        } catch (error) {
            console.error('API call failed:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    handleProductsAPI(method, data) {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        
        if (method === 'POST') {
            // Add new product or update existing if SKU exists
            // Validate numeric inputs
            const sellingPrice = parseFloat(data.sellingPrice);
            const costPrice = parseFloat(data.costPrice);
            const stockQuantity = parseInt(data.stockQuantity);
            const reorderLevel = parseInt(data.reorderLevel) || 10;
            
            if (isNaN(sellingPrice) || sellingPrice <= 0) {
                throw new Error('Please enter a valid selling price');
            }
            
            if (isNaN(costPrice) || costPrice < 0) {
                throw new Error('Please enter a valid cost price');
            }
            
            if (isNaN(stockQuantity) || stockQuantity < 0) {
                throw new Error('Please enter a valid stock quantity');
            }
            
            // Check if product with same SKU already exists
            const existingProductIndex = products.findIndex(p => p.sku === data.sku);
            
            if (existingProductIndex !== -1) {
                // Validate that product name matches existing SKU
                const existingProduct = products[existingProductIndex];
                if (existingProduct.name.toLowerCase().trim() !== data.productName.toLowerCase().trim()) {
                    throw new Error(`SKU "${data.sku}" already exists with product name "${existingProduct.name}". Product names must match when using the same SKU.`);
                }
                
                // Update existing product by adding to stock quantity
                products[existingProductIndex] = {
                    ...existingProduct,
                    name: data.productName, // Keep the name consistent
                    description: data.description || existingProduct.description,
                    selling_price: sellingPrice,
                    cost_price: costPrice,
                    stock_quantity: existingProduct.stock_quantity + stockQuantity, // Add to existing stock
                    reorder_level: reorderLevel,
                    updated_at: new Date().toISOString()
                };
                
                // Show update notification
                this.showLiveNotification(
                    'Product Updated!', 
                    `${data.productName} stock updated. New quantity: ${products[existingProductIndex].stock_quantity}`, 
                    'success', 
                    'fa-sync-alt'
                );
            } else {
                // Check if product name already exists with different SKU
                const existingNameIndex = products.findIndex(p => p.name.toLowerCase().trim() === data.productName.toLowerCase().trim());
                if (existingNameIndex !== -1) {
                    const existingProductWithName = products[existingNameIndex];
                    throw new Error(`Product name "${data.productName}" already exists with SKU "${existingProductWithName.sku}". Please use the existing SKU or choose a different product name.`);
                }
                // Create new product
                const newProduct = {
                    id: Date.now(),
                    sku: data.sku,
                    name: data.productName,
                    category: data.category || 'Uncategorized',
                    description: data.description || '',
                    selling_price: sellingPrice,
                    cost_price: costPrice,
                    stock_quantity: stockQuantity,
                    reorder_level: reorderLevel,
                    status: 'active',
                    created_at: new Date().toISOString()
                };
                products.push(newProduct);
                
                // Show new product notification
                this.showLiveNotification(
                    'Product Added!', 
                    `${data.productName} has been added to inventory`, 
                    'success', 
                    'fa-plus-circle'
                );
            }
            this.saveToStorage('jmonic_products', JSON.stringify(products));
            
            // Log initial stock as inventory transaction for new products only
            if (existingProductIndex === -1) {
                const currentProduct = products[products.length - 1]; // Get the newly added product
                if (currentProduct && currentProduct.stock_quantity > 0) {
                    this.logInventoryTransaction(
                        currentProduct.id,
                        currentProduct.name,
                        'purchase',
                        currentProduct.stock_quantity,
                        0,
                        currentProduct.stock_quantity,
                        'Initial stock entry'
                    );
                }
            }
            
            // Debug: Check if product should be low stock
            const addedProduct = existingProductIndex !== -1 ? products[existingProductIndex] : products[products.length - 1];
            console.log('Product processed:', {
                name: addedProduct.name,
                stock: addedProduct.stock_quantity,
                reorderLevel: addedProduct.reorder_level,
                isLowStock: addedProduct.stock_quantity <= addedProduct.reorder_level
            });
            
            // Update product stats if on products page
            setTimeout(() => {
                if (document.querySelector('#products.active')) {
                    this.updateProductStats(products);
                }
            }, 100);
            
            return { success: true, data: addedProduct, message: 'Product processed successfully' };
        } else {
            // Get products
            return { success: true, data: products };
        }
    }
    
    handleSalesAPI(method, data) {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        
        if (method === 'POST') {
            console.log('Processing sale data:', data);
            
            // Get current products for inventory management and cost calculation
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            // Validate data
            if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
                throw new Error('No products in sale data');
            }
            
            console.log('Sale products to process:', data.products);
            
            // Calculate actual cost based on product cost prices and update inventory
            let totalCost = 0;
            const saleProducts = [];
            
            data.products.forEach(saleProduct => {
                console.log('Looking for product with ID:', saleProduct.id, 'Available products:', products.map(p => p.id));
                const product = products.find(p => p.id == saleProduct.id);
                if (product) {
                    console.log('Found product:', product.name);
                    // Check stock availability
                    if (product.stock_quantity < saleProduct.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${saleProduct.quantity}`);
                    }
                    
                    // Calculate cost for this product
                    const productCost = (product.cost_price || 0) * saleProduct.quantity;
                    totalCost += productCost;
                    
                    // Update product stock
                    console.log(`Updating ${product.name}: ${product.stock_quantity} - ${saleProduct.quantity} = ${product.stock_quantity - saleProduct.quantity}`);
                    product.stock_quantity -= saleProduct.quantity;
                    product.last_sold = new Date().toISOString();
                    
                    // Add inventory transaction log to product
                    if (!product.transactions) product.transactions = [];
                    const saleRef = `Sale #${Date.now().toString().slice(-5)}`;
                    product.transactions.push({
                        type: 'sale',
                        quantity: -saleProduct.quantity,
                        previous_stock: product.stock_quantity + saleProduct.quantity,
                        new_stock: product.stock_quantity,
                        date: new Date().toISOString(),
                        reference: saleRef
                    });
                    
                    // Also log to centralized inventory transactions
                    this.logInventoryTransaction(
                        product.id,
                        product.name,
                        'sale',
                        -saleProduct.quantity,
                        product.stock_quantity + saleProduct.quantity,
                        product.stock_quantity,
                        saleRef
                    );
                    
                    // Store enhanced product info in sale
                    saleProducts.push({
                        ...saleProduct,
                        cost_price: product.cost_price || 0,
                        product_cost: productCost,
                        margin: saleProduct.price > 0 ? ((saleProduct.price - (product.cost_price || 0)) / saleProduct.price) * 100 : 0
                    });
                } else {
                    console.error('Product not found in inventory:', saleProduct);
                    throw new Error(`Product with ID "${saleProduct.id}" not found in inventory. Available IDs: ${products.map(p => p.id).join(', ')}`);
                }
            });
            
            // Save updated products back to localStorage
            localStorage.setItem('jmonic_products', JSON.stringify(products));
            
            // Update product stats if on products page
            setTimeout(() => {
                if (document.querySelector('#products.active')) {
                    this.updateProductStats(products);
                }
            }, 100);
            
            // Create comprehensive sale record
            const saleAmount = parseFloat(data.revenue || 0);
            const newSale = {
                id: Date.now(),
                sale_id: `#S-${Date.now().toString().slice(-5)}`,
                products: saleProducts,
                revenue: saleAmount,
                total_amount: saleAmount, // Include both field names for consistency
                cost: totalCost,
                profit: saleAmount - totalCost,
                profit_margin: saleAmount > 0 ? ((saleAmount - totalCost) / saleAmount) * 100 : 0,
                date: data.date || new Date().toISOString(),
                payment_method: data.paymentMethod,
                status: 'completed',
                inventory_updated: true,
                created_at: new Date().toISOString()
            };
            
            sales.push(newSale);
            this.saveToStorage('jmonic_sales', JSON.stringify(sales));
            console.log('Sale saved with inventory update:', newSale);
            
            // Flag that charts need updating
            this.shouldUpdateCharts = true;
            
            // Refresh the recent sales table and targets
            setTimeout(() => {
                this.loadRecentSalesTable();
                this.refreshLowStockData(); // Also refresh low stock in case inventory changed
                this.updateInventoryReports(); // Update inventory reports
                
                // Update sales targets with new data
                const updatedSales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
                this.updateSalesTargets(updatedSales);
            }, 100);
            
            return { success: true, data: newSale, message: 'Sale recorded successfully' };
        } else {
            // Get sales
            return { success: true, data: sales };
        }
    }
    
    handleDashboardAPI() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        
        const today = new Date().toDateString();
        const todaySales = sales.filter(sale => 
            new Date(sale.date).toDateString() === today
        );
        
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.revenue, 0);
        const lowStockProducts = products.filter(product => {
            const stock = product.stock_quantity || 0;
            const reorderLevel = product.reorder_level || product.reorderLevel || 5;
            return stock <= reorderLevel;
        });
        
        return {
            success: true,
            data: {
                today_sales: todayRevenue,
                total_products: products.length,
                low_stock_count: lowStockProducts.length,
                low_stock_products: lowStockProducts,
                recent_sales: sales.slice(-5).reverse()
            }
        };
    }
    
    // Load Dashboard Data
    async loadDashboardData() {
        try {
            const result = await this.apiCall('dashboard.php');
            console.log('Dashboard API result:', result);
            
            if (result && result.data) {
                this.updateKPICards(result.data);
                this.updateRecentSales(result.data.recent_sales);
                this.updateLowStockAlerts(result.data.low_stock_products);
            } else {
                console.error('Invalid dashboard data structure:', result);
            }
            
            // Load sales data for sales section if visible
            if (document.getElementById('salesTableBody')) {
                await this.loadSalesData();
            }
            
            // Populate weekly sales table
            this.populateWeeklySalesTable();
            this.populateRevenueTargetTable();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            
            // Set default values if dashboard loading fails, but calculate from localStorage
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
            
            const lowStockCount = products.filter(p => {
                const stock = p.stock_quantity || 0;
                const reorderLevel = p.reorder_level || p.reorderLevel || p.min_stock_level || 5;
                return stock <= reorderLevel;
            }).length;
            
            const todaySales = sales.filter(sale => {
                const saleDate = new Date(sale.date || sale.created_at);
                const today = new Date();
                return saleDate.toDateString() === today.toDateString();
            }).reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
            
            this.updateKPICards({
                today_sales: todaySales,
                total_products: products.length,
                low_stock_count: lowStockCount
            });
            
            // Update debt display from creditors data even if API call fails
            this.updateDebtDisplay();
        }
        
        // Initialize targets editing functionality
        this.initTargetsEditing();
        
        // Load low stock alerts for dashboard
        this.loadLowStockAlerts();
        
        // Load recent sales for dashboard
        this.loadRecentSalesTable();
        
        // Update sales targets with real data
        const allSales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        this.updateSalesTargets(allSales);
        
        // Update product stats and refresh inventory data if products exist
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        if (products.length > 0) {
            this.updateProductStats(products);
            this.refreshLowStockData();
        }
        
        // Create sample inventory transactions if none exist
        this.createSampleInventoryTransactions();
        
        // Update inventory reports and transaction log
        this.updateInventoryReports();
    }
    
    // Refresh low stock data across the dashboard
    refreshLowStockData() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        
        // Calculate low stock count
        const lowStockCount = products.filter(p => {
            const stock = p.stock_quantity || 0;
            const reorderLevel = p.reorder_level || p.reorderLevel || p.min_stock_level || 5;
            return stock <= reorderLevel;
        }).length;
        
        // Low stock card removed - now only shown in notifications
        
        // Update the low stock alerts table
        this.loadLowStockAlerts();
        
        // Update any notification badges
        this.updateLowStockNotifications(products);
    }
    
    updateLowStockNotifications(products) {
        const lowStockProducts = products.filter(p => {
            const stock = p.stock_quantity || 0;
            const reorderLevel = p.reorder_level || p.reorderLevel || p.min_stock_level || 5;
            return stock <= reorderLevel;
        });
        
        // Update notification badge
        const badge = document.querySelector('.notification-badge');
        if (badge && lowStockProducts.length > 0) {
            badge.textContent = lowStockProducts.length;
            badge.style.display = 'block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }
    
    // Product Methods
    // Standardized reorder level calculation
    getReorderLevel(product) {
        return product.reorder_level || product.reorderLevel || product.min_stock_level || 10;
    }

    // Check if product is low stock using standardized reorder level
    isLowStock(product) {
        const stock = parseInt(product.stock_quantity) || 0;
        const reorderLevel = this.getReorderLevel(product);
        return stock <= reorderLevel;
    }

    async addProduct(productData) {
        try {
            const result = await this.apiCall('products.php', 'POST', productData);
            this.showNotification('Product added successfully!', 'success');
            
            // Show live notification
            this.showLiveNotification(
                'Product Added!', 
                `${productData.name} has been added to inventory`, 
                'success', 
                'fa-plus-circle'
            );
            
            // Trigger notification alert
            this.showNotificationAlert();
            
            // Refresh all relevant data
            await this.loadDashboardData(); // Refresh dashboard
            
            // Update notification badge
            if (typeof updateNotificationBadge === 'function') {
                updateNotificationBadge();
            }
            
            // Refresh products inventory if on products page
            const currentSection = document.querySelector('.content-section.active');
            if (currentSection && currentSection.id === 'products') {
                await this.loadProductsInventory();
            }
            
            return result.data;
        } catch (error) {
            console.error('Failed to add product:', error);
            this.showNotification('Failed to add product. Please try again.', 'error');
            return null;
        }
    }
    
    async updateProduct(productId, productData) {
        try {
            // Get existing products
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            // Find and update the product
            const productIndex = products.findIndex(p => p.id == productId);
            if (productIndex === -1) {
                throw new Error('Product not found');
            }
            
            const existingProduct = products[productIndex];
            const oldStockQuantity = existingProduct.stock_quantity || 0;
            const newStockQuantity = parseInt(productData.stockQuantity) || 0;
            
            // Update the product while preserving the ID and creation date
            const updatedProduct = {
                ...existingProduct,
                sku: productData.sku,
                name: productData.productName,
                category: productData.category || existingProduct.category || 'Uncategorized',
                description: productData.description || '',
                selling_price: parseFloat(productData.sellingPrice),
                cost_price: parseFloat(productData.costPrice),
                stock_quantity: newStockQuantity,
                reorder_level: parseInt(productData.reorderLevel) || 10,
                updated_at: new Date().toISOString()
            };
            
            // Log inventory transaction if stock quantity changed
            if (oldStockQuantity !== newStockQuantity) {
                const stockDifference = newStockQuantity - oldStockQuantity;
                this.logInventoryTransaction(
                    productId,
                    updatedProduct.name,
                    'adjustment',
                    stockDifference,
                    oldStockQuantity,
                    newStockQuantity,
                    'Stock quantity edited'
                );
                console.log(`Stock adjustment logged: ${existingProduct.name} changed from ${oldStockQuantity} to ${newStockQuantity} (${stockDifference > 0 ? '+' : ''}${stockDifference})`);
            }
            
            products[productIndex] = updatedProduct;
            localStorage.setItem('jmonic_products', JSON.stringify(products));
            
            this.showNotification('Product updated successfully!', 'success');
            
            // Check if stock is low and show live notification
            const reorderLevel = updatedProduct.reorder_level || 5;
            if (newStockQuantity <= reorderLevel && newStockQuantity > 0) {
                this.showLiveNotification(
                    'Low Stock Alert!', 
                    `${updatedProduct.name} is running low (${newStockQuantity} remaining)`, 
                    'warning', 
                    'fa-exclamation-triangle'
                );
                // Trigger notification alert for low stock
                this.showNotificationAlert();
            } else if (newStockQuantity === 0) {
                this.showLiveNotification(
                    'Out of Stock!', 
                    `${updatedProduct.name} is now out of stock`, 
                    'warning', 
                    'fa-times-circle'
                );
                // Trigger notification alert for out of stock
                this.showNotificationAlert();
            }
            
            await this.loadDashboardData(); // Refresh dashboard
            this.updateInventoryReports(); // Update inventory reports
            
            return updatedProduct;
        } catch (error) {
            console.error('Failed to update product:', error);
            this.showNotification('Failed to update product: ' + error.message, 'error');
            return null;
        }
    }
    
    async getProducts(params = {}) {
        try {
            const result = await this.apiCall('products.php', 'GET', params);
            return result.data;
        } catch (error) {
            console.error('Failed to get products:', error);
            return { products: [], pagination: {} };
        }
    }
    
    // Sales Methods
    async recordSale(saleData) {
        try {
            // Add current user's name to the sale data
            if (this.currentUser) {
                saleData.recorded_by = this.currentUser.fullName || this.currentUser.name || 'System User';
            } else {
                saleData.recorded_by = 'System User';
            }
            
            const result = await this.apiCall('sales.php', 'POST', saleData);
            this.showNotification('Sale recorded successfully!', 'success');
            
            // Show live notification for sale
            const totalAmount = parseFloat(saleData.total_amount || 0);
            this.showLiveNotification(
                'Sale Recorded!', 
                `Sale completed for GHS ${totalAmount.toFixed(2)}`, 
                'success', 
                'fa-shopping-cart'
            );
            
            await this.loadDashboardData(); // Refresh dashboard
            return result.data;
        } catch (error) {
            console.error('Failed to record sale:', error);
            return null;
        }
    }
    
    async getSales(params = {}) {
        try {
            const result = await this.apiCall('sales.php', 'GET', params);
            return result.data;
        } catch (error) {
            console.error('Failed to get sales:', error);
            return { sales: [], pagination: {} };
        }
    }

    // Sales Methods
    async loadProductsForSale() {
        try {
            console.log('Loading categories for sale...');
            const response = await this.apiCall('products.php');
            const products = response.data;
            console.log('Products loaded:', products);
            
            const categoryCheckboxesContainer = document.getElementById('categoryCheckboxes');
            
            if (!categoryCheckboxesContainer) {
                console.error('Category checkboxes container not found');
                return;
            }
            
            // Get unique categories
            const categories = new Set();
            products.forEach(product => {
                const category = product.category || 'Uncategorized';
                categories.add(category);
            });
            
            // Clear existing checkboxes
            categoryCheckboxesContainer.innerHTML = '';
            
            if (categories.size === 0) {
                categoryCheckboxesContainer.innerHTML = '<p style="color: #94a3b8; font-size: 0.85rem; margin: 0;">No categories available</p>';
                return;
            }
            
            // Add categories as checkboxes (sorted alphabetically)
            Array.from(categories).sort().forEach(category => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'category-checkbox-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `category-${category}`;
                checkbox.value = category;
                checkbox.className = 'category-checkbox';
                checkbox.onchange = () => this.loadProductsByCategory();
                
                const label = document.createElement('label');
                label.htmlFor = `category-${category}`;
                label.textContent = `📦 ${category}`;
                
                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                categoryCheckboxesContainer.appendChild(checkboxDiv);
            });
            
            console.log(`Added ${categories.size} categories as checkboxes`);
        } catch (error) {
            console.error('Failed to load categories for sale:', error);
            this.showNotification('Failed to load categories for sale', 'error');
        }
    }

    loadProductsByCategory() {
        try {
            // Get all checked categories
            const checkedCategories = Array.from(
                document.querySelectorAll('.category-checkbox:checked')
            ).map(checkbox => checkbox.value);
            
            const productSelect = document.getElementById('productSelect');
            
            // Reset product dropdown
            productSelect.innerHTML = '<option value="">Select Product</option>';
            
            if (checkedCategories.length === 0) {
                return;
            }
            
            // Get all products
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            // Filter products by selected categories
            const categoryProducts = products.filter(p => 
                checkedCategories.includes(p.category || 'Uncategorized')
            );
            
            if (categoryProducts.length === 0) {
                productSelect.innerHTML += '<option value="" disabled>No products in selected categories</option>';
                return;
            }
            
            // Add products to dropdown
            categoryProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.dataset.price = product.selling_price;
                option.dataset.stock = product.stock_quantity;
                option.dataset.name = product.name;
                option.dataset.cost = product.cost_price || 0;
                option.dataset.sku = product.sku || '';
                option.dataset.category = product.category || 'Uncategorized';
                
                if (product.stock_quantity <= 0) {
                    option.textContent = `${product.name} - GHS ${product.selling_price} (OUT OF STOCK)`;
                    option.disabled = true;
                    option.style.color = '#ef4444';
                } else if (product.stock_quantity <= (product.reorder_level || 10)) {
                    option.textContent = `${product.name} - GHS ${product.selling_price} (${product.stock_quantity} left - LOW STOCK)`;
                    option.style.color = '#f59e0b';
                } else {
                    option.textContent = `${product.name} - GHS ${product.selling_price} (${product.stock_quantity} in stock)`;
                }
                
                productSelect.appendChild(option);
            });
            
            console.log(`Loaded ${categoryProducts.length} products for categories: ${checkedCategories.join(', ')}`);
        } catch (error) {
            console.error('Failed to load products by category:', error);
            this.showNotification('Failed to load products', 'error');
        }
    }

    searchProducts() {
        // This function is no longer needed - using dropdown instead
    }

    selectProductFromDropdown() {
        const productSelect = document.getElementById('productSelect');
        
        if (!productSelect.value) {
            document.getElementById('selectedProductDisplay').style.display = 'none';
            return;
        }
        
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productName = selectedOption.dataset.name;
        const sellingPrice = selectedOption.dataset.price;
        
        // Update product display
        const selectedDisplay = document.getElementById('selectedProductDisplay');
        const selectedProductName = document.getElementById('selectedProductName');
        selectedProductName.textContent = `✓ ${productName} (GHS ${parseFloat(sellingPrice).toFixed(2)})`;
        selectedDisplay.style.display = 'inline-flex';
    }

    addProductToSale() {
        const productSelect = document.getElementById('productSelect');
        const quantityInput = document.getElementById('productQuantity');
        const selectedProductsDiv = document.getElementById('selectedProducts');
        
        // Check if product is selected
        if (!productSelect || !productSelect.value) {
            this.showNotification('Please search and select a product first', 'warning');
            return;
        }
        
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productId = selectedOption.value;
        const productName = selectedOption.dataset.name;
        
        // Safe numeric parsing with validation
        const productPrice = parseFloat(selectedOption.dataset.price);
        const availableStock = parseInt(selectedOption.dataset.stock);
        const costPrice = parseFloat(selectedOption.dataset.cost) || 0;
        const quantity = parseFloat(quantityInput.value) || 0.5;
        
        console.log('Adding product to sale:', { productId, productName, productPrice, availableStock, quantity });
        
        // Validate parsed numbers
        if (isNaN(productPrice) || productPrice <= 0) {
            this.showNotification('Invalid product price. Please check product data.', 'error');
            return;
        }
        
        if (isNaN(availableStock) || availableStock < 0) {
            this.showNotification('Invalid stock quantity. Please check product data.', 'error');
            return;
        }
        
        if (isNaN(quantity) || quantity <= 0) {
            this.showNotification('Please enter a valid quantity.', 'error');
            return;
        }
        
        // Enhanced stock validation
        if (quantity > availableStock) {
            this.showNotification(`Insufficient stock! Only ${availableStock} units available for ${productName}`, 'error');
            return;
        }
        
        if (availableStock <= 0) {
            this.showNotification(`${productName} is out of stock!`, 'error');
            return;
        }
        
        // Check if product already added and update quantity if needed
        const existingProduct = selectedProductsDiv.querySelector(`[data-product-id="${productId}"]`);
        if (existingProduct) {
            const productPriceEl = existingProduct.querySelector('.product-price');
            if (!productPriceEl) {
                this.showNotification('Error: Product price element not found', 'error');
                return;
            }
            const existingQuantityMatch = productPriceEl.textContent.match(/× ([\d.]+) =/);
            const existingQuantity = existingQuantityMatch ? parseFloat(existingQuantityMatch[1]) : 0;
            const newQuantity = existingQuantity + quantity;
            
            if (newQuantity > availableStock) {
                this.showNotification(`Cannot add ${quantity} more units. Total would be ${newQuantity}, but only ${availableStock} available`, 'error');
                return;
            }
            
            // Update existing item
            const subtotal = productPrice * newQuantity;
            existingProduct.dataset.quantity = newQuantity;
            existingProduct.dataset.subtotal = subtotal;
            existingProduct.querySelector('.product-price').innerHTML = `
                GHS ${productPrice.toFixed(2)} × ${newQuantity} = GHS ${subtotal.toFixed(2)}
                <small class="stock-info">(${availableStock - newQuantity} remaining)</small>
            `;
        } else {
            // Add new product to selected products
            const subtotal = productPrice * quantity;
            const productDiv = document.createElement('div');
            productDiv.className = 'selected-product-item';
            productDiv.dataset.productId = productId;
            productDiv.dataset.productName = productName;
            productDiv.dataset.productPrice = productPrice;
            productDiv.dataset.quantity = quantity;
            productDiv.dataset.subtotal = subtotal;
            productDiv.innerHTML = `
                <div class="product-details">
                    <span class="product-name">${productName}</span>
                    <span class="product-price">
                        GHS ${productPrice.toFixed(2)} × ${quantity} = GHS ${subtotal.toFixed(2)}
                        <small class="stock-info">(${availableStock - quantity} remaining)</small>
                    </span>
                    <span class="product-margin">
                        <small>Cost: GHS ${costPrice.toFixed(2)} | Margin: ${productPrice > 0 ? (((productPrice - costPrice) / productPrice) * 100).toFixed(1) : 0}%</small>
                    </span>
                </div>
                <button type="button" class="btn-remove" onclick="businessManager.removeProductFromSale('${productId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            selectedProductsDiv.appendChild(productDiv);
        }
        
        // Reset selection
        productSelect.value = '';
        quantityInput.value = '0.5';
        
        // Update total and refresh product select to show updated stock
        this.updateSaleTotal();
        this.updateProductSelectStock();
    }
    
    updateProductSelectStock() {
        // Update the product select dropdown to show current stock levels
        const productSelect = document.getElementById('productSelect');
        const selectedProductsDiv = document.getElementById('selectedProducts');
        
        if (!productSelect) return;
        
        // Calculate reserved quantities
        const reservedQuantities = {};
        selectedProductsDiv.querySelectorAll('.selected-product-item').forEach(item => {
            const productId = item.dataset.productId;
            const priceEl = item.querySelector('.product-price');
            if (priceEl) {
                const quantityMatch = priceEl.textContent.match(/× ([\d.]+) =/);
                const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 0;
                reservedQuantities[productId] = quantity;
            }
        });
        
        // Update option text to show available stock
        Array.from(productSelect.options).forEach(option => {
            if (option.value) {
                const productId = option.value;
                const originalStock = parseInt(option.dataset.stock);
                const reserved = reservedQuantities[productId] || 0;
                const available = originalStock - reserved;
                const productName = option.dataset.name;
                const price = option.dataset.price;
                
                if (available <= 0) {
                    option.textContent = `${productName} - GHS ${price} (OUT OF STOCK)`;
                    option.disabled = true;
                    option.style.color = '#ef4444';
                } else if (available <= 5) {
                    option.textContent = `${productName} - GHS ${price} (${available} left - LOW STOCK)`;
                    option.disabled = false;
                    option.style.color = '#f59e0b';
                } else {
                    option.textContent = `${productName} - GHS ${price} (${available} in stock)`;
                    option.disabled = false;
                    option.style.color = '';
                }
            }
        });
    }
    
    removeProductFromSale(productId) {
        const productDiv = document.querySelector(`[data-product-id="${productId}"]`);
        if (productDiv) {
            productDiv.remove();
            this.updateSaleTotal();
        }
    }
    
    updateSaleTotal() {
        const selectedProducts = document.querySelectorAll('.selected-product-item');
        let total = 0;
        
        selectedProducts.forEach(item => {
            const priceEl = item.querySelector('.product-price');
            if (!priceEl) return; // Skip if element not found
            const priceText = priceEl.textContent;
            // Look for pattern like "GHS 100.00 × 7 = GHS 700.00"
            const match = priceText.match(/= GHS ([\d.]+)/);
            if (match) {
                const amount = parseFloat(match[1]);
                total += amount;
            }
        });
        
        // Update the total amount display
        const totalInput = document.getElementById('totalAmount');
        if (totalInput) {
            if (total > 0) {
                // Update as span (textContent) not input (value)
                totalInput.textContent = `GHS ${total.toFixed(2)}`;
                totalInput.style.display = 'block';
                
                console.log('Total calculated:', total.toFixed(2)); // Debug log
            } else {
                totalInput.textContent = 'GHS 0.00';
                totalInput.style.display = 'block';
            }
        }
        
        console.log('Updated sale total:', total.toFixed(2));
    }

    handlePaymentMethodChange() {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const creditSection = document.getElementById('creditPaymentSection');
        
        if (paymentMethod === 'credit') {
            creditSection.style.display = 'block';
            document.getElementById('creditCustomerName').required = true;
            
            // Auto-fill credit customer name from main customer name field
            const mainCustomerName = document.getElementById('customerName').value.trim();
            if (mainCustomerName) {
                document.getElementById('creditCustomerName').value = mainCustomerName;
            }
            
            this.updateCreditSummary();
        } else {
            creditSection.style.display = 'none';
            document.getElementById('creditCustomerName').required = false;
            document.getElementById('creditCustomerName').value = '';
            document.getElementById('creditCustomerPhone').value = '';
            document.getElementById('creditAmountPaid').value = '0.00';
            document.getElementById('creditDueDate').value = '';
            document.getElementById('creditNotes').value = '';
        }
    }

    // Sync customer name to credit section when main field changes
    syncCreditCustomerName() {
        const mainCustomerName = document.getElementById('customerName').value.trim();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Only sync if credit payment is selected
        if (paymentMethod === 'credit') {
            document.getElementById('creditCustomerName').value = mainCustomerName;
        }
    }

    updateCreditSummary() {
        const totalAmount = parseFloat(document.getElementById('totalAmount').textContent.replace('GHS ', '')) || 0;
        const amountPaid = parseFloat(document.getElementById('creditAmountPaid').value) || 0;
        const outstanding = totalAmount - amountPaid;
        
        document.getElementById('creditTotalDisplay').textContent = totalAmount.toFixed(2);
        document.getElementById('creditPaidDisplay').textContent = Math.max(0, amountPaid).toFixed(2);
        document.getElementById('creditOutstandingDisplay').textContent = Math.max(0, outstanding).toFixed(2);
        
        // Validate that paid amount doesn't exceed total
        if (amountPaid > totalAmount) {
            document.getElementById('creditAmountPaid').value = totalAmount.toFixed(2);
        }
    }

    validateCreditPayment() {
        const customerName = document.getElementById('creditCustomerName').value.trim();
        const amountPaid = parseFloat(document.getElementById('creditAmountPaid').value) || 0;
        const totalAmount = parseFloat(document.getElementById('totalAmount').textContent.replace('GHS ', '')) || 0;
        const dueDate = document.getElementById('creditDueDate').value;
        
        if (!customerName) {
            this.showNotification('Please enter customer name for credit sales', 'error');
            return false;
        }
        
        if (amountPaid < 0) {
            this.showNotification('Amount paid cannot be negative', 'error');
            return false;
        }
        
        if (amountPaid > totalAmount) {
            this.showNotification('Amount paid cannot exceed total amount', 'error');
            return false;
        }
        
        if (!dueDate) {
            this.showNotification('Please set a credit due date', 'error');
            return false;
        }
        
        // Check if due date is in the future
        const dueDateObj = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDateObj <= today) {
            this.showNotification('Due date must be in the future', 'error');
            return false;
        }
        
        return true;
    }
    
    async submitSale(formData) {
        const selectedProducts = document.querySelectorAll('.selected-product-item');
        
        console.log('submitSale called, selected products count:', selectedProducts.length);
        
        if (selectedProducts.length === 0) {
            this.showNotification('Please add at least one product to the sale', 'warning');
            return;
        }

        // Get payment method
        const paymentMethod = formData.get('paymentMethod');
        
        // Validate credit payment if selected
        if (paymentMethod === 'credit') {
            if (!this.validateCreditPayment()) {
                return;
            }
        }
        
        // Calculate actual total from selected products
        let calculatedTotal = 0;
        selectedProducts.forEach(item => {
            const priceEl = item.querySelector('.product-price');
            if (!priceEl) return;
            const priceText = priceEl.textContent;
            const match = priceText.match(/= GHS ([\d.]+)/);
            if (match) {
                calculatedTotal += parseFloat(match[1]);
            }
        });

        // Collect sale data with current timestamp
        const now = new Date();
        const saleDate = new Date(formData.get('saleDate'));
        saleDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        
        const saleData = {
            date: saleDate.toISOString(),
            customerName: (document.getElementById('customerName')?.value || '').trim() || undefined,
            paymentMethod: paymentMethod,
            totalAmount: calculatedTotal,
            products: []
        };
        
        // Add credit payment details if applicable
        if (paymentMethod === 'credit') {
            saleData.creditCustomerName = (document.getElementById('creditCustomerName')?.value || '').trim();
            saleData.creditCustomerPhone = (document.getElementById('creditCustomerPhone')?.value || '').trim();
            saleData.creditAmountPaid = parseFloat(document.getElementById('creditAmountPaid')?.value) || 0;
            saleData.creditAmountOutstanding = calculatedTotal - saleData.creditAmountPaid;
            saleData.creditDueDate = document.getElementById('creditDueDate')?.value || '';
            saleData.creditNotes = (document.getElementById('creditNotes')?.value || '').trim();
            saleData.creditCreatedDate = new Date().toISOString();
        }
        
        // Collect product data with names - use dataset attributes instead of parsing text
        console.log('Starting product extraction loop, total selected items:', selectedProducts.length);
        selectedProducts.forEach((item, index) => {
            try {
                console.log(`Processing item ${index}:`, item);
                console.log('Item dataset:', item.dataset);
                
                const productId = item.dataset.productId;
                const productName = item.dataset.productName;
                const price = parseFloat(item.dataset.productPrice);
                const quantity = parseFloat(item.dataset.quantity);
                const subtotal = parseFloat(item.dataset.subtotal);
                
                console.log(`Item ${index} values:`, {productId, productName, price, quantity, subtotal});
                
                if (!productId || !productName || isNaN(price) || isNaN(quantity)) {
                    console.warn(`Item ${index} has invalid data:`, {productId, productName, price, quantity});
                    return;
                }
                
                saleData.products.push({
                    id: productId,
                    name: productName,
                    price: price,
                    quantity: quantity,
                    subtotal: subtotal
                });
                
                console.log(`Product ${index} added:`, {id: productId, name: productName, quantity});
            } catch (error) {
                console.error(`Error processing product item ${index}:`, error, item);
            }
        });
        
        console.log('Product extraction complete. Final products array:', saleData.products);
        console.log('Final sale data:', JSON.stringify(saleData, null, 2));
        
        try {
            const result = await this.apiCall('sales.php', 'POST', {
                ...saleData,
                revenue: parseFloat(saleData.totalAmount),
                products: saleData.products // Store full product data
            });
            
            console.log('API response:', result);
            
            if (result && result.success) {
                console.log('Sale recorded successfully');
                // Store credit data in localStorage if credit sale
                if (paymentMethod === 'credit') {
                    this.saveCreditSale(saleData);
                }
                
                this.showNotification('Sale recorded successfully! Inventory updated automatically.', 'success');
                closeModal('addSaleModal');
                
                // Show print receipt with credit details
                this.showPrintReceipt(saleData, saleData.products);
                
                // Clear selected products and reset form
                document.getElementById('selectedProducts').innerHTML = '';
                const totalAmountEl = document.getElementById('totalAmount');
                if (totalAmountEl) {
                    totalAmountEl.textContent = 'GHS 0.00';
                }
                
                // Reset form fields
                const form = document.querySelector('#addSaleModal form');
                if (form) form.reset();
                
                // Reset credit section
                this.handlePaymentMethodChange();
                
                // Refresh dashboard data to show updated inventory and revenue
                await this.loadDashboardData();
                
                // Refresh products inventory if on products page
                const currentSection = document.querySelector('.content-section.active');
                if (currentSection && currentSection.id === 'products') {
                    await this.loadProductsInventory();
                }
                
                // Update notification badge for low stock alerts
                if (typeof updateNotificationBadge === 'function') {
                    updateNotificationBadge();
                }
            } else {
                console.error('API returned success=false or invalid response:', result);
                this.showNotification(`Failed to record sale: ${result?.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Exception in submitSale:', error);
            console.error('Error stack:', error.stack);
            this.showNotification(`Failed to record sale: ${error.message}`, 'error');
        }
    }

    saveCreditSale(saleData) {
        try {
            let credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');
            
            const creditRecord = {
                id: `CREDIT-${Date.now()}`,
                customerName: saleData.creditCustomerName,
                customerPhone: saleData.creditCustomerPhone,
                totalAmount: saleData.totalAmount,
                amountPaid: saleData.creditAmountPaid,
                amountOutstanding: saleData.creditAmountOutstanding,
                dueDate: saleData.creditDueDate,
                createdDate: saleData.creditCreatedDate,
                notes: saleData.creditNotes,
                products: saleData.products,
                status: 'pending', // pending, partial, paid
                payments: [
                    {
                        date: saleData.creditCreatedDate,
                        amount: saleData.creditAmountPaid,
                        note: 'Initial payment'
                    }
                ]
            };
            
            // Determine status based on payment
            if (saleData.creditAmountPaid >= saleData.totalAmount) {
                creditRecord.status = 'paid';
            } else if (saleData.creditAmountPaid > 0) {
                creditRecord.status = 'partial';
            }
            
            credits.push(creditRecord);
            localStorage.setItem('jmonic_credits', JSON.stringify(credits));
            
            // Update the credit sales display
            this.updateCreditSalesDisplay();
            
            console.log('Credit sale saved:', creditRecord);
        } catch (error) {
            console.error('Failed to save credit sale:', error);
        }
    }

    // Load and display creditors
    loadCreditors() {
        try {
            const credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');
            this.displayCreditors(credits);
            this.updateCreditorStats(credits);
        } catch (error) {
            console.error('Failed to load creditors:', error);
        }
    }

    updateCreditorStats(credits) {
        let totalCreditors = 0;
        let totalReceivables = 0;
        let totalOverdue = 0;
        const today = new Date().toISOString().split('T')[0];

        const uniqueCustomers = new Map();

        credits.forEach(credit => {
            const key = credit.customerName + credit.customerPhone;
            if (!uniqueCustomers.has(key)) {
                uniqueCustomers.set(key, credit);
                totalCreditors++;
            }

            totalReceivables += credit.amountOutstanding || 0;

            // Check if overdue
            if (credit.dueDate && credit.dueDate < today && credit.status !== 'paid') {
                totalOverdue += credit.amountOutstanding || 0;
            }
        });

        // Update stats
        document.getElementById('totalCreditorsCount').textContent = totalCreditors;
        document.getElementById('totalReceivables').textContent = `GHS ${totalReceivables.toFixed(2)}`;
        document.getElementById('totalOverdue').textContent = `GHS ${totalOverdue.toFixed(2)}`;
    }

    displayCreditors(credits, filter = 'all') {
        const listContainer = document.getElementById('creditorsTableBody');
        const emptyState = document.getElementById('creditorsEmpty');

        if (!credits || credits.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Filter credits based on status
        let filteredCredits = credits;
        const today = new Date().toISOString().split('T')[0];

        if (filter !== 'all') {
            if (filter === 'overdue') {
                filteredCredits = credits.filter(c => c.dueDate < today && c.status !== 'paid');
            } else {
                filteredCredits = credits.filter(c => c.status === filter);
            }
        }

        if (filteredCredits.length === 0) {
            listContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        listContainer.innerHTML = filteredCredits.map(credit => {
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = credit.dueDate < today && credit.status !== 'paid';
            const statusClass = isOverdue ? 'overdue' : credit.status;
            const statusText = isOverdue ? 'Overdue' : credit.status.charAt(0).toUpperCase() + credit.status.slice(1);

            return `
                <div class="creditor-card ${statusClass}">
                    <div class="creditor-status-indicator">
                        <i class="fas fa-${this.getStatusIcon(isOverdue ? 'overdue' : credit.status)}"></i>
                    </div>
                    <div class="creditor-info">
                        <div class="creditor-name">${credit.customerName}</div>
                        <a href="tel:${credit.customerPhone}" class="creditor-phone">
                            <i class="fas fa-phone"></i> ${credit.customerPhone || 'N/A'}
                        </a>
                    </div>
                    <div class="creditor-details">
                        <div>
                            <div class="amount-label">Outstanding</div>
                            <div class="creditor-outstanding">GHS ${parseFloat(credit.amountOutstanding).toFixed(2)}</div>
                            <div class="creditor-due-date">Due: ${credit.dueDate}</div>
                        </div>
                        <div>
                            <div class="amount-label">Status</div>
                            <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${statusText}</div>
                            <div class="amount-label">Paid: GHS ${parseFloat(credit.amountPaid).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="creditor-actions">
                        <button class="btn-action" onclick="businessManager.recordCreditPayment('${credit.id}')">
                            <i class="fas fa-money-bill"></i> Payment
                        </button>
                        <button class="btn-action secondary" onclick="businessManager.viewCreditDetails('${credit.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatusIcon(status) {
        switch (status) {
            case 'pending': return 'hourglass-half';
            case 'partial': return 'hourglass-half';
            case 'paid': return 'check-circle';
            case 'overdue': return 'exclamation-circle';
            default: return 'clock';
        }
    }

    filterCreditorsByStatus(status) {
        const credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');
        this.displayCreditors(credits, status);

        // Update filter buttons
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.closest('.filter-chip').classList.add('active');
    }

    recordCreditPayment(creditId) {
        const credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');
        const credit = credits.find(c => c.id === creditId);

        if (!credit) {
            this.showNotification('Credit record not found', 'error');
            return;
        }

        const paymentAmount = prompt(`Record payment for ${credit.customerName}\n\nOutstanding: GHS ${credit.amountOutstanding.toFixed(2)}\n\nEnter payment amount:`, credit.amountOutstanding);

        if (!paymentAmount || isNaN(paymentAmount)) {
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (amount <= 0) {
            this.showNotification('Payment amount must be greater than 0', 'error');
            return;
        }

        // Update credit record
        credit.amountPaid += amount;
        credit.amountOutstanding = Math.max(0, credit.amountOutstanding - amount);

        // Update status
        if (credit.amountOutstanding === 0) {
            credit.status = 'paid';
        } else if (credit.amountPaid > 0) {
            credit.status = 'partial';
        }

        // Add payment record
        credit.payments.push({
            date: new Date().toISOString(),
            amount: amount,
            note: `Payment received on ${new Date().toLocaleDateString()}`
        });

        // Save updated credits
        localStorage.setItem('jmonic_credits', JSON.stringify(credits));

        this.showNotification(`Payment of GHS ${amount.toFixed(2)} recorded successfully!`, 'success');
        
        // Update credit sales display
        this.updateCreditSalesDisplay();
        
        this.loadCreditors();
    }

    viewCreditDetails(creditId) {
        const credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');
        const credit = credits.find(c => c.id === creditId);

        if (!credit) {
            this.showNotification('Credit record not found', 'error');
            return;
        }

        const details = `
📋 CREDIT SALE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Customer: ${credit.customerName}
📱 Phone: ${credit.customerPhone || 'N/A'}
💰 Total Amount: GHS ${credit.totalAmount.toFixed(2)}
✅ Amount Paid: GHS ${credit.amountPaid.toFixed(2)}
⏳ Outstanding: GHS ${credit.amountOutstanding.toFixed(2)}
📅 Due Date: ${credit.dueDate}
📝 Status: ${credit.status.toUpperCase()}
💬 Notes: ${credit.notes || 'No notes'}
🛍️ Products: ${credit.products ? credit.products.length : 0} item(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment History:
${credit.payments ? credit.payments.map(p => `
📅 ${new Date(p.date).toLocaleDateString()}
   Amount: GHS ${p.amount.toFixed(2)}
   ${p.note ? `Note: ${p.note}` : ''}
`).join('') : 'No payments recorded'}
        `;

        alert(details);
    }

    exportCreditors() {
        const credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');

        if (credits.length === 0) {
            this.showNotification('No creditors to export', 'warning');
            return;
        }

        // Prepare CSV data
        let csv = 'Customer Name,Phone,Total Amount,Paid,Outstanding,Due Date,Status,Notes\n';

        credits.forEach(credit => {
            csv += `"${credit.customerName}","${credit.customerPhone || '-'}",${credit.totalAmount},${credit.amountPaid},${credit.amountOutstanding},"${credit.dueDate}","${credit.status}","${(credit.notes || '-').replace(/"/g, '""')}"\n`;
        });

        // Create and download file
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', `creditors-${new Date().toISOString().split('T')[0]}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.showNotification('Creditors list exported successfully!', 'success');
    }

    // Credit Sales Analytics - Calculate metrics for revenue dashboard
    calculateCreditSalesMetrics() {
        const credits = JSON.parse(localStorage.getItem('jmonic_credits') || '[]');
        
        let totalCreditRevenue = 0;
        let totalCreditPaid = 0;
        let totalCreditOutstanding = 0;
        let creditCustomersCount = new Set();
        let overdueCount = 0;
        
        const today = new Date().toISOString().split('T')[0];

        credits.forEach(credit => {
            // Track unique customers
            creditCustomersCount.add(credit.customerName);
            
            // Sum revenues
            totalCreditRevenue += credit.totalAmount || 0;
            totalCreditPaid += credit.amountPaid || 0;
            totalCreditOutstanding += credit.amountOutstanding || 0;
            
            // Count overdue
            if (credit.dueDate < today && credit.status !== 'paid') {
                overdueCount++;
            }
        });

        const recoveryRate = totalCreditRevenue > 0 
            ? (totalCreditPaid / totalCreditRevenue) * 100 
            : 0;

        return {
            totalCreditRevenue,
            totalCreditPaid,
            totalCreditOutstanding,
            creditCustomersCount: creditCustomersCount.size,
            overdueCount,
            recoveryRate,
            creditsCount: credits.length
        };
    }

    // Update credit sales display on revenue section
    updateCreditSalesDisplay() {
        try {
            const metrics = this.calculateCreditSalesMetrics();
            
            // Update Credit Sales Revenue card
            const creditSalesRevenueEl = document.getElementById('creditSalesRevenue');
            if (creditSalesRevenueEl) {
                creditSalesRevenueEl.textContent = `GHS ${metrics.totalCreditRevenue.toFixed(2)}`;
            }
            
            const creditSalesCountEl = document.getElementById('creditSalesCount');
            if (creditSalesCountEl) {
                creditSalesCountEl.textContent = `${metrics.creditCustomersCount} customers`;
            }
            
            // Update Credit Sales Breakdown cards
            const totalCreditRevenueEl = document.getElementById('totalCreditRevenue');
            if (totalCreditRevenueEl) {
                totalCreditRevenueEl.textContent = `GHS ${metrics.totalCreditRevenue.toFixed(2)}`;
            }
            
            const totalCreditPaidEl = document.getElementById('totalCreditPaid');
            if (totalCreditPaidEl) {
                totalCreditPaidEl.textContent = `GHS ${metrics.totalCreditPaid.toFixed(2)}`;
            }
            
            const totalCreditOutstandingEl = document.getElementById('totalCreditOutstanding');
            if (totalCreditOutstandingEl) {
                totalCreditOutstandingEl.textContent = `GHS ${metrics.totalCreditOutstanding.toFixed(2)}`;
            }
            
            const debtStatusEl = document.getElementById('debtStatus');
            if (debtStatusEl) {
                debtStatusEl.textContent = `${metrics.creditCustomersCount} customer${metrics.creditCustomersCount !== 1 ? 's' : ''} owing`;
            }
            
            const debtRecoveryRateEl = document.getElementById('debtRecoveryRate');
            if (debtRecoveryRateEl) {
                debtRecoveryRateEl.textContent = `${metrics.recoveryRate.toFixed(1)}%`;
            }
            
            // Update payment methods section - Debt card
            const paymentMethodDebtEl = document.getElementById('paymentMethodDebt');
            if (paymentMethodDebtEl) {
                paymentMethodDebtEl.textContent = `GHS ${metrics.totalCreditOutstanding.toFixed(2)}`;
            }
            
            const debtCustomersCountEl = document.getElementById('debtCustomersCount');
            if (debtCustomersCountEl) {
                debtCustomersCountEl.textContent = `${metrics.creditCustomersCount} customer${metrics.creditCustomersCount !== 1 ? 's' : ''} owing`;
            }
            
            // Calculate debt percentage of total credit revenue
            const debtPercentagePaymentEl = document.getElementById('debtPercentagePayment');
            if (debtPercentagePaymentEl) {
                const debtPercentage = metrics.totalCreditRevenue > 0 
                    ? ((metrics.totalCreditOutstanding / metrics.totalCreditRevenue) * 100).toFixed(1)
                    : 0;
                debtPercentagePaymentEl.textContent = `${debtPercentage}%`;
            }
            
            // Update debt bar
            const debtBarEl = document.getElementById('debtBar');
            if (debtBarEl) {
                const debtPercentage = metrics.totalCreditRevenue > 0 
                    ? (metrics.totalCreditOutstanding / metrics.totalCreditRevenue) * 100
                    : 0;
                debtBarEl.style.width = Math.min(debtPercentage, 100) + '%';
            }
        } catch (error) {
            console.error('Error updating credit sales display:', error);
        }
    }
    

    
    // Inventory integration methods
    getProductInventoryStatus(productId) {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        const product = products.find(p => p.id == productId);
        
        if (!product) return { status: 'not-found', message: 'Product not found' };
        
        if (product.stock_quantity <= 0) {
            return { status: 'out-of-stock', message: 'Out of stock', quantity: 0 };
        } else if (product.stock_quantity <= (product.reorder_level || 10)) {
            return { status: 'low-stock', message: 'Low stock', quantity: product.stock_quantity };
        } else {
            return { status: 'in-stock', message: 'In stock', quantity: product.stock_quantity };
        }
    }
    
    getInventoryValue() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        return products.reduce((total, product) => {
            return total + (product.stock_quantity * (product.cost_price || 0));
        }, 0);
    }
    
    getInventoryRevenuePotential() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        return products.reduce((total, product) => {
            return total + (product.stock_quantity * (product.selling_price || 0));
        }, 0);
    }

    // Calculate payment method breakdown for all sales or filtered sales
    calculatePaymentMethodAmounts(filterDate = null) {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        
        const paymentBreakdown = {
            cash: { total: 0, count: 0, percentage: 0 },
            mobile_money: { total: 0, count: 0, percentage: 0 },
            transfer: { total: 0, count: 0, percentage: 0 },
            unknown: { total: 0, count: 0, percentage: 0 },
            grand_total: 0
        };
        
        // Filter sales by date if provided
        let filteredSales = sales;
        if (filterDate) {
            const dateStr = new Date(filterDate).toDateString();
            filteredSales = sales.filter(sale => {
                const saleDate = new Date(sale.date || sale.created_at).toDateString();
                return saleDate === dateStr;
            });
        }
        
        // Calculate totals by payment method
        filteredSales.forEach(sale => {
            const amount = sale.total_amount || sale.revenue || 0;
            const method = sale.payment_method || 'unknown';
            
            if (paymentBreakdown[method]) {
                paymentBreakdown[method].total += amount;
                paymentBreakdown[method].count += 1;
            } else {
                paymentBreakdown['unknown'].total += amount;
                paymentBreakdown['unknown'].count += 1;
            }
            
            paymentBreakdown.grand_total += amount;
        });
        
        // Calculate percentages
        if (paymentBreakdown.grand_total > 0) {
            Object.keys(paymentBreakdown).forEach(method => {
                if (method !== 'grand_total') {
                    paymentBreakdown[method].percentage = 
                        (paymentBreakdown[method].total / paymentBreakdown.grand_total) * 100;
                }
            });
        }
        
        console.log('Payment method breakdown:', paymentBreakdown);
        return paymentBreakdown;
    }

    // Get payment method amounts for today
    getTodayPaymentMethods() {
        return this.calculatePaymentMethodAmounts(new Date());
    }

    // Get payment method amounts for a specific date
    getPaymentMethodsByDate(date) {
        return this.calculatePaymentMethodAmounts(date);
    }

    // Get payment method amounts for a date range
    getPaymentMethodsByDateRange(startDate, endDate) {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const start = new Date(startDate).toDateString();
        const end = new Date(endDate).toDateString();
        
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at).toDateString();
            const saleDateObj = new Date(sale.date || sale.created_at);
            return saleDateObj >= new Date(startDate) && saleDateObj <= new Date(endDate);
        });
        
        const paymentBreakdown = {
            cash: { total: 0, count: 0, percentage: 0 },
            mobile_money: { total: 0, count: 0, percentage: 0 },
            transfer: { total: 0, count: 0, percentage: 0 },
            unknown: { total: 0, count: 0, percentage: 0 },
            grand_total: 0
        };
        
        filteredSales.forEach(sale => {
            const amount = sale.total_amount || sale.revenue || 0;
            const method = sale.payment_method || 'unknown';
            
            if (paymentBreakdown[method]) {
                paymentBreakdown[method].total += amount;
                paymentBreakdown[method].count += 1;
            } else {
                paymentBreakdown['unknown'].total += amount;
                paymentBreakdown['unknown'].count += 1;
            }
            
            paymentBreakdown.grand_total += amount;
        });
        
        if (paymentBreakdown.grand_total > 0) {
            Object.keys(paymentBreakdown).forEach(method => {
                if (method !== 'grand_total') {
                    paymentBreakdown[method].percentage = 
                        (paymentBreakdown[method].total / paymentBreakdown.grand_total) * 100;
                }
            });
        }
        
        console.log('Payment method breakdown (date range):', paymentBreakdown);
        return paymentBreakdown;
    }

    // Display Update Methods
    updateKPICards(stats) {
        if (!stats) {
            console.error('Stats object is undefined');
            return;
        }
        
        // Enhanced KPI cards update
        const todayRevenueEl = document.getElementById('todayRevenue');
        const todayProfitEl = document.getElementById('todayProfit');
        const todayOrdersEl = document.getElementById('todayOrders');
        const avgOrderValueEl = document.getElementById('avgOrderValue');
        const totalStockOutEl = document.getElementById('totalStockOut');
        
        if (todayRevenueEl) todayRevenueEl.textContent = `GHS ${(stats.today_sales || 0).toFixed(2)}`;
        // Stock cards now on dashboard - will be calculated below
        
        // Calculate additional metrics
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        
        const today = new Date().toDateString();
        const todaySales = sales.filter(sale => 
            new Date(sale.date || sale.created_at).toDateString() === today
        );
        
        const todayOrders = todaySales.length;
        const todayRevenue = stats.today_sales || 0;
        const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
        
        // Calculate today's profit
        let todayProfit = 0;
        todaySales.forEach(sale => {
            if (sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(product => {
                    const productData = products.find(p => p.id == product.id);
                    if (productData && productData.cost_price) {
                        const cost = (productData.cost_price * (product.quantity || 1));
                        todayProfit += (product.subtotal || 0) - cost;
                    } else {
                        todayProfit += (product.subtotal || 0); // Assume 100% profit if no cost data
                    }
                });
            }
        });
        
        const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
        
        if (todayProfitEl) todayProfitEl.textContent = `GHS ${todayProfit.toFixed(2)}`;
        if (todayOrdersEl) todayOrdersEl.textContent = todayOrders.toString();
        if (avgOrderValueEl) avgOrderValueEl.textContent = `GHS ${avgOrderValue.toFixed(2)}`;
        
        // Update profit margin display
        const profitMarginEl = document.getElementById('profitMargin');
        if (profitMarginEl) {
            profitMarginEl.textContent = `${profitMargin.toFixed(1)}% margin`;
            profitMarginEl.className = `kpi-change ${profitMargin >= 20 ? 'positive' : profitMargin >= 10 ? 'neutral' : 'negative'}`;
        }
        
        // Calculate and display revenue change
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdaySales = sales.filter(sale => 
            new Date(sale.date || sale.created_at).toDateString() === yesterday.toDateString()
        );
        const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
        const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;
        
        const revenueChangeEl = document.getElementById('revenueChange');
        if (revenueChangeEl) {
            const changeText = revenueChange >= 0 ? '+' : '';
            revenueChangeEl.textContent = `${changeText}${revenueChange.toFixed(1)}% vs yesterday`;
            revenueChangeEl.className = `kpi-change ${revenueChange >= 0 ? 'positive' : 'negative'}`;
        }

        // Calculate today's stock movements (stock out for today only)
        let todayStockOut = 0;
        
        // Count today's sales quantities (stock out)
        todaySales.forEach(sale => {
            if (sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(product => {
                    todayStockOut += parseFloat(product.quantity) || 0;
                });
            }
        });
        
        // Update stock display elements with today's data
        if (totalStockOutEl) totalStockOutEl.textContent = todayStockOut.toLocaleString();
        
        console.log('Today\'s stock calculations:', { todayStockOut, todaySalesCount: todaySales.length });
    }
    
    // Sales Dashboard Methods
    async loadSalesDashboard() {
        try {
            const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            // Calculate today's metrics
            const today = new Date().toDateString();
            const todaySales = sales.filter(sale => 
                new Date(sale.date || sale.created_at).toDateString() === today
            );
            
            // Calculate sales metrics
            const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
            const todayOrders = todaySales.length;
            const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
            
            // Calculate costs and profit
            let todayCost = 0;
            todaySales.forEach(sale => {
                if (sale.products && Array.isArray(sale.products)) {
                    sale.products.forEach(product => {
                        const productData = products.find(p => p.id == product.id);
                        if (productData) {
                            todayCost += (productData.cost_price || 0) * (product.quantity || 1);
                        }
                    });
                }
            });
            
            const grossProfit = todayRevenue - todayCost;
            const profitMargin = todayRevenue > 0 ? (grossProfit / todayRevenue) * 100 : 0;
            
            // Update sales KPI cards
            this.updateSalesKPICards({
                todayRevenue,
                todayOrders,
                avgOrderValue,
                grossProfit,
                profitMargin
            });
            
            // Update sales analytics
            this.updateSalesAnalytics(sales, products);
            
            // Initialize/update charts only if needed
            if (!this.salesChartsInitialized || this.shouldUpdateCharts) {
                this.initializeSalesCharts();
                this.salesChartsInitialized = true;
                this.shouldUpdateCharts = false;
            }
            
            // Load sales table data
            await this.loadSalesData();
            
        } catch (error) {
            console.error('Error loading sales dashboard:', error);
        }
    }
    
    updateSalesKPICards(metrics) {
        // Update Today's Sales
        const todaySalesCard = document.querySelector('.sales-kpi-grid .stat-card:nth-child(1) .stat-value');
        if (todaySalesCard) {
            todaySalesCard.textContent = `GHS ${metrics.todayRevenue.toFixed(2)}`;
        }
        
        // Update Orders Today
        const ordersCard = document.querySelector('.sales-kpi-grid .stat-card:nth-child(2) .stat-value');
        if (ordersCard) {
            ordersCard.textContent = metrics.todayOrders.toString();
        }
        
        // Update Average Order Value
        const avgOrderCard = document.querySelector('.sales-kpi-grid .stat-card:nth-child(3) .stat-value');
        if (avgOrderCard) {
            avgOrderCard.textContent = `GHS ${metrics.avgOrderValue.toFixed(2)}`;
        }
        
        // Update Gross Profit
        const profitCard = document.querySelector('.sales-kpi-grid .stat-card:nth-child(4) .stat-value');
        const profitMarginSpan = document.querySelector('.sales-kpi-grid .stat-card:nth-child(4) .stat-change');
        if (profitCard) {
            profitCard.textContent = `GHS ${metrics.grossProfit.toFixed(2)}`;
        }
        if (profitMarginSpan) {
            profitMarginSpan.textContent = `${metrics.profitMargin.toFixed(1)}% margin`;
        }
    }
    
    updateSalesAnalytics(sales, products) {
        // Calculate top-selling products
        const productSales = {};
        
        sales.forEach(sale => {
            if (sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(product => {
                    const key = product.id || product.name;
                    if (!productSales[key]) {
                        productSales[key] = {
                            name: product.name || 'Unknown Product',
                            units: 0,
                            revenue: 0
                        };
                    }
                    productSales[key].units += product.quantity || 1;
                    productSales[key].revenue += product.subtotal || (product.price * product.quantity) || 0;
                });
            }
        });
        
        // Sort by revenue and get top 3
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3);
        
        // Update top products display
        this.updateTopProductsDisplay(topProducts);
        
        // Update sales targets based on current performance
        this.updateSalesTargets(sales);
    }
    
    updateTopProductsDisplay(topProducts) {
        const productsList = document.querySelector('.product-performance-list');
        if (!productsList) return;
        
        if (topProducts.length === 0) {
            productsList.innerHTML = `
                <div class="product-performance-item">
                    <div class="product-rank">-</div>
                    <div class="product-details">
                        <span class="product-name">No sales data available</span>
                        <span class="product-metrics">Start recording sales to see top products</span>
                    </div>
                    <div class="product-trend neutral">
                        <i class="fas fa-minus"></i> 0%
                    </div>
                </div>
            `;
            return;
        }
        
        productsList.innerHTML = topProducts.map((product, index) => `
            <div class="product-performance-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-details">
                    <span class="product-name">${product.name}</span>
                    <span class="product-metrics">${product.units} units • GHS ${product.revenue.toFixed(2)} revenue</span>
                </div>
                <div class="product-trend positive">
                    <i class="fas fa-arrow-up"></i> ${((product.revenue / (topProducts[0]?.revenue || 1)) * 100).toFixed(0)}%
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Filter top products by a specific date
     * @param {string} dateString - Date in YYYY-MM-DD format
     */
    filterTopProductsByDate(dateString) {
        let sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        
        // Filter sales by date if a date is provided
        if (dateString) {
            const filterDate = new Date(dateString).toDateString();
            sales = sales.filter(sale => {
                const saleDate = new Date(sale.date).toDateString();
                return saleDate === filterDate;
            });
        }
        
        // Calculate top products for the filtered date
        const productSales = {};
        
        sales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(product => {
                    const key = product.name || product.productName || 'Unknown';
                    if (!productSales[key]) {
                        productSales[key] = { name: key, units: 0, revenue: 0 };
                    }
                    productSales[key].units += product.quantity || 1;
                    productSales[key].revenue += product.subtotal || (product.price * product.quantity) || 0;
                });
            }
        });
        
        // Sort by revenue and get top 3
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3);
        
        // Update display
        this.updateTopProductsDisplay(topProducts);
        
        // Show notification
        if (dateString) {
            const date = new Date(dateString).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            this.showLiveNotification(
                'Top Products Filtered',
                `Showing top products for ${date}`,
                'info',
                'fa-filter'
            );
        }
    }
    
    getSalesTargets() {
        const defaultTargets = {
            daily: 16667,
            monthly: 500000,
            quarterly: 1500000,
            annual: 6000000
        };
        const saved = localStorage.getItem('jmonic_sales_targets');
        return saved ? JSON.parse(saved) : defaultTargets;
    }

    setSalesTargets(targets) {
        localStorage.setItem('jmonic_sales_targets', JSON.stringify(targets));
    }

    updateSalesTargets(sales) {
        // Get user-defined targets
        const targets = this.getSalesTargets();
        
        // Calculate daily, monthly, quarterly, and annual progress
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentDate = now.getDate();
        
        // Daily sales (today only)
        const dailySales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            return saleDate.getDate() === currentDate && 
                   saleDate.getMonth() === currentMonth && 
                   saleDate.getFullYear() === currentYear;
        });
        const dailyRevenue = dailySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.revenue || 0), 0);
        const dailyProgress = (dailyRevenue / targets.daily) * 100;
        
        // Monthly sales
        const monthlySales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.revenue || 0), 0);
        const monthlyProgress = (monthlyRevenue / targets.monthly) * 100;
        
        // Quarterly sales
        const currentQuarter = Math.floor(currentMonth / 3);
        const quarterlySales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            return Math.floor(saleDate.getMonth() / 3) === currentQuarter && saleDate.getFullYear() === currentYear;
        });
        const quarterlyRevenue = quarterlySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.revenue || 0), 0);
        const quarterlyProgress = (quarterlyRevenue / targets.quarterly) * 100;
        
        // Annual sales
        const annualSales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            return saleDate.getFullYear() === currentYear;
        });
        const annualRevenue = annualSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.revenue || 0), 0);
        const annualProgress = (annualRevenue / targets.annual) * 100;
        
        // Update monthly target
        const monthlyProgressBar = document.getElementById('monthlyProgressBar');
        const monthlyPercentage = document.getElementById('monthlyPercentage');
        const monthlyProgressText = document.getElementById('monthlyProgress');
        
        if (monthlyProgressBar) monthlyProgressBar.style.width = `${Math.min(monthlyProgress, 100)}%`;
        if (monthlyPercentage) monthlyPercentage.textContent = `${monthlyProgress.toFixed(0)}%`;
        if (monthlyProgressText) monthlyProgressText.textContent = `GHS ${monthlyRevenue.toFixed(0)} / GHS ${targets.monthly.toLocaleString()}`;
        
        // Update quarterly target
        const quarterlyProgressBar = document.getElementById('quarterlyProgressBar');
        const quarterlyPercentage = document.getElementById('quarterlyPercentage');
        const quarterlyProgressText = document.getElementById('quarterlyProgress');
        
        if (quarterlyProgressBar) quarterlyProgressBar.style.width = `${Math.min(quarterlyProgress, 100)}%`;
        if (quarterlyPercentage) quarterlyPercentage.textContent = `${quarterlyProgress.toFixed(0)}%`;
        if (quarterlyProgressText) quarterlyProgressText.textContent = `GHS ${quarterlyRevenue.toFixed(0)} / GHS ${targets.quarterly.toLocaleString()}`;
        
        // Update annual target
        const annualProgressBar = document.getElementById('annualProgressBar');
        const annualPercentageSpan = document.getElementById('annualPercentage');
        const annualProgressText = document.getElementById('annualProgress');
        
        if (annualProgressBar) annualProgressBar.style.width = `${Math.min(annualProgress, 100)}%`;
        if (annualPercentageSpan) annualPercentageSpan.textContent = `${annualProgress.toFixed(0)}%`;
        if (annualProgressText) annualProgressText.textContent = `GHS ${annualRevenue.toFixed(0)} / GHS ${targets.annual.toLocaleString()}`;
        
        // Update daily target
        const dailyProgressBar = document.getElementById('dailyProgressBar');
        const dailyPercentage = document.getElementById('dailyPercentage');
        const dailyProgressText = document.getElementById('dailyProgress');
        
        if (dailyProgressBar) dailyProgressBar.style.width = `${Math.min(dailyProgress, 100)}%`;
        if (dailyPercentage) dailyPercentage.textContent = `${dailyProgress.toFixed(0)}%`;
        if (dailyProgressText) dailyProgressText.textContent = `GHS ${dailyRevenue.toFixed(0)} / GHS ${targets.daily.toLocaleString()}`;
    }

    initTargetsEditing() {
        const editBtn = document.getElementById('editTargetsBtn');
        const saveBtn = document.getElementById('saveTargetsBtn');
        const cancelBtn = document.getElementById('cancelTargetsBtn');
        const actionsDiv = document.getElementById('targetsActions');
        
        const dailyInput = document.getElementById('dailyTargetInput');
        const monthlyInput = document.getElementById('monthlyTargetInput');
        const quarterlyInput = document.getElementById('quarterlyTargetInput');
        const annualInput = document.getElementById('annualTargetInput');
        
        const dailyProgress = document.getElementById('dailyProgress');
        const monthlyProgress = document.getElementById('monthlyProgress');
        const quarterlyProgress = document.getElementById('quarterlyProgress');
        const annualProgress = document.getElementById('annualProgress');
        
        if (!editBtn || !saveBtn || !cancelBtn) return;
        
        editBtn.addEventListener('click', () => {
            const targets = this.getSalesTargets();
            
            // Show inputs and hide progress text
            dailyInput.value = targets.daily;
            monthlyInput.value = targets.monthly;
            quarterlyInput.value = targets.quarterly;
            annualInput.value = targets.annual;
            
            dailyInput.style.display = 'block';
            monthlyInput.style.display = 'block';
            quarterlyInput.style.display = 'block';
            annualInput.style.display = 'block';
            
            dailyProgress.style.display = 'none';
            monthlyProgress.style.display = 'none';
            quarterlyProgress.style.display = 'none';
            annualProgress.style.display = 'none';
            
            editBtn.style.display = 'none';
            actionsDiv.style.display = 'flex';
        });
        
        saveBtn.addEventListener('click', () => {
            const newTargets = {
                daily: parseFloat(dailyInput.value) || 16667,
                monthly: parseFloat(monthlyInput.value) || 500000,
                quarterly: parseFloat(quarterlyInput.value) || 1500000,
                annual: parseFloat(annualInput.value) || 6000000
            };
            
            this.setSalesTargets(newTargets);
            
            // Hide inputs and show progress text
            dailyInput.style.display = 'none';
            monthlyInput.style.display = 'none';
            quarterlyInput.style.display = 'none';
            annualInput.style.display = 'none';
            
            dailyProgress.style.display = 'block';
            monthlyProgress.style.display = 'block';
            quarterlyProgress.style.display = 'block';
            annualProgress.style.display = 'block';
            
            editBtn.style.display = 'block';
            actionsDiv.style.display = 'none';
            
            // Update targets display
            const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
            this.updateSalesTargets(sales);
            
            // Show success message
            this.showNotification('Sales targets updated successfully!', 'success');
        });
        
        cancelBtn.addEventListener('click', () => {
            // Hide inputs and show progress text
            dailyInput.style.display = 'none';
            monthlyInput.style.display = 'none';
            quarterlyInput.style.display = 'none';
            annualInput.style.display = 'none';
            
            dailyProgress.style.display = 'block';
            monthlyProgress.style.display = 'block';
            quarterlyProgress.style.display = 'block';
            annualProgress.style.display = 'block';
            
            editBtn.style.display = 'block';
            actionsDiv.style.display = 'none';
        });
    }

    populateWeeklySalesTable() {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const tbody = document.querySelector('#weeklySalesTable tbody');
        
        if (!tbody) return;
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Get last 7 days of sales data
        const today = new Date();
        const weekData = {};
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            weekData[dayKey] = {
                dayName,
                dayKey,
                salesCount: 0,
                totalRevenue: 0,
                avgSale: 0
            };
        }
        
        // Populate with sales data
        sales.forEach(sale => {
            const saleDate = sale.timestamp ? sale.timestamp.split(' ')[0] : '';
            if (weekData[saleDate]) {
                weekData[saleDate].salesCount++;
                weekData[saleDate].totalRevenue += parseFloat(sale.totalAmount) || 0;
            }
        });
        
        // Calculate averages and populate table
        Object.values(weekData).forEach(dayData => {
            if (dayData.salesCount > 0) {
                dayData.avgSale = (dayData.totalRevenue / dayData.salesCount).toFixed(2);
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dayData.dayName}</td>
                <td>${dayData.salesCount}</td>
                <td>GHS ${dayData.totalRevenue.toFixed(2)}</td>
                <td>GHS ${dayData.avgSale.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    populateRevenueTargetTable() {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const settings = JSON.parse(localStorage.getItem('jmonic_business_settings') || '{}');
        
        // Calculate this week's revenue
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        let weekRevenue = 0;
        sales.forEach(sale => {
            const saleDate = sale.timestamp ? new Date(sale.timestamp) : new Date();
            if (saleDate >= weekStart) {
                weekRevenue += parseFloat(sale.totalAmount) || 0;
            }
        });
        
        // Get monthly target from settings, default to 5000 if not set
        const monthlyTarget = parseFloat(settings.monthlySalesTarget) || 5000;
        const weekTarget = monthlyTarget / 4; // Rough weekly target (assuming 4 weeks in month)
        
        // Calculate progress percentage
        const progressPercent = Math.min((weekRevenue / weekTarget) * 100, 100);
        
        // Update table
        const tbody = document.querySelector('#revenueTargetTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td>This Week Sales</td>
                    <td><strong>GHS ${weekRevenue.toFixed(2)}</strong></td>
                    <td><span class="badge ${weekRevenue >= weekTarget ? 'badge-success' : 'badge-warning'}">
                        ${weekRevenue >= weekTarget ? 'On Track' : 'Below Target'}
                    </span></td>
                </tr>
                <tr>
                    <td>Weekly Target</td>
                    <td><strong>GHS ${weekTarget.toFixed(2)}</strong></td>
                    <td><span class="badge badge-info">Goal</span></td>
                </tr>
                <tr>
                    <td>Monthly Target</td>
                    <td><strong>GHS ${monthlyTarget.toFixed(2)}</strong></td>
                    <td><span class="badge badge-info">Overall</span></td>
                </tr>
                <tr>
                    <td colspan="3" style="padding: 8px 0;">
                        <div style="background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); 
                                        width: ${progressPercent}%; 
                                        height: 20px; 
                                        transition: width 0.3s ease;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 12px;
                                        color: white;
                                        font-weight: bold;">
                                ${progressPercent.toFixed(1)}%
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    // Charts initialization and updates
    initializeSalesCharts() {
        // Debounce chart updates to prevent performance issues
        if (this.chartUpdateTimeout) {
            clearTimeout(this.chartUpdateTimeout);
        }
        
        this.chartUpdateTimeout = setTimeout(() => {
            this.initSalesTrendChart();
            this.initRevenueBreakdownChart();
        }, 300);
    }
    
    initSalesTrendChart() {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.salesTrendChart) {
            this.salesTrendChart.destroy();
        }
        
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const last7Days = this.getLast7DaysData(sales);
        
        // Simple overview - just show total sales for the week
        const totalWeekSales = last7Days.reduce((sum, day) => sum + day.revenue, 0);
        const hasData = totalWeekSales > 0;
        
        this.salesTrendChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: hasData ? ['This Week', 'Target Remaining'] : ['No Sales Yet'],
                datasets: [{
                    data: hasData ? [totalWeekSales, Math.max(0, 1000 - totalWeekSales)] : [1],
                    backgroundColor: hasData ? ['#10b981', '#e5e7eb'] : ['#f3f4f6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: hasData,
                        callbacks: {
                            label: function(context) {
                                if (context.dataIndex === 0 && hasData) {
                                    return `Weekly Sales: GHS ${totalWeekSales.toFixed(2)}`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
        
        // Add text in center of doughnut
        const centerText = hasData ? 
            `GHS ${totalWeekSales.toFixed(0)}\nThis Week` : 
            'No Sales\nAdd Products';
            
        // Store center text for potential display
        if (ctx.parentElement) {
            const existingLabel = ctx.parentElement.querySelector('.chart-center-text');
            if (existingLabel) existingLabel.remove();
            
            const centerLabel = document.createElement('div');
            centerLabel.className = 'chart-center-text';
            centerLabel.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                font-weight: 600;
                color: ${hasData ? '#10b981' : '#6b7280'};
                pointer-events: none;
                line-height: 1.2;
                font-size: ${hasData ? '1.2rem' : '0.9rem'};
            `;
            centerLabel.innerHTML = centerText.replace('\n', '<br>');
            ctx.parentElement.style.position = 'relative';
            ctx.parentElement.appendChild(centerLabel);
        }
    }
    
    initRevenueBreakdownChart() {
        const ctx = document.getElementById('revenueBreakdownChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (this.revenueBreakdownChart) {
            this.revenueBreakdownChart.destroy();
        }
        
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        
        // Simple revenue calculation - just show total vs target
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
        const targets = this.getSalesTargets();
        const targetRevenue = targets.monthly; // Use user's monthly target
        
        // Update center text
        const centerText = document.getElementById('revenueBreakdownCenterText');
        if (centerText) {
            const centerValue = centerText.querySelector('.center-value');
            const centerLabel = centerText.querySelector('.center-label');
            if (centerValue) centerValue.textContent = `GHS ${totalRevenue.toFixed(0)}`;
            if (centerLabel) centerLabel.textContent = 'Achieved';
        }
        
        this.revenueBreakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Achieved', 'Remaining'],
                datasets: [{
                    data: totalRevenue > 0 ? [totalRevenue, Math.max(0, targetRevenue - totalRevenue)] : [0, targetRevenue],
                    backgroundColor: ['#10b981', '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    getLast7DaysData(sales) {
        const days = [];
        const now = new Date();
        
        // Create array of last 7 days only
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Simple revenue calculation
            const dayRevenue = sales
                .filter(sale => {
                    const saleDate = sale.date || sale.created_at;
                    return saleDate && saleDate.startsWith(dateStr);
                })
                .reduce((sum, sale) => sum + parseFloat(sale.total_amount || sale.revenue || 0), 0);
                
            days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayRevenue
            });
        }
        
        return days;
    }
    
    // Sale action methods
    viewSaleDetails(saleId) {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const sale = sales.find(s => s.id == saleId || `S-${Date.now().toString().slice(-5)}-${sales.indexOf(s)}` === saleId);
        
        if (!sale) {
            this.showNotification('Sale not found', 'error');
            return;
        }
        
        // Create a modal or popup to show sale details
        let saleDetails = `
            <div style="max-width: 500px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3>Sale Details - ${saleId}</h3>
                <p><strong>Date:</strong> ${this.formatDate(sale.date || sale.created_at)}</p>
                <p><strong>Payment Method:</strong> ${sale.paymentMethod || 'Not specified'}</p>
                <p><strong>Total Amount:</strong> GHS ${parseFloat(sale.revenue || sale.totalAmount || 0).toFixed(2)}</p>
                <h4>Products:</h4>
                <ul>
        `;
        
        if (sale.products && Array.isArray(sale.products)) {
            sale.products.forEach(product => {
                saleDetails += `<li>${product.name || 'Unknown Product'} - Qty: ${product.quantity || 1} - GHS ${(product.subtotal || 0).toFixed(2)}</li>`;
            });
        } else {
            saleDetails += '<li>Product details not available</li>';
        }
        
        saleDetails += '</ul></div>';
        
        // Show in a simple alert for now (you can enhance this with a proper modal)
        const detailsWindow = window.open('', '_blank', 'width=600,height=400');
        detailsWindow.document.write(`
            <html>
                <head><title>Sale Details - ${saleId}</title></head>
                <body style="font-family: Arial, sans-serif;">${saleDetails}</body>
            </html>
        `);
    }
    
    printReceipt(saleId) {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const sale = sales.find(s => s.id == saleId || `S-${Date.now().toString().slice(-5)}-${sales.indexOf(s)}` === saleId);
        
        if (!sale) {
            this.showNotification('Sale not found', 'error');
            return;
        }
        
        // Create receipt content
        let receipt = `
            <div style="max-width: 300px; margin: 20px auto; font-family: monospace; font-size: 12px;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                    <h2>J'MONIC ENTERPRISE</h2>
                    <p>Products</p>
                    <p>Receipt #${saleId}</p>
                </div>
                
                <p><strong>Date:</strong> ${this.formatDate(sale.date || sale.created_at)}</p>
                <p><strong>Payment:</strong> ${sale.paymentMethod || 'Cash'}</p>
                
                <div style="border-top: 1px solid #000; margin: 10px 0; padding-top: 10px;">
                    <table style="width: 100%; font-size: 12px;">
                        <tr style="border-bottom: 1px solid #000;">
                            <th style="text-align: left;">Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
        `;
        
        let grandTotal = 0;
        if (sale.products && Array.isArray(sale.products)) {
            sale.products.forEach(product => {
                const subtotal = product.subtotal || (product.price * product.quantity) || 0;
                grandTotal += subtotal;
                receipt += `
                    <tr>
                        <td>${(product.name || 'Product').substring(0, 15)}</td>
                        <td style="text-align: center;">${product.quantity || 1}</td>
                        <td style="text-align: right;">GHS ${(product.price || 0).toFixed(2)}</td>
                        <td style="text-align: right;">GHS ${subtotal.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        
        receipt += `
                    </table>
                </div>
                
                <div style="border-top: 2px solid #000; margin-top: 10px; padding-top: 10px;">
                    <p style="text-align: right; font-weight: bold; font-size: 14px;">
                        TOTAL: GHS ${grandTotal.toFixed(2)}
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 10px;">
                    <p>Thank you for your business!</p>
                    <p>Visit us again soon</p>
                </div>
            </div>
        `;
        
        // Open receipt in new window for printing
        const receiptWindow = window.open('', '_blank', 'width=400,height=600');
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Receipt - ${saleId}</title>
                    <style>@media print { body { margin: 0; } }</style>
                </head>
                <body onload="window.print(); window.close();">
                    ${receipt}
                </body>
            </html>
        `);
    }
    
    updateRecentSales(sales) {
        const tbody = document.querySelector('.activity-card tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!sales || sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No sales recorded yet</td></tr>';
            return;
        }
        
        sales.forEach(sale => {
            const row = document.createElement('tr');
            
            // Format products list
            let productsText = 'Unknown Product';
            if (sale.products && Array.isArray(sale.products)) {
                const productNames = sale.products.map(p => p.name || 'Product').join(', ');
                productsText = productNames;
            } else if (typeof sale.products === 'string') {
                productsText = sale.products;
            }
            
            // Ensure we have a sale ID
            const saleId = sale.sale_id || sale.id || `#S-${Date.now().toString().slice(-5)}`;
            
            row.innerHTML = `
                <td>${saleId}</td>
                <td>${productsText}</td>
                <td>GHS ${parseFloat(sale.revenue || sale.total_amount || 0).toFixed(2)}</td>
                <td>${this.formatDate(sale.date || sale.created_at)}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    loadRecentSalesTable() {
        const tbody = document.getElementById('salesTableBody');
        if (!tbody) return;
        
        // Get sales from localStorage
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        
        if (sales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No recent sales</td></tr>';
            return;
        }
        
        // Sort by date (most recent first) and take the last 10
        const recentSales = sales
            .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
            .slice(0, 10);
        
        tbody.innerHTML = recentSales.map(sale => {
            // Calculate totals
            const revenue = parseFloat(sale.total_amount || 0);
            let totalCost = 0;
            let totalQuantity = 0;
            let productsDisplay = '';
            
            if (sale.products && Array.isArray(sale.products)) {
                totalQuantity = sale.products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
                totalCost = sale.products.reduce((sum, p) => sum + ((parseFloat(p.cost_price) || 0) * (parseFloat(p.quantity) || 0)), 0);
                
                const mainProduct = sale.products[0].name || 'Product';
                const additionalCount = sale.products.length - 1;
                
                productsDisplay = `
                    <div class="products-sold">
                        <span>${mainProduct}</span>
                        ${additionalCount > 0 ? `<small>+${additionalCount} more item${additionalCount > 1 ? 's' : ''}</small>` : ''}
                    </div>
                `;
            } else {
                productsDisplay = '<div class="products-sold"><span>Unknown Product</span></div>';
                totalQuantity = 1;
            }
            
            const profit = revenue - totalCost;
            const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
            
            // Generate sale ID
            const saleId = sale.sale_id || sale.id || `#S-${Date.now().toString().slice(-5)}`;
            
            // Format date
            const saleDate = new Date(sale.date || sale.created_at);
            const formattedDate = saleDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            // Determine status
            const status = sale.status || 'completed';
            const statusClass = status.toLowerCase();
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            
            return `
                <tr>
                    <td>${saleId}</td>
                    <td>${productsDisplay}</td>
                    <td>${totalQuantity}</td>
                    <td>GHS ${revenue.toFixed(2)}</td>
                    <td>GHS ${totalCost.toFixed(2)}</td>
                    <td class="${profitClass}">GHS ${profit.toFixed(2)}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn-icon" onclick="businessManager.viewSaleDetails('${saleId}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="businessManager.printSaleReceipt('${saleId}')" title="Print Receipt">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    viewSaleDetails(saleId) {
        // Find the sale by ID
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const sale = sales.find(s => (s.sale_id || s.id || `#S-${Date.now().toString().slice(-5)}`) === saleId);
        
        if (sale) {
            // Show sale details in a modal or alert for now
            let details = `Sale Details for ${saleId}\n\n`;
            details += `Date: ${new Date(sale.date || sale.created_at).toLocaleDateString()}\n`;
            details += `Total Amount: GHS ${parseFloat(sale.total_amount || 0).toFixed(2)}\n\n`;
            
            if (sale.products && Array.isArray(sale.products)) {
                details += 'Products:\n';
                sale.products.forEach(product => {
                    details += `- ${product.name}: ${product.quantity} x GHS ${product.price} = GHS ${product.subtotal}\n`;
                });
            }
            
            alert(details);
        } else {
            this.showNotification('Sale not found', 'error');
        }
    }
    
    printSaleReceipt(saleId) {
        this.showNotification('Print receipt feature coming soon!', 'info');
    }
    
    exportRecentSales() {
        try {
            const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
            console.log('Export: Found', sales.length, 'sales records');
            
            if (sales.length === 0) {
                this.showNotification('No sales data to export', 'warning');
                return;
            }
            
            // Log first sale to understand structure
            if (sales.length > 0) {
                console.log('Export: Sample sale structure:', sales[0]);
            }
            
            // Prepare CSV data with proper headers
            const headers = ['Sale ID', 'Date', 'Products', 'Quantity', 'Revenue (GHS)', 'Cost (GHS)', 'Profit (GHS)', 'Status'];
            const csvData = [headers];
            
            // Sort by date (most recent first)
            const sortedSales = [...sales].sort((a, b) => {
                const dateA = new Date(a.date || a.created_at || 0);
                const dateB = new Date(b.date || b.created_at || 0);
                return dateB - dateA;
            });
            
            sortedSales.forEach(sale => {
                // Handle different sale ID formats
                const saleId = sale.sale_id || sale.id || `#S-${Date.now().toString().slice(-5)}`;
                
                // Handle date formatting
                const saleDate = sale.date || sale.created_at;
                const date = saleDate ? new Date(saleDate).toLocaleDateString() : 'N/A';
                
                // Handle revenue with multiple possible field names
                const revenue = parseFloat(sale.revenue || sale.total_amount || sale.total || 0);
                
                // Handle cost calculation
                let cost = 0;
                if (sale.cost) {
                    cost = parseFloat(sale.cost);
                } else if (sale.items && Array.isArray(sale.items)) {
                    // Calculate cost from items if available
                    cost = sale.items.reduce((sum, item) => {
                        const itemCost = (item.cost_price || item.cost || 0) * (item.quantity || 1);
                        return sum + parseFloat(itemCost);
                    }, 0);
                }
                
                const profit = revenue - cost;
                const status = sale.status || 'COMPLETED';
                
                // Handle products and quantities
                let products = 'Unknown Product';
                let totalQuantity = 1;
                
                if (sale.items && Array.isArray(sale.items)) {
                    // Handle items array structure
                    products = sale.items.map(item => {
                        const name = item.product_name || item.name || 'Unknown';
                        const qty = item.quantity || 1;
                        return qty > 1 ? `${name} (x${qty})` : name;
                    }).join('; ');
                    totalQuantity = sale.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 1), 0);
                } else if (sale.products && Array.isArray(sale.products)) {
                    // Handle products array structure
                    products = sale.products.map(p => {
                        const name = p.name || p.product_name || 'Unknown';
                        const qty = p.quantity || 1;
                        return qty > 1 ? `${name} (x${qty})` : name;
                    }).join('; ');
                    totalQuantity = sale.products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 1), 0);
                } else if (sale.product_name) {
                    // Handle single product structure
                    products = sale.product_name;
                    totalQuantity = sale.quantity || 1;
                }
                
                csvData.push([
                    saleId,
                    date,
                    products,
                    totalQuantity,
                    revenue.toFixed(2),
                    cost.toFixed(2),
                    profit.toFixed(2),
                    status.toUpperCase()
                ]);
            });
            
            console.log('Export: Prepared', csvData.length - 1, 'sales records for export');
            
            // Convert to CSV string with proper escaping
            const csvString = csvData.map(row => 
                row.map(field => {
                    // Escape quotes and wrap in quotes
                    const escaped = String(field).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            ).join('\n');
            
            // Create and download CSV file
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jmonic-recent-sales-${new Date().toISOString().split('T')[0]}.csv`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification(`Successfully exported ${sortedSales.length} sales records!`, 'success');
            console.log('Export completed successfully');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Failed to export sales data: ' + error.message, 'error');
        }
    }
    
    // Header dropdown functionality
    initializeHeaderDropdowns() {
        const notificationBtn = document.getElementById('notificationBtn');
        
        // Sidebar dropdown buttons
        const sidebarNotificationBtn = document.getElementById('sidebarNotificationBtn');
        
        const notificationDropdown = document.getElementById('notificationDropdown');
        
        // Close dropdowns when clicking outside (but EXCLUDE KPI cards and modals)
        document.addEventListener('click', (e) => {
            // Don't close if clicking on KPI cards, modal elements, or important UI components
            if (e.target.closest('.kpi-card') || 
                e.target.closest('.kpi') || 
                e.target.closest('.modal') ||
                e.target.closest('[class*="kpi"]') ||
                e.target.closest('.modal-overlay')) {
                return;
            }
            
            // Close dropdowns if clicking outside header actions and sidebar
            if (!e.target.closest('.header-actions') && !e.target.closest('.sidebar')) {
                this.closeAllDropdowns();
            }
        }, true); // Use capture phase to catch clicks early
        
        // Notification button (header)
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('notification');
                this.loadNotifications();
            });
        }
        
        // Sidebar notification button
        if (sidebarNotificationBtn) {
            sidebarNotificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('notification');
                this.loadNotifications();
            });
        }
        
        // Delete button in settings dropdown (both variants)
        const deleteDataBtn = document.getElementById('deleteDataBtn');
        const deleteDataBtnDash = document.getElementById('deleteDataBtn-dash');
        
        if (deleteDataBtn) {
            // Clone to remove old listeners and prevent duplication
            const newDeleteBtn = deleteDataBtn.cloneNode(true);
            deleteDataBtn.parentNode.replaceChild(newDeleteBtn, deleteDataBtn);
            
            newDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearAllData();
                this.closeAllDropdowns();
            });
        }
        
        if (deleteDataBtnDash) {
            // Clone to remove old listeners and prevent duplication
            const newDeleteBtnDash = deleteDataBtnDash.cloneNode(true);
            deleteDataBtnDash.parentNode.replaceChild(newDeleteBtnDash, deleteDataBtnDash);
            
            newDeleteBtnDash.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearAllData();
                this.closeAllDropdowns();
            });
        }
        
        // Load initial notifications and settings
        this.loadNotifications();
        this.loadSettings();
        
        // Ensure delete buttons are working
        this.initializeDeleteButtons();
        
        // Re-initialize delete buttons after a delay to catch dynamically loaded content
        setTimeout(() => {
            this.initializeDeleteButtons();
        }, 1000);
        
        // Activate settings dropdown functionality immediately
        console.log('✅ Settings functionality activated');
    }
    
    toggleDropdown(type) {
        const dropdowns = {
            notification: document.getElementById('notificationDropdown')
        };
        
        // Create or get backdrop
        let backdrop = document.getElementById('dropdownBackdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'dropdownBackdrop';
            backdrop.className = 'dropdown-backdrop';
            backdrop.onclick = () => this.closeAllDropdowns();
            document.body.appendChild(backdrop);
        }
        
        // Close all dropdowns first
        Object.values(dropdowns).forEach(dropdown => {
            if (dropdown) dropdown.style.display = 'none';
        });
        backdrop.style.display = 'none';
        
        // Open the requested dropdown
        if (dropdowns[type]) {
            dropdowns[type].style.display = 'block';
            backdrop.style.display = 'block';
            
            // Load specific content
            if (type === 'notification') {
                this.loadNotifications();
            }
        }
    }
    
    closeAllDropdowns() {
        const dropdowns = ['notificationDropdown'];
        dropdowns.forEach(id => {
            const dropdown = document.getElementById(id);
            if (dropdown) dropdown.style.display = 'none';
        });
        
        // Hide backdrop
        const backdrop = document.getElementById('dropdownBackdrop');
        if (backdrop) backdrop.style.display = 'none';
    }
    
    initializeDeleteButtons() {
        console.log('🔍 Initializing delete buttons...');
        
        // Multiple approaches to ensure delete buttons work
        this.setupDeleteButtonHandlers();
        
        // Set up periodic checks for dynamically added buttons
        this.setupDeleteButtonObserver();
        
        // Set up global click delegation as fallback
        this.setupGlobalDeleteHandler();
    }
    
    setupDeleteButtonHandlers() {
        // Method 1: Direct ID targeting
        const deleteButtonIds = ['deleteDataBtn', 'deleteDataBtn-dash'];
        let foundButtons = 0;
        
        deleteButtonIds.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                foundButtons++;
                // Remove any existing listeners by cloning (clean slate approach)
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                // Add multiple event handlers for maximum reliability
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🗑️ Delete button clicked via ID:', btnId);
                    this.clearAllData();
                });
                
                // Also add onclick as backup
                newBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🗑️ Delete button clicked via onclick:', btnId);
                    this.clearAllData();
                };
                
                console.log('✅ Delete button initialized with multiple handlers:', btnId);
            } else {
                console.log('ℹ️ Delete button not found (may not exist on this page):', btnId);
            }
        });
        
        console.log(`📊 Delete button status: ${foundButtons}/${deleteButtonIds.length} buttons found`);
        
        // Method 2: Class-based targeting with improved detection
        const dangerButtons = document.querySelectorAll('.btn-danger-dashboard, .btn-danger, .btn-danger.modern');
        let handledButtons = 0;
        
        dangerButtons.forEach((btn, index) => {
            if (btn.textContent.includes('Clear') || btn.innerHTML.includes('trash') || btn.innerHTML.includes('Clear All Data')) {
                handledButtons++;
                // Remove existing listeners by cloning
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🗑️ Delete button clicked via class:', index, newBtn.textContent.trim());
                    this.clearAllData();
                });
                
                console.log('✅ Danger button initialized via class:', index, newBtn.textContent.trim());
            }
        });
        
        console.log(`📊 Class-based buttons: ${handledButtons}/${dangerButtons.length} danger buttons handled`);
    }
    
    setupDeleteButtonObserver() {
        // Observer to catch dynamically added delete buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Check if the added node is a delete button
                        if (node.id === 'deleteDataBtn' || node.id === 'deleteDataBtn-dash' ||
                            node.classList.contains('btn-danger-dashboard') ||
                            (node.textContent && node.textContent.includes('Clear All Data'))) {
                            
                            this.attachDeleteHandler(node);
                        }
                        
                        // Check for delete buttons within the added node
                        const deleteButtons = node.querySelectorAll('#deleteDataBtn, #deleteDataBtn-dash, .btn-danger-dashboard, .btn-danger');
                        deleteButtons.forEach(btn => this.attachDeleteHandler(btn));
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        this.deleteButtonObserver = observer;
    }
    
    setupGlobalDeleteHandler() {
        // Global event delegation as ultimate fallback
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (target && (
                target.id === 'deleteDataBtn' || 
                target.id === 'deleteDataBtn-dash' ||
                target.classList.contains('btn-danger-dashboard') ||
                (target.textContent && target.textContent.includes('Clear All Data'))
            )) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Delete button clicked via global delegation');
                this.clearAllData();
            }
        }, true); // Use capture phase
    }
    
    attachDeleteHandler(btn) {
        if (!btn || btn.dataset.deleteHandlerAttached) return;
        
        btn.dataset.deleteHandlerAttached = 'true';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🗑️ Delete button clicked via observer');
            this.clearAllData();
        });
        
        console.log('✅ Delete handler attached to:', btn.id || btn.className);
    }
    
    loadNotifications() {
        const notificationList = document.getElementById('notificationList');
        const notificationBadge = document.querySelector('.notification-badge');
        const headerNotificationBadge = document.getElementById('headerNotificationBadge');
        const notificationCount = document.getElementById('notificationCount');
        const notificationBell = document.getElementById('notificationBell');
        
        console.log('🔔 Loading notifications...', { notificationList: !!notificationList });
        
        if (!notificationList) {
            console.error('❌ Notification list element not found');
            return;
        }
        
        // Get low stock products
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        console.log('📦 Products found:', products.length);
        
        const lowStockProducts = products.filter(p => {
            const stock = p.stock_quantity || 0;
            const reorderLevel = p.reorderLevel || p.min_stock_level || 5;
            const isLowStock = stock <= reorderLevel;
            console.log(`📦 ${p.name}: stock=${stock}, reorder=${reorderLevel}, lowStock=${isLowStock}`);
            return isLowStock;
        });
        
        console.log('⚠️ Low stock products:', lowStockProducts.length);
        
        let notifications = [];
        
        // Add low stock notifications with better logic
        lowStockProducts.forEach(product => {
            const stockLevel = product.stock_quantity || 0;
            let priority = 'medium';
            let icon = 'fa-exclamation-triangle';
            let title = 'Low Stock Alert';
            let message = `${product.name} - Only ${stockLevel} remaining`;
            
            // Determine urgency based on stock level
            if (stockLevel === 0) {
                priority = 'high';
                icon = 'fa-times-circle';
                title = 'Out of Stock';
                message = `${product.name} is completely out of stock`;
            } else if (stockLevel <= 2) {
                priority = 'high';
                title = 'Critical Stock Alert';
                message = `${product.name} - Only ${stockLevel} left!`;
            } else if (stockLevel <= product.reorderLevel) {
                priority = 'medium';
                title = 'Low Stock Alert';
                message = `${product.name} - ${stockLevel} remaining (reorder level: ${product.reorderLevel})`;
            }
            
            notifications.push({
                id: `low-stock-${product.id}`,
                type: 'warning',
                icon: icon,
                title: title,
                message: message,
                time: 'Now',
                priority: priority
            });
        });
        
        // Add recent sales notifications (last 24 hours)
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const recentSales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return saleDate > dayAgo;
        }).slice(0, 3); // Only show last 3
        
        recentSales.forEach(sale => {
            notifications.push({
                id: `sale-${sale.id}`,
                type: 'success',
                icon: 'fa-shopping-cart',
                title: 'New Sale',
                message: `${sale.customer_name || 'Customer'} purchased items worth ₵${sale.total_amount}`,
                time: this.formatTimeAgo(new Date(sale.created_at || sale.date)),
                priority: 'medium'
            });
        });
        
        // Add welcome message if no products
        if (products.length === 0) {
            notifications.push({
                id: 'welcome',
                type: 'info',
                icon: 'fa-info-circle',
                title: 'Welcome to J\'MONIC Dashboard',
                message: 'Start by adding your first product to track inventory and sales',
                time: 'Getting Started',
                priority: 'low'
            });
        }
        
        // Sort by priority
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        notifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        
        console.log('🔔 Total notifications:', notifications.length);
        
        // Update notification badges with enhanced animation - only for critical alerts
        const criticalAlerts = notifications.filter(n => {
            if (n.type === 'warning' && n.id.startsWith('low-stock-')) {
                // Only consider it critical if stock is 0 or very low (1-2 units)
                const product = lowStockProducts.find(p => `low-stock-${p.id}` === n.id);
                return product && product.stock_quantity <= 2;
            }
            return n.priority === 'high';
        });
        
        const unreadCount = criticalAlerts.length;
        
        [notificationBadge, headerNotificationBadge].forEach(badge => {
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = 'block';
                    badge.style.animation = 'badge-bounce 0.6s ease-out';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
        
        // Update notification bell state
        if (notificationBell) {
            if (unreadCount > 0) {
                notificationBell.classList.add('has-alerts');
            } else {
                notificationBell.classList.remove('has-alerts');
            }
        }
        
        if (notificationCount) {
            notificationCount.textContent = unreadCount === 0 ? 'All good!' : 
                unreadCount === 1 ? '1 critical alert' : `${unreadCount} critical alerts`;
        }
        
        // Enhanced notification display
        this.renderSimpleNotifications(notifications);
    }
    
    // Helper function to format time ago
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }
    
    // Enhanced header notification functions
    showLiveNotification(title, message, type = 'info', icon = 'fa-info-circle', duration = 4000) {
        const liveNotification = document.getElementById('liveNotification');
        if (!liveNotification) return;
        
        console.log('🔔 Showing live notification:', { title, message, type });
        
        // Play notification sound (if supported)
        this.playNotificationSound(type);
        
        // Update content
        const titleEl = liveNotification.querySelector('.notification-title');
        const textEl = liveNotification.querySelector('.notification-text');
        const iconEl = liveNotification.querySelector('.notification-icon i');
        
        if (titleEl) titleEl.textContent = title;
        if (textEl) textEl.textContent = message;
        if (iconEl) iconEl.className = `fas ${icon}`;
        
        // Update type class
        liveNotification.className = `live-notification ${type}`;
        
        // Show notification with animation
        liveNotification.style.display = 'block';
        liveNotification.style.animation = 'notification-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Trigger bell animation
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.classList.add('pulse-notification');
            setTimeout(() => notificationBell.classList.remove('pulse-notification'), 600);
        }
        
        // Auto hide after specified duration
        setTimeout(() => {
            if (liveNotification) {
                liveNotification.style.animation = 'notification-slide-out 0.3s ease';
                setTimeout(() => {
                    liveNotification.style.display = 'none';
                }, 300);
            }
        }, duration);
        
        // Add click to dismiss
        liveNotification.onclick = () => {
            liveNotification.style.animation = 'notification-slide-out 0.3s ease';
            setTimeout(() => {
                liveNotification.style.display = 'none';
            }, 300);
        };
        
        // Update notification count
        this.loadNotifications();
    }
    
    // Play notification sound based on type
    playNotificationSound(type = 'info') {
        try {
            // Create audio context if supported
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const audioContext = new (AudioContext || webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Different frequencies for different types
                const frequencies = {
                    'success': 800,
                    'info': 600,
                    'warning': 400,
                    'error': 300
                };
                
                oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        } catch (error) {
            console.log('🔇 Audio not supported or disabled');
        }
    }
    
    // Enhanced notification bell functionality
    triggerNotificationAlert(message, type = 'info') {
        const notificationBell = document.getElementById('notificationBell');
        if (!notificationBell) return;
        
        // Add visual feedback
        notificationBell.classList.add('has-alerts');
        notificationBell.classList.add('pulse-notification');
        
        // Show live notification
        this.showLiveNotification('Alert', message, type);
        
        // Remove pulse after animation
        setTimeout(() => {
            notificationBell.classList.remove('pulse-notification');
        }, 600);
    }
    
    updateHeaderNotificationBadge() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        const lowStockCount = products.filter(p => {
            const stock = p.stock_quantity || 0;
            const reorderLevel = p.reorderLevel || p.min_stock_level || 5;
            return stock <= reorderLevel;
        }).length;
        
        const headerBadge = document.getElementById('headerNotificationBadge');
        const notificationBell = document.getElementById('notificationBell');
        
        if (headerBadge && notificationBell) {
            if (lowStockCount > 0) {
                headerBadge.textContent = lowStockCount;
                headerBadge.style.display = 'block';
                // Add alert animation class
                notificationBell.classList.add('has-alerts');
                
                // Add a brief shake animation for new alerts
                notificationBell.style.animation = 'none';
                setTimeout(() => {
                    notificationBell.style.animation = '';
                }, 10);
            } else {
                headerBadge.style.display = 'none';
                notificationBell.classList.remove('has-alerts');
            }
        }
    }
    
    // Enhanced notification bell interaction
    showNotificationAlert() {
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            // Add a temporary shake effect for immediate feedback
            notificationBell.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                notificationBell.style.animation = '';
            }, 500);
            
            // Update badge and alert state
            this.updateHeaderNotificationBadge();
        }
    }
    
    renderSimpleNotifications(notifications) {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        
        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="no-notifications">
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">All Good!</h3>
                        <p style="color: var(--text-secondary);">No alerts or issues to address</p>
                    </div>
                </div>
            `;
            return;
        }
        
        notificationList.innerHTML = notifications.map(notification => `
            <div class="notification-item simple" data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${notification.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            </div>
        `).join('');
    }
    
    
    // Simplified notification functions
    markNotificationAsRead(notificationId) {
        // Simplified - just reload notifications
        this.loadNotifications();
    }
    
    markAllAsRead() {
        // Simplified - just reload notifications  
        this.loadNotifications();
    }
    
    dismissNotification(notificationId) {
        // Simplified - just reload notifications
        this.loadNotifications();
    }
    
    clearNotifications() {
        const notificationList = document.getElementById('notificationList');
        const notificationBadge = document.querySelector('.notification-badge');
        
        if (notificationList) {
            notificationList.innerHTML = `
                <div class="no-notifications">
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">All Good!</h3>
                        <p style="color: var(--text-secondary);">No alerts or issues to address</p>
                    </div>
                </div>
            `;
        }
        
        if (notificationBadge) {
            notificationBadge.style.display = 'none';
        }
    }
    
    // Header notification dropdown toggle
    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        const notificationBell = document.getElementById('notificationBell');
        const headerNotificationBadge = document.getElementById('headerNotificationBadge');
        
        console.log('🔔 Toggle notification dropdown', { dropdown: !!dropdown, bell: !!notificationBell });
        
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            console.log('🔔 Dropdown current state:', isVisible ? 'visible' : 'hidden');
            
            if (isVisible) {
                // Hide dropdown
                dropdown.style.display = 'none';
                dropdown.classList.remove('show');
                console.log('🔔 Hiding dropdown');
                // Remove document click listener
                document.removeEventListener('click', this.handleNotificationClickOutside);
            } else {
                // Show dropdown and load notifications
                this.loadNotifications();
                dropdown.style.display = 'block';
                dropdown.style.visibility = 'visible';
                dropdown.style.opacity = '1';
                dropdown.style.zIndex = '99999';
                dropdown.classList.add('show');
                console.log('🔔 Showing dropdown');
                
                // Hide notification badge since user has seen the notifications
                if (headerNotificationBadge) {
                    headerNotificationBadge.style.display = 'none';
                }
                
                // Remove has-alerts class from bell
                if (notificationBell) {
                    notificationBell.classList.remove('has-alerts');
                }
                
                // Force repaint
                dropdown.offsetHeight;
                
                // Add a slight pulse to the bell
                if (notificationBell) {
                    notificationBell.classList.add('pulse-notification');
                    setTimeout(() => notificationBell.classList.remove('pulse-notification'), 600);
                }
                
                // Add document click listener to close when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', this.handleNotificationClickOutside.bind(this));
                }, 100);
            }
        } else {
            console.error('❌ Notification dropdown element not found');
        }
    }
    
    // Handle clicking outside notification dropdown
    handleNotificationClickOutside(event) {
        const dropdown = document.getElementById('notificationDropdown');
        const notificationContainer = document.querySelector('.notification-container');
        
        if (dropdown && notificationContainer && !notificationContainer.contains(event.target)) {
            dropdown.style.display = 'none';
            dropdown.classList.remove('show');
            document.removeEventListener('click', this.handleNotificationClickOutside);
        }
    }

    updateNotificationCounts() {
        const unreadCount = this.allNotifications ? this.allNotifications.filter(n => !n.read).length : 0;
        const notificationCount = document.getElementById('notificationCount');
        const notificationBadge = document.querySelector('.notification-badge');
        
        if (notificationCount) {
            notificationCount.textContent = unreadCount === 0 ? 'No new notifications' : 
                unreadCount === 1 ? '1 new notification' : `${unreadCount} new notifications`;
        }
        
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.style.display = 'block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
        
        // Update mobile and sidebar badges
        const mobileNotificationBadge = document.querySelector('.mobile-notification-badge');
        const sidebarNotificationBadge = document.querySelector('.sidebar-notification-badge');
        
        [mobileNotificationBadge, sidebarNotificationBadge].forEach(badge => {
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    }
    
    clearNotifications() {
        const notificationList = document.getElementById('notificationList');
        const notificationBadge = document.querySelector('.notification-badge');
        
        if (notificationList) {
            notificationList.innerHTML = '<div class="no-notifications">No new notifications</div>';
        }
        
        if (notificationBadge) {
            notificationBadge.style.display = 'none';
        }
        
        this.showNotification('Notifications cleared', 'success');
    }
    
    // Test notification functionality (for demonstration)
    testNotifications() {
        console.log('🧪 Testing notification system...');
        
        // Test different notification types
        setTimeout(() => {
            this.showLiveNotification('Product Added', 'New iPhone 15 Pro added to inventory', 'success', 'fa-plus-circle');
        }, 1000);
        
        setTimeout(() => {
            this.showLiveNotification('Low Stock Alert', 'Samsung Galaxy S24 - Only 2 remaining', 'warning', 'fa-exclamation-triangle');
        }, 3000);
        
        setTimeout(() => {
            this.showLiveNotification('Sale Completed', 'Customer purchased items worth ₵2,450', 'success', 'fa-shopping-cart');
        }, 5000);
        
        setTimeout(() => {
            this.showLiveNotification('System Info', 'Dashboard backup completed successfully', 'info', 'fa-info-circle');
        }, 7000);
        
        console.log('🧪 Test notifications scheduled');
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('jmonic_settings') || '{}');
        
        // Load theme settings for both selectors
        const themeRadios = document.querySelectorAll('input[name="theme"], input[name="theme-dash"]');
        themeRadios.forEach(radio => {
            radio.checked = radio.value === (settings.theme || 'light');
        });
        
        // Load business information
        const businessName = document.getElementById('businessName');
        const ownerName = document.getElementById('ownerName');
        const businessEmail = document.getElementById('businessEmail');
        const businessPhone = document.getElementById('businessPhone');
        const businessAddress = document.getElementById('businessAddress');
        
        if (businessName) businessName.value = settings.businessName || 'J\'MONIC ENTERPRISE';
        if (ownerName) ownerName.value = settings.ownerName || 'Business Owner';
        if (businessEmail) businessEmail.value = settings.businessEmail || '';
        if (businessPhone) businessPhone.value = settings.businessPhone || '';
        if (businessAddress) businessAddress.value = settings.businessAddress || '';
        
        // Load other settings
        const currencySelector = document.getElementById('currencySelector');
        const currencySelectorDash = document.getElementById('currencySelector-dash');
        const languageSelector = document.getElementById('languageSelector-dash');
        const timezoneSelector = document.getElementById('timezoneSelector');
        const lowStockLevel = document.getElementById('lowStockLevel') || document.getElementById('lowStockLevel-dash');
        const enableAnalytics = document.getElementById('enableAnalytics') || document.getElementById('enableAnalytics-dash');
        const lowStockAlerts = document.getElementById('lowStockAlerts') || document.getElementById('lowStockAlerts-dash');
        const salesNotifications = document.getElementById('salesNotifications') || document.getElementById('salesNotifications-dash');
        const autoBackup = document.getElementById('autoBackup') || document.getElementById('autoBackup-dash');
        
        if (currencySelector) currencySelector.value = settings.currency || 'GHS';
        if (currencySelectorDash) currencySelectorDash.value = settings.currency || 'GHS';
        if (languageSelector) languageSelector.value = settings.language || 'en';
        if (timezoneSelector) timezoneSelector.value = settings.timezone || 'Africa/Accra';
        if (lowStockLevel) lowStockLevel.value = settings.lowStockLevel || 5;
        if (enableAnalytics) enableAnalytics.checked = settings.enableAnalytics !== false;
        if (lowStockAlerts) lowStockAlerts.checked = settings.lowStockAlerts !== false;
        if (salesNotifications) salesNotifications.checked = settings.salesNotifications !== false;
        if (autoBackup) autoBackup.checked = settings.autoBackup !== false;
        
        // Apply theme immediately
        this.applyTheme(settings.theme || 'light');
        
        // Initialize settings tabs
        this.initializeSettingsTabs();
        
        // Add theme change event listeners
        this.initializeThemeHandlers();
        
        // Load and display settings
    }
    
    saveSettings() {
        const themeRadio = document.querySelector('input[name="theme"]:checked') || 
                          document.querySelector('input[name="theme-dash"]:checked');
        const currency = document.getElementById('currencySelector')?.value || 
                        document.getElementById('currencySelector-dash')?.value || 'GHS';
        
        const settings = {
            theme: themeRadio?.value || 'light',
            currency: currency,
            language: document.getElementById('languageSelector-dash')?.value || 'en',
            timezone: document.getElementById('timezoneSelector')?.value || 'Africa/Accra',
            businessName: document.getElementById('businessName')?.value || 'J\'MONIC ENTERPRISE',
            ownerName: document.getElementById('ownerName')?.value || 'Business Owner',
            businessEmail: document.getElementById('businessEmail')?.value || '',
            businessPhone: document.getElementById('businessPhone')?.value || '',
            businessAddress: document.getElementById('businessAddress')?.value || '',
            lowStockLevel: parseInt(document.getElementById('lowStockLevel')?.value || document.getElementById('lowStockLevel-dash')?.value) || 5,
            enableAnalytics: (document.getElementById('enableAnalytics')?.checked || document.getElementById('enableAnalytics-dash')?.checked) !== false,
            lowStockAlerts: (document.getElementById('lowStockAlerts')?.checked || document.getElementById('lowStockAlerts-dash')?.checked) !== false,
            salesNotifications: (document.getElementById('salesNotifications')?.checked || document.getElementById('salesNotifications-dash')?.checked) !== false,
            autoBackup: (document.getElementById('autoBackup')?.checked || document.getElementById('autoBackup-dash')?.checked) !== false
        };
        
        localStorage.setItem('jmonic_settings', JSON.stringify(settings));
        this.applySettings(settings);
        this.showNotification('Settings saved successfully!', 'success');
        
        // Add save animation
        const saveBtn = document.querySelector('.section-actions .btn-primary');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveBtn.classList.add('success');
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('success');
            }, 2000);
        }
    }
    
    initializeSettingsTabs() {
        const settingsTabButtons = document.querySelectorAll('.settings-tabs .tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        settingsTabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active tab button
                settingsTabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding tab content
                const tabName = btn.dataset.tab;
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabName}-tab`) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }
    
    resetSettings() {
        console.log('Settings: Resetting to default values');
        
        const defaultSettings = {
            businessName: 'J\'MONIC ENTERPRISE',
            ownerName: '',
            email: '',
            phone: '',
            address: '',
            theme: 'light',
            currency: 'GHS',
            language: 'en',
            lowStockLevel: 10,
            enableAnalytics: true,
            lowStockAlerts: true,
            salesNotifications: true,
            autoBackup: true
        };
        
        // Get form elements for business information
        const businessNameInput = document.getElementById('businessName');
        const businessNameInputDash = document.getElementById('businessNameDash');
        const ownerNameInput = document.getElementById('ownerName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('address');
        
        // Get form elements for other settings
        const themeSelector = document.getElementById('themeSelector');
        const themeSelectorDash = document.getElementById('themeSelectorDash');
        const currencySelector = document.getElementById('currencySelector');
        const currencySelectorDash = document.getElementById('currencySelectorDash');
        const languageSelector = document.getElementById('languageSelector');
        const lowStockLevel = document.getElementById('lowStockLevel');
        const enableAnalytics = document.getElementById('enableAnalytics');
        const lowStockAlerts = document.getElementById('lowStockAlerts');
        const salesNotifications = document.getElementById('salesNotifications');
        const autoBackup = document.getElementById('autoBackup');
        const autoBackupDash = document.getElementById('autoBackupDash');
        
        // Reset business information fields
        if (businessNameInput) businessNameInput.value = defaultSettings.businessName;
        if (businessNameInputDash) businessNameInputDash.value = defaultSettings.businessName;
        if (ownerNameInput) ownerNameInput.value = defaultSettings.ownerName;
        if (emailInput) emailInput.value = defaultSettings.email;
        if (phoneInput) phoneInput.value = defaultSettings.phone;
        if (addressInput) addressInput.value = defaultSettings.address;
        
        // Reset other settings fields
        if (themeSelector) themeSelector.value = defaultSettings.theme;
        if (themeSelectorDash) themeSelectorDash.value = defaultSettings.theme;
        if (currencySelector) currencySelector.value = defaultSettings.currency;
        if (currencySelectorDash) currencySelectorDash.value = defaultSettings.currency;
        if (languageSelector) languageSelector.value = defaultSettings.language;
        if (lowStockLevel) lowStockLevel.value = defaultSettings.lowStockLevel;
        if (enableAnalytics) enableAnalytics.checked = defaultSettings.enableAnalytics;
        if (lowStockAlerts) lowStockAlerts.checked = defaultSettings.lowStockAlerts;
        if (salesNotifications) salesNotifications.checked = defaultSettings.salesNotifications;
        if (autoBackup) autoBackup.checked = defaultSettings.autoBackup;
        if (autoBackupDash) autoBackupDash.checked = defaultSettings.autoBackup;
        
        // Apply theme immediately
        if (typeof applyThemeGlobal === 'function') {
            applyThemeGlobal(defaultSettings.theme);
        }
        
        // Save settings and apply
        localStorage.setItem('jmonic_settings', JSON.stringify(defaultSettings));
        this.applySettings(defaultSettings);
        
        this.showNotification('Settings reset to default successfully!', 'success');
        
        // Add visual feedback to reset button
        const resetBtn = document.querySelector('.footer-actions .btn-secondary');
        if (resetBtn) {
            resetBtn.innerHTML = '<i class="fas fa-check"></i> Reset Complete!';
            resetBtn.style.background = '#28a745';
            setTimeout(() => {
                resetBtn.innerHTML = '<i class="fas fa-undo"></i> Reset to Default';
                resetBtn.style.background = '';
            }, 2000);
        }
    }
    
    applySettings(settings) {
        // Apply theme
        this.applyTheme(settings.theme || 'light');
        
        // Apply currency (this would need more implementation for full currency conversion)
        window.currentCurrency = settings.currency;
        
        // Apply low stock level (update all relevant checks)
        window.defaultLowStockLevel = settings.lowStockLevel;
        
        // Refresh data with new settings
        this.refreshLowStockData();
    }
    
    applyTheme(theme) {
        const body = document.body;
        const html = document.documentElement;
        
        // Add smooth transition animation
        body.classList.add('theme-changing');
        
        // Remove all theme classes
        body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        html.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        if (theme === 'dark') {
            body.classList.add('theme-dark');
            html.classList.add('theme-dark');
        } else if (theme === 'light') {
            body.classList.add('theme-light');
            html.classList.add('theme-light');
        } else if (theme === 'auto') {
            body.classList.add('theme-auto');
            html.classList.add('theme-auto');
            
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                body.classList.add('theme-dark');
                html.classList.add('theme-dark');
            } else {
                body.classList.add('theme-light');
                html.classList.add('theme-light');
            }
        }
        
        // Remove animation class after transition
        setTimeout(() => {
            body.classList.remove('theme-changing');
        }, 500);
        
        // Store theme preference
        localStorage.setItem('jmonic_theme', theme);
        
        // Update theme preview in theme cards
        this.updateThemePreview(theme);
    }
    
    updateThemePreview(theme) {
        // Add visual feedback to show which theme is active
        const themeCards = document.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            const input = card.previousElementSibling;
            if (input && input.value === theme) {
                card.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            }
        });
    }
    
    initializeThemeHandlers() {
        // Add event listeners to all theme selectors
        const themeInputs = document.querySelectorAll('input[name="theme"], input[name="theme-dash"]');
        
        themeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const theme = e.target.value;
                    this.applyTheme(theme);
                    
                    // Sync all theme selectors
                    themeInputs.forEach(otherInput => {
                        otherInput.checked = otherInput.value === theme;
                    });
                    
                    // Save settings
                    setTimeout(() => this.saveSettings(), 100);
                    
                    // Show theme change notification
                    this.showNotification(`Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 'success');
                }
            });
        });
        
        // Listen for system theme changes when in auto mode
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const currentTheme = localStorage.getItem('jmonic_theme') || 'light';
            if (currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });
    }
    
    updateLowStockAlerts(lowStockProducts) {
        const alertsList = document.querySelector('.alert-list');
        if (!alertsList) return;
        
        // Ensure lowStockProducts is an array
        if (!Array.isArray(lowStockProducts)) {
            console.warn('Low stock products is not an array:', lowStockProducts);
            lowStockProducts = [];
        }
        
        alertsList.innerHTML = '';
        
        if (lowStockProducts.length === 0) {
            alertsList.innerHTML = `
                <div class="alert-item">
                    <div class="alert-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="alert-content">
                        <p>All products are well stocked!</p>
                        <span class="alert-action">Keep up the good work</span>
                    </div>
                </div>
            `;
            return;
        }
        
        lowStockProducts.forEach(product => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <p>Low stock: ${product.name}</p>
                    <span class="alert-action">Only ${product.stock_quantity} units left</span>
                </div>
            `;
            alertsList.appendChild(alertItem);
        });
    }
    
    showNotification(message, type = 'info') {
        // Simple console notification for now
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // You can implement a proper toast notification system here
        // For now, we'll use browser alert for errors
        if (type === 'error') {
            alert(message);
        }
    }

    showPrintReceipt(saleData, products) {
        // Get business name from settings
        const settings = JSON.parse(localStorage.getItem('jmonic_business_settings') || '{}');
        const businessName = settings.businessName || 'GEL-STOCK';
        const businessPhone = settings.businessPhone || '';
        const businessEmail = settings.businessEmail || '';
        
        // Generate receipt HTML with proper date and time formatting
        const saleDateTime = new Date(saleData.date);
        const receiptDate = saleDateTime.toLocaleString('en-GH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        let productsHTML = '';
        let subtotal = 0;
        
        if (products && Array.isArray(products)) {
            products.forEach(product => {
                const itemSubtotal = product.subtotal || (product.price * product.quantity);
                subtotal += itemSubtotal;
                productsHTML += `
                    <tr>
                        <td>${product.name}</td>
                        <td style="text-align: center;">${product.quantity}</td>
                        <td style="text-align: right;">GHS ${product.price.toFixed(2)}</td>
                        <td style="text-align: right;">GHS ${itemSubtotal.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        
        const totalAmount = parseFloat(saleData.totalAmount || saleData.total_amount || 0);
        
        const receiptHTML = `
            <div class="receipt-container" style="max-width: 600px; margin: 0 auto; padding: 2rem; font-family: 'Courier New', monospace; font-size: 0.95rem; line-height: 1.6;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem;">
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #1f2937;">
                        ${businessName}
                    </h2>
                    <p style="margin: 0.3rem 0; color: #666; font-size: 0.85rem;">Smart Stock Management</p>
                </div>
                
                <!-- Receipt Info -->
                <div style="margin-bottom: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <div><strong>Receipt #:</strong></div>
                        <div style="color: #3b82f6; font-weight: bold;">RCP-${Date.now().toString().slice(-8)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>Date & Time:</strong></div>
                        <div>${receiptDate}</div>
                    </div>
                </div>
                
                ${saleData.customerName ? `<div style="margin-bottom: 1rem;"><strong>Customer:</strong> ${saleData.customerName}</div>` : ''}
                
                <!-- Payment Method -->
                <div style="margin-bottom: 1rem; font-size: 0.9rem;">
                    <strong>Payment by:</strong> ${saleData.paymentMethod ? saleData.paymentMethod.charAt(0).toUpperCase() + saleData.paymentMethod.slice(1).replace('_', ' ') : 'Not specified'}
                </div>
                
                <!-- Products Table -->
                <div style="margin: 1rem 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #999;">
                                <th style="text-align: left; padding: 0.5rem 0; font-weight: bold;">Product</th>
                                <th style="text-align: center; padding: 0.5rem 0; font-weight: bold;">Qty</th>
                                <th style="text-align: right; padding: 0.5rem 0; font-weight: bold;">Price</th>
                                <th style="text-align: right; padding: 0.5rem 0; font-weight: bold;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productsHTML}
                        </tbody>
                    </table>
                </div>
                
                <!-- Totals -->
                <div style="margin: 1rem 0; padding: 1rem 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem;">
                        <div style="text-align: right;">Subtotal:</div>
                        <div style="text-align: right;">GHS ${subtotal.toFixed(2)}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-weight: bold; font-size: 1.1rem;">
                        <div style="text-align: right;">TOTAL:</div>
                        <div style="text-align: right;">GHS ${totalAmount.toFixed(2)}</div>
                    </div>
                </div>
                
                ${saleData.paymentMethod === 'credit' ? `
                <div style="background: #fef3c7; padding: 0.75rem; border-left: 3px solid #f59e0b; margin: 1rem 0; font-size: 0.85rem;">
                    <strong>Credit Details:</strong><br>
                    Paid Now: GHS ${(saleData.creditAmountPaid || 0).toFixed(2)}<br>
                    Outstanding: GHS ${(saleData.creditAmountOutstanding || 0).toFixed(2)}<br>
                    Due Date: ${saleData.creditDueDate ? new Date(saleData.creditDueDate).toLocaleDateString('en-GH') : 'N/A'}
                </div>
                ` : ''}
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; font-size: 0.85rem; color: #666;">
                    <p style="margin: 0.5rem 0;">Thank you for your business!</p>
                    ${businessPhone ? `<p style="margin: 0.5rem 0;">${businessPhone}</p>` : ''}
                    <p style="margin: 0.5rem 0; font-size: 0.8rem; color: #999;">GEL-STOCK © ${new Date().getFullYear()}</p>
                </div>
                
            </div>
        `;
        
        // Insert receipt into modal
        const receiptContentDiv = document.getElementById('receiptContent');
        if (receiptContentDiv) {
            receiptContentDiv.innerHTML = receiptHTML;
        }
        
        // Open print receipt modal
        openModal('printReceiptModal');
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    formatCurrency(amount) {
        return `GHS ${parseFloat(amount).toFixed(2)}`;
    }

    // Product and Sales Management
    async loadSalesData() {
        try {
            const response = await this.apiCall('sales.php');
            const sales = response.data || [];
            const salesTableBody = document.getElementById('salesTableBody');
            
            if (!salesTableBody) return;
            
            if (sales.length === 0) {
                salesTableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 2rem;">
                            <div style="color: var(--text-muted);">
                                <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                                <p>No sales recorded yet</p>
                                <p>Add your first sale to get started!</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            salesTableBody.innerHTML = sales.map((sale, index) => {
                // Calculate totals and costs
                let totalQuantity = 0;
                let totalCost = 0;
                let productNames = [];
                
                if (sale.products && Array.isArray(sale.products)) {
                    sale.products.forEach(product => {
                        totalQuantity += product.quantity || 1;
                        productNames.push(product.name || 'Unknown Product');
                        
                        // Find product cost price
                        const productData = products.find(p => p.id == product.id);
                        if (productData && productData.cost_price) {
                            totalCost += (productData.cost_price * (product.quantity || 1));
                        }
                    });
                }
                
                const revenue = parseFloat(sale.revenue || sale.totalAmount || 0);
                const profit = revenue - totalCost;
                const saleId = sale.id || `S-${Date.now().toString().slice(-5)}-${index}`;
                
                // Format product names display
                const productsDisplay = productNames.length > 0 
                    ? (productNames.length === 1 
                        ? productNames[0] 
                        : `${productNames[0]} ${productNames.length > 1 ? `+${productNames.length - 1} more` : ''}`)
                    : 'Multiple items';
                
                return `
                    <tr>
                        <td>#${saleId}</td>
                        <td>
                            <div class="products-sold">
                                <span>${productsDisplay}</span>
                                ${productNames.length > 1 ? `<small>${productNames.slice(1).join(', ')}</small>` : ''}
                            </div>
                            ${sale.customerName ? `<small style="color: #6b7280; display: block; margin-top: 0.25rem;"><i class="fas fa-user-circle"></i> ${sale.customerName}</small>` : ''}
                        </td>
                        <td>${totalQuantity}</td>
                        <td>GHS ${revenue.toFixed(2)}</td>
                        <td>GHS ${totalCost.toFixed(2)}</td>
                        <td class="${profit > 0 ? 'profit-positive' : profit < 0 ? 'profit-negative' : ''}">
                            GHS ${profit.toFixed(2)}
                        </td>
                        <td>${this.formatDate(sale.date || sale.created_at)}</td>
                        <td><span class="status-badge completed">Completed</span></td>
                        <td>
                            <button class="btn-icon" title="View Details" onclick="businessManager.viewSaleDetails('${saleId}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" title="Print Receipt" onclick="businessManager.printReceipt('${saleId}')">
                                <i class="fas fa-print"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading sales data:', error);
            const salesTableBody = document.getElementById('salesTableBody');
            if (salesTableBody) {
                salesTableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 2rem; color: var(--danger);">
                            Error loading sales data. Please check your connection.
                        </td>
                    </tr>
                `;
            }
        }
    }

    async loadProductsInventory() {
        try {
            const response = await this.apiCall('products.php');
            const products = response.data;
            const productsTableBody = document.querySelector('#productsTableBody');
            
            if (!productsTableBody) return;
            
            if (products.length === 0) {
                productsTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            <div style="color: var(--text-muted);">
                                <i class="fas fa-cut" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                                <p>No products in inventory yet</p>
                                <p>Add your first product to get started!</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            productsTableBody.innerHTML = products.map(product => {
                const margin = product.selling_price && product.cost_price 
                    ? (((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(1)
                    : '0.0';
                
                const stockStatus = product.stock_quantity <= (product.min_stock_level || 20) 
                    ? 'low' : product.stock_quantity > 100 ? 'good' : 'medium';
                
                const statusBadge = product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock';
                const statusText = product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock';
                
                return `
                    <tr>
                        <td>
                            <div class="product-info">
                                <div class="product-avatar">
                                    <i class="fas fa-cut"></i>
                                </div>
                                <div>
                                    <span class="product-name">${product.name}</span>
                                    <span class="product-description">${product.description || 'Product description'}</span>
                                </div>
                            </div>
                        </td>
                        <td>${product.sku}</td>
                        <td><span class="stock-level ${stockStatus}">${product.stock_quantity}</span></td>
                        <td>GHS ${parseFloat(product.selling_price || 0).toFixed(2)}</td>
                        <td>GHS ${parseFloat(product.cost_price || 0).toFixed(2)}</td>
                        <td><span class="margin-${margin > 40 ? 'good' : margin > 20 ? 'medium' : 'low'}">${margin}%</span></td>
                        <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
                        <td>
                            <button class="btn-icon" title="Edit Product" onclick="editProduct(${product.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" title="Delete Product" onclick="deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Update product stats
            this.updateProductStats(products);
            
        } catch (error) {
            console.error('Error loading products inventory:', error);
            const productsTableBody = document.querySelector('#productsTable tbody');
            if (productsTableBody) {
                productsTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--danger);">
                            Error loading products. Please check your connection.
                        </td>
                    </tr>
                `;
            }
        }
    }

    updateProductStats(products) {
        this.updateProductStats(products);
    }

    async loadCategoryAnalytics() {
        try {
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
            
            if (products.length === 0) {
                this.showCategoryAnalyticsEmpty();
                return;
            }

            // Build category map with sales data
            const categoryMap = {};

            // First, map all products by category
            products.forEach(product => {
                const category = product.category || 'Uncategorized';
                if (!categoryMap[category]) {
                    categoryMap[category] = {
                        name: category,
                        products: [],
                        totalRevenue: 0,
                        totalProfit: 0,
                        totalStock: 0,
                        totalCost: 0,
                        productCount: 0
                    };
                }
                categoryMap[category].products.push(product);
                categoryMap[category].productCount++;
                categoryMap[category].totalStock += product.stock_quantity || 0;
                categoryMap[category].totalCost += (product.stock_quantity || 0) * (product.cost_price || 0);
            });

            // Add sales data to categories
            sales.forEach(sale => {
                if (sale.products && Array.isArray(sale.products)) {
                    sale.products.forEach(saleProduct => {
                        const product = products.find(p => p.id == saleProduct.id);
                        if (product) {
                            const category = product.category || 'Uncategorized';
                            if (categoryMap[category]) {
                                const revenue = saleProduct.subtotal || (saleProduct.price * saleProduct.quantity);
                                const cost = (product.cost_price || 0) * saleProduct.quantity;
                                const profit = revenue - cost;
                                
                                categoryMap[category].totalRevenue += revenue;
                                categoryMap[category].totalProfit += profit;
                            }
                        }
                    });
                }
            });

            // Calculate summary metrics
            let totalRevenue = 0;
            let totalProfit = 0;
            const categoryArray = Object.values(categoryMap);

            categoryArray.forEach(cat => {
                totalRevenue += cat.totalRevenue;
                totalProfit += cat.totalProfit;
            });

            const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

            // Update summary cards
            document.getElementById('categoryTotalRevenue').textContent = `GHS ${totalRevenue.toFixed(2)}`;
            document.getElementById('categoryTotalProfit').textContent = `GHS ${totalProfit.toFixed(2)}`;
            document.getElementById('categoriesCount').textContent = categoryArray.length;
            document.getElementById('avgProfitMargin').textContent = `${avgMargin}%`;

            // Update category table
            const tableBody = document.getElementById('categoryTableBody');
            if (categoryArray.length === 0) {
                tableBody.innerHTML = `
                    <tr class="no-data-row">
                        <td colspan="8">
                            <div class="no-data-message">
                                <i class="fas fa-inbox"></i>
                                <p>No categories with sales data yet</p>
                                <small>Category analytics will appear once you record sales</small>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                tableBody.innerHTML = categoryArray
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map(category => {
                        const margin = category.totalRevenue > 0 
                            ? ((category.totalProfit / category.totalRevenue) * 100).toFixed(1)
                            : '0.0';
                        const avgPrice = category.productCount > 0
                            ? (category.products.reduce((sum, p) => sum + (p.selling_price || 0), 0) / category.productCount).toFixed(2)
                            : '0.00';
                        
                        return `
                            <tr>
                                <td><strong>${category.name}</strong></td>
                                <td>${category.productCount}</td>
                                <td class="revenue-amount">GHS ${category.totalRevenue.toFixed(2)}</td>
                                <td class="profit-amount ${category.totalProfit >= 0 ? 'positive' : 'negative'}">GHS ${category.totalProfit.toFixed(2)}</td>
                                <td><span class="margin-badge">${margin}%</span></td>
                                <td>GHS ${avgPrice}</td>
                                <td>GHS ${category.totalCost.toFixed(2)}</td>
                                <td>
                                    <button class="btn-icon" onclick="businessManager.viewCategoryDetails('${category.name}')" title="View Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    })
                    .join('');
            }

            // Update category breakdown
            this.updateCategoryBreakdown(categoryArray);

        } catch (error) {
            console.error('Error loading category analytics:', error);
            this.showNotification('Error loading category analytics', 'error');
        }
    }

    updateCategoryBreakdown(categories) {
        const breakdown = document.getElementById('categoryBreakdown');
        
        if (categories.length === 0) {
            breakdown.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-inbox"></i>
                    <p>Add products with categories to see breakdown</p>
                </div>
            `;
            return;
        }

        breakdown.innerHTML = categories
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .map(category => {
                const productsHtml = category.products
                    .map(p => `
                        <div class="product-item">
                            <div class="item-name">${p.name}</div>
                            <div class="item-sku">${p.sku}</div>
                            <div class="item-stock">Stock: ${p.stock_quantity}</div>
                        </div>
                    `)
                    .join('');

                return `
                    <div class="category-card-group">
                        <div class="category-header">
                            <h4>${category.name}</h4>
                            <span class="product-count">${category.productCount} products</span>
                        </div>
                        <div class="category-stats">
                            <div class="stat">
                                <span class="stat-label">Revenue</span>
                                <span class="stat-value">GHS ${category.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Profit</span>
                                <span class="stat-value">GHS ${category.totalProfit.toFixed(2)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">In Stock</span>
                                <span class="stat-value">${category.totalStock} units</span>
                            </div>
                        </div>
                        <div class="products-list">
                            ${productsHtml}
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    viewCategoryDetails(categoryName) {
        this.showNotification(`Viewing details for: ${categoryName}`, 'info');
        // This can be extended for more detailed category view
    }

    showCategoryAnalyticsEmpty() {
        document.getElementById('categoryTableBody').innerHTML = `
            <tr class="no-data-row">
                <td colspan="8">
                    <div class="no-data-message">
                        <i class="fas fa-inbox"></i>
                        <p>No categories with data yet</p>
                        <small>Add products with categories to get started</small>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('categoryBreakdown').innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-inbox"></i>
                <p>Add products with categories to see breakdown</p>
            </div>
        `;
    }

    // Inventory tracking methods
    initializeInventoryTracking() {
        this.updateInventoryOverview();
        this.loadLowStockAlerts();
        this.loadInventoryTransactions();
        this.loadInventoryPerformance();
        this.renderInventoryMovementChart();
    }

    updateInventoryOverview() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        let totalValue = 0;
        let revenuePotential = 0;
        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        products.forEach(product => {
            const quantity = product.stock_quantity || 0;
            const costPrice = parseFloat(product.cost_price) || 0;
            const sellingPrice = parseFloat(product.selling_price) || 0;

            totalValue += quantity * costPrice;
            revenuePotential += quantity * sellingPrice;

            if (quantity > 10) {
                inStock++;
            } else if (quantity > 0) {
                lowStock++;
            } else {
                outOfStock++;
            }
        });

        // Update inventory overview cards
        if (document.getElementById('totalInventoryValue')) {
            document.getElementById('totalInventoryValue').textContent = `GHS ${totalValue.toFixed(2)}`;
        }
        if (document.getElementById('revenuePotential')) {
            document.getElementById('revenuePotential').textContent = `GHS ${revenuePotential.toFixed(2)}`;
        }
        if (document.getElementById('inStockCount')) {
            document.getElementById('inStockCount').textContent = inStock;
        }
        // Low stock card removed - now only shown in notifications
        if (document.getElementById('outOfStockCount')) {
            document.getElementById('outOfStockCount').textContent = outOfStock;
        }

        // Calculate turnover rate
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const currentMonth = new Date();
        const monthlyRevenue = sales
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate.getMonth() === currentMonth.getMonth() && 
                       saleDate.getFullYear() === currentMonth.getFullYear();
            })
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

        const turnoverRate = totalValue > 0 ? (monthlyRevenue / totalValue).toFixed(1) : '0.0';
        if (document.getElementById('turnoverRate')) {
            document.getElementById('turnoverRate').textContent = `${turnoverRate}x`;
        }
    }

    loadLowStockAlerts() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        const lowStockProducts = products.filter(product => {
            const stock = product.stock_quantity || 0;
            const reorderLevel = product.reorder_level || product.reorderLevel || product.min_stock_level || 5;
            return stock <= reorderLevel;
        });

        const tbody = document.getElementById('lowStockTable');
        if (!tbody) return;

        if (lowStockProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No low stock items</td></tr>';
            return;
        }

        tbody.innerHTML = lowStockProducts.map(product => `
            <tr>
                <td>
                    <div class="product-info">
                        <span class="product-name">${product.name}</span>
                        <small class="product-description">${product.description || ''}</small>
                    </div>
                </td>
                <td>
                    <span class="stock-count ${product.stock_quantity <= 5 ? 'out' : 'low'}">${product.stock_quantity}</span>
                </td>
                <td>${product.reorder_level || product.reorderLevel || product.min_stock_level || 5}</td>
                <td>-</td>
                <td>
                    <button class="btn-primary" onclick="
                        console.log('Reorder button clicked'); 
                        try {
                            showSection('products'); 
                            setTimeout(() => { 
                                if (typeof openAddProductModal === 'function') {
                                    openAddProductModal();
                                } else if (typeof openModal === 'function') {
                                    openModal('addProductModal');
                                } else {
                                    console.error('Modal functions not found');
                                }
                            }, 100);
                        } catch(e) { 
                            console.error('Reorder error:', e); 
                        }
                    ">
                        <i class="fas fa-shopping-cart"></i> Reorder
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Clean up invalid inventory data and regenerate if needed
    cleanAndRegenerateInventoryData() {
        console.log('🧹 Cleaning up inventory data...');
        
        // Get all transactions
        let transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        const originalCount = transactions.length;
        
        // Filter out invalid transactions
        transactions = transactions.filter(transaction => {
            const isValid = transaction && 
                           transaction.timestamp && 
                           transaction.product && 
                           transaction.type &&
                           transaction.quantity !== undefined &&
                           transaction.newStock !== undefined;
            
            if (!isValid) {
                console.log('🗑️ Removing invalid transaction:', transaction);
            }
            return isValid;
        });
        
        // Update localStorage with cleaned transactions
        localStorage.setItem('inventoryTransactions', JSON.stringify(transactions));
        
        if (originalCount !== transactions.length) {
            console.log(`✅ Cleaned up ${originalCount - transactions.length} invalid transactions`);
            this.showNotification(`Cleaned up ${originalCount - transactions.length} invalid transactions`, 'success');
        }
        
        // If we have products but no valid transactions, create sample data
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        if (products.length > 0 && transactions.length === 0) {
            console.log('📦 Regenerating sample inventory transactions...');
            this.createSampleInventoryTransactions();
            this.showNotification('Generated sample inventory data', 'info');
        }
        
        // Refresh the display
        this.loadInventoryTransactions();
    }

    loadInventoryTransactions() {
        let transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        const tbody = document.getElementById('inventoryTransactionsTable');
        if (!tbody) return;

        // Clean up any invalid transactions
        transactions = transactions.filter(transaction => {
            return transaction && 
                   transaction.timestamp && 
                   transaction.product && 
                   transaction.type &&
                   transaction.quantity !== undefined &&
                   transaction.newStock !== undefined;
        });

        // Update localStorage with cleaned transactions
        if (transactions.length !== JSON.parse(localStorage.getItem('inventoryTransactions') || '[]').length) {
            localStorage.setItem('inventoryTransactions', JSON.stringify(transactions));
            console.log('Cleaned up invalid transactions');
        }

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No transactions yet</td></tr>';
            return;
        }

        // Sort transactions by timestamp (newest first) and take latest 10
        const sortedTransactions = transactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        tbody.innerHTML = sortedTransactions.map(transaction => {
            // Safe date handling
            let displayDate = 'Invalid Date';
            try {
                const date = new Date(transaction.timestamp);
                if (!isNaN(date.getTime())) {
                    displayDate = date.toLocaleDateString();
                }
            } catch (e) {
                console.warn('Invalid date in transaction:', transaction.timestamp);
            }

            // Safe data extraction with fallbacks
            const productName = transaction.product || transaction.productName || 'Unknown Product';
            const transactionType = transaction.type || 'unknown';
            const quantity = transaction.quantity !== undefined && transaction.quantity !== null ? transaction.quantity : 0;
            const quantityClass = quantity > 0 ? 'positive' : 'negative';
            const balance = transaction.newStock !== undefined && transaction.newStock !== null ? transaction.newStock : 'N/A';
            const reference = transaction.reference || 'No Reference';

            return `
                <tr>
                    <td>${displayDate}</td>
                    <td>${productName}</td>
                    <td>
                        <span class="transaction-type ${transactionType}">${transactionType.toUpperCase()}</span>
                    </td>
                    <td>
                        <span class="stock-change ${quantityClass}">
                            ${quantity > 0 ? '+' : ''}${quantity}
                        </span>
                    </td>
                    <td>${balance}</td>
                    <td>${reference}</td>
                </tr>
            `;
        }).join('');
    }

    loadInventoryPerformance() {
        const bestPerformersEl = document.getElementById('bestPerformers');
        const slowMoversEl = document.getElementById('slowMovers');
        
        // Calculate sales velocity for each product
        const productSalesData = this.calculateProductSalesVelocity();
        
        if (bestPerformersEl) {
            if (productSalesData.best.length > 0) {
                bestPerformersEl.innerHTML = productSalesData.best.map(item => `
                    <div class="performance-item">
                        <div class="performance-info">
                            <span class="performance-name">${item.name}</span>
                            <span class="performance-metric">${item.quantity} units sold</span>
                        </div>
                        <div class="performance-badge good">${item.percentage}%</div>
                    </div>
                `).join('');
            } else {
                bestPerformersEl.innerHTML = `
                    <div class="performance-item">
                        <div class="performance-info">
                            <span class="performance-name">No data available</span>
                            <span class="performance-metric">Add products and record sales to see data</span>
                        </div>
                        <div class="performance-badge good">-</div>
                    </div>
                `;
            }
        }
        
        if (slowMoversEl) {
            if (productSalesData.slow.length > 0) {
                slowMoversEl.innerHTML = productSalesData.slow.map(item => `
                    <div class="performance-item">
                        <div class="performance-info">
                            <span class="performance-name">${item.name}</span>
                            <span class="performance-metric">${item.quantity} units sold</span>
                        </div>
                        <div class="performance-badge slow">${item.percentage}%</div>
                    </div>
                `).join('');
            } else {
                slowMoversEl.innerHTML = `
                    <div class="performance-item">
                        <div class="performance-info">
                            <span class="performance-name">No data available</span>
                            <span class="performance-metric">Add products and record sales to see data</span>
                        </div>
                        <div class="performance-badge slow">-</div>
                    </div>
                `;
            }
        }
    }

    calculateProductSalesVelocity() {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        
        // Calculate total quantity sold for each product
        const salesByProduct = {};
        
        sales.forEach(sale => {
            // Handle both 'products' and 'items' keys for compatibility
            const saleItems = sale.products || sale.items || [];
            if (Array.isArray(saleItems)) {
                saleItems.forEach(item => {
                    const productId = item.id || item.product_id;
                    if (productId) {
                        if (!salesByProduct[productId]) {
                            salesByProduct[productId] = { quantity: 0, name: '' };
                        }
                        salesByProduct[productId].quantity += (item.quantity || 0);
                    }
                });
            }
        });
        
        // Map product names
        products.forEach(product => {
            if (salesByProduct[product.id]) {
                salesByProduct[product.id].name = product.name;
            }
        });
        
        // Convert to array and sort by sales volume
        const sortedProducts = Object.values(salesByProduct)
            .filter(item => item.name && item.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity);
        
        // Calculate total for percentage
        const totalQuantity = sortedProducts.reduce((sum, item) => sum + item.quantity, 0);
        
        // Add percentages
        const productsWithPercentage = sortedProducts.map(item => ({
            ...item,
            percentage: totalQuantity > 0 ? Math.round((item.quantity / totalQuantity) * 100) : 0
        }));
        
        // Get best 5 and slow 5
        const best = productsWithPercentage.slice(0, 5);
        const slow = productsWithPercentage.slice(-5).reverse();
        
        return { best, slow };
    }

    renderInventoryMovementChart() {
        const ctx = document.getElementById('inventoryMovementChart');
        if (!ctx) return;

        // Simple overview - show total products in stock vs low stock
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => {
            const stock = p.stock_quantity || 0;
            const reorderLevel = p.min_stock_level || 5;
            return stock <= reorderLevel;
        }).length;
        
        const goodStockProducts = totalProducts - lowStockProducts;
        const hasData = totalProducts > 0;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: hasData ? ['Good Stock', 'Low Stock'] : ['No Products'],
                datasets: [{
                    data: hasData ? [goodStockProducts, lowStockProducts] : [1],
                    backgroundColor: hasData ? ['#10b981', '#f59e0b'] : ['#f3f4f6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: hasData,
                        callbacks: {
                            label: function(context) {
                                if (context.dataIndex === 0 && hasData) {
                                    return `Good Stock: ${goodStockProducts} products`;
                                } else if (context.dataIndex === 1 && hasData) {
                                    return `Low Stock: ${lowStockProducts} products`;
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
        
        // Add center text
        const centerText = hasData ? 
            `${totalProducts}\nProducts` : 
            'Add\nProducts';
            
        if (ctx.parentElement) {
            const existingLabel = ctx.parentElement.querySelector('.chart-center-text');
            if (existingLabel) existingLabel.remove();
            
            const centerLabel = document.createElement('div');
            centerLabel.className = 'chart-center-text';
            centerLabel.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                font-weight: 600;
                color: ${hasData ? '#10b981' : '#6b7280'};
                pointer-events: none;
                line-height: 1.2;
                font-size: ${hasData ? '1.2rem' : '0.9rem'};
            `;
            centerLabel.innerHTML = centerText.replace('\n', '<br>');
            ctx.parentElement.style.position = 'relative';
            ctx.parentElement.appendChild(centerLabel);
        }
    }

    refreshInventory() {
        this.initializeInventoryTracking();
        this.showNotification('Inventory data refreshed', 'success');
    }

    // Update product stats cards with real data
    updateProductStats(products) {
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => {
            const stock = parseInt(p.stock_quantity) || 0;
            const reorderLevel = this.getReorderLevel(p);
            return stock <= reorderLevel;
        }).length;
        
        const totalValue = products.reduce((sum, p) => {
            const stock = parseInt(p.stock_quantity) || 0;
            const costPrice = parseFloat(p.cost_price);
            
            // Validate both stock and cost price are positive numbers
            if (stock >= 0 && !isNaN(costPrice) && costPrice >= 0) {
                return sum + (costPrice * stock);
            }
            return sum;
        }, 0);

        // Get unique categories
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        const categoriesCount = categories.length;

        // Update the stat cards
        const totalProductsEl = document.getElementById('totalProductsCount');
        const inventoryValueEl = document.getElementById('inventoryTotalValue');
        const categoriesCountEl = document.getElementById('categoriesCount');

        if (totalProductsEl) {
            totalProductsEl.textContent = totalProducts.toLocaleString();
        }
        
        // Low stock card removed - now only shown in notifications
        
        if (inventoryValueEl) {
            inventoryValueEl.textContent = `GHS ${totalValue.toFixed(2)}`;
        }
        
        if (categoriesCountEl) {
            categoriesCountEl.textContent = categoriesCount.toString();
        }

        // Update indicators
        const productsIndicator = document.getElementById('productsChangeIndicator');
        const lowStockIndicator = document.getElementById('lowStockIndicator');
        const inventoryIndicator = document.getElementById('inventoryValueIndicator');
        const categoriesIndicator = document.getElementById('categoriesIndicator');

        if (productsIndicator) {
            if (totalProducts === 0) {
                productsIndicator.textContent = 'Add your first product';
                productsIndicator.className = 'stat-change neutral';
            } else {
                productsIndicator.textContent = `${totalProducts} products in inventory`;
                productsIndicator.className = 'stat-change positive';
            }
        }

        if (lowStockIndicator) {
            if (lowStockProducts === 0) {
                lowStockIndicator.textContent = 'All items in stock';
                lowStockIndicator.className = 'stat-change positive';
            } else {
                lowStockIndicator.textContent = 'Needs attention';
                lowStockIndicator.className = 'stat-change negative';
            }
        }

        if (inventoryIndicator) {
            if (totalValue === 0) {
                inventoryIndicator.textContent = 'Add products to calculate';
                inventoryIndicator.className = 'stat-change neutral';
            } else {
                inventoryIndicator.textContent = 'Total inventory cost';
                inventoryIndicator.className = 'stat-change positive';
            }
        }

        if (categoriesIndicator) {
            if (categoriesCount === 0) {
                categoriesIndicator.textContent = 'No categories';
                categoriesIndicator.className = 'stat-change neutral';
            } else {
                categoriesIndicator.textContent = `${categoriesCount} active categories`;
                categoriesIndicator.className = 'stat-change positive';
            }
        }
    }

    // Clear all data function
    clearAllData() {
        console.log('🗑️ clearAllData() function called');
        console.log('🔍 Current state - isPerformingDataClear:', this.isPerformingDataClear);
        console.log('🔍 Current state - currentClearDataModal:', !!this.currentClearDataModal);
        console.log('🔍 Current state - window.clearDataInProgress:', window.clearDataInProgress);
        
        // Prevent multiple modal calls
        if (this.isPerformingDataClear || this.currentClearDataModal) {
            console.log('🚫 Clear data operation already in progress');
            console.log('💡 TIP: If stuck, run window.businessManager.resetClearDataFlags() in console');
            return;
        }
        
        // Reset global flag to ensure it doesn't interfere
        window.clearDataInProgress = false;
        
        // Create custom confirmation modal
        this.showDataClearConfirmation();
    }

    // Reset function for stuck flags
    resetClearDataFlags() {
        console.log('🔄 Resetting clear data flags...');
        this.isPerformingDataClear = false;
        if (this.currentClearDataModal) {
            this.currentClearDataModal.remove();
            this.currentClearDataModal = null;
        }
        window.clearDataInProgress = false;
        console.log('✅ All clear data flags reset');
    }

    // Custom confirmation modal for data clearing
    showDataClearConfirmation() {
        // Prevent multiple modals from opening
        if (this.currentClearDataModal) {
            console.log('Clear data modal already open, ignoring request');
            return;
        }

        // Check for any existing modals and remove them
        const existingModals = document.querySelectorAll('.modal-backdrop.danger-backdrop');
        existingModals.forEach(modal => modal.remove());

        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop danger-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'danger-confirmation-modal';
        modal.style.cssText = `
            background: var(--card-background);
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 2px solid var(--danger-color);
            transform: scale(0.9);
            animation: modalSlideIn 0.3s ease forwards;
        `;

        modal.innerHTML = `
            <div class="danger-header" style="display: flex; align-items: center; margin-bottom: 1.5rem;">
                <div style="width: 48px; height: 48px; background: var(--danger-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                    <i class="fas fa-exclamation-triangle" style="color: white; font-size: 1.5rem;"></i>
                </div>
                <div>
                    <h3 style="margin: 0; color: var(--danger-color); font-size: 1.5rem; font-weight: 700;">Danger Zone</h3>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">This action cannot be undone</p>
                </div>
            </div>
            
            <div class="danger-content" style="margin-bottom: 2rem;">
                <h4 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.25rem; font-weight: 600;">Delete All Business Data</h4>
                <p style="margin: 0 0 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                    This will permanently delete <strong>ALL</strong> your business data including:
                </p>
                <ul style="margin: 0 0 1rem 0; padding-left: 1.5rem; color: var(--text-secondary); line-height: 1.6;">
                    <li>All products and inventory</li>
                    <li>Sales records and transactions</li>
                    <li>Purchase history</li>
                    <li>Settings and preferences</li>
                </ul>
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger-color); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                    <p style="margin: 0; color: var(--danger-color); font-weight: 600;">
                        ⚠️ This action is irreversible and cannot be undone.
                    </p>
                </div>
            </div>
            
            <div class="danger-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="modalCancelBtn" style="
                    padding: 0.75rem 1.5rem;
                    background: var(--card-background);
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">Cancel</button>
                <button id="modalDeleteBtn" style="
                    padding: 0.75rem 1.5rem;
                    background: var(--danger-color);
                    border: 2px solid var(--danger-color);
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    <i class="fas fa-trash" style="margin-right: 0.5rem;"></i>
                    Delete Everything
                </button>
            </div>
        `;

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalSlideIn {
                from { transform: scale(0.9) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            #modalCancelBtn:hover {
                background: var(--hover-color) !important;
                transform: translateY(-1px);
            }
            #modalDeleteBtn:hover {
                background: #dc2626 !important;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }
        `;
        document.head.appendChild(style);

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // Store reference for cleanup
        this.currentClearDataModal = backdrop;

        // Handle button clicks with more robust event handling
        const cancelBtn = document.getElementById('modalCancelBtn');
        const confirmBtn = document.getElementById('modalDeleteBtn');

        console.log('🔍 Modal buttons found:', { cancel: !!cancelBtn, confirm: !!confirmBtn });

        if (cancelBtn) {
            console.log('✅ Adding cancel button event listener');
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚫 User cancelled data clearing');
                // Reset progress flag
                window.clearDataInProgress = false;
                this.closeClearDataModal();
            });
            
            // Also add onclick directly as backup
            cancelBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚫 User cancelled data clearing (onclick)');
                window.clearDataInProgress = false;
                this.closeClearDataModal();
            };
        } else {
            console.error('❌ Cancel button not found!');
        }

        if (confirmBtn) {
            console.log('✅ Confirm button found, adding event listener');
            confirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 CONFIRM BUTTON CLICKED - User confirmed data clearing');
                
                // Ensure we're not already clearing data
                if (this.isPerformingDataClear) {
                    console.log('🚫 Data clearing already in progress');
                    return;
                }
                
                // Close modal immediately, then perform clear
                this.closeClearDataModal();
                // Use timeout to ensure modal is closed before clearing
                setTimeout(() => {
                    console.log('🔥 About to call performDataClear()');
                    this.performDataClear();
                }, 200);
            });
            
            // Also add onclick directly as backup
            confirmBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 CONFIRM BUTTON CLICKED (onclick) - User confirmed data clearing');
                
                if (this.isPerformingDataClear) {
                    console.log('🚫 Data clearing already in progress');
                    return;
                }
                
                this.closeClearDataModal();
                setTimeout(() => {
                    console.log('🔥 About to call performDataClear()');
                    this.performDataClear();
                }, 200);
            };
            
            console.log('✅ Event listeners added to confirm button');
        } else {
            console.error('❌ Confirm button not found!');
        }

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                console.log('User cancelled data clearing via backdrop click');
                this.closeClearDataModal();
            }
        });

        // Add keyboard support (ESC to cancel)
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                console.log('User cancelled data clearing via ESC key');
                this.closeClearDataModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // Add fadeOut animation
        style.textContent += `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
    }

    // Helper method to properly close the modal
    closeClearDataModal() {
        console.log('🔒 Closing clear data modal...');
        
        // Reset all flags
        window.clearDataInProgress = false;
        
        if (this.currentClearDataModal) {
            this.currentClearDataModal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.currentClearDataModal && this.currentClearDataModal.parentNode) {
                    this.currentClearDataModal.remove();
                }
                this.currentClearDataModal = null;
                console.log('✅ Modal removed successfully');
            }, 300);
        } else {
            console.log('⚠️ No modal to close');
        }
    }

    // Perform the actual data clearing
    performDataClear() {
        console.log('🔥 performDataClear() method called');
        
        // Prevent multiple clear operations
        if (this.isPerformingDataClear) {
            console.log('Data clear already in progress, ignoring request');
            return;
        }

        this.isPerformingDataClear = true;
        console.log('🔥 Starting data clearing process...');
        
        // Show progress notification
        this.showNotification('🗑️ Clearing all data...', 'info');
        
        try {
            // Ensure modal is closed
            if (this.currentClearDataModal) {
                console.log('🔥 Removing current modal');
                this.currentClearDataModal.remove();
                this.currentClearDataModal = null;
            }

            console.log('🔥 About to clear localStorage items...');
            
            // Get all keys to ensure we clear everything J'MONIC related
            const allKeys = Object.keys(localStorage);
            const jmonicKeys = allKeys.filter(key => key.startsWith('jmonic_') || key.includes('jmonic'));
            
            console.log('🔥 Found J\'MONIC keys to clear:', jmonicKeys);
            
            // Clear all localStorage data (comprehensive clearing)
            localStorage.removeItem('jmonic_products');
            localStorage.removeItem('jmonic_sales'); 
            localStorage.removeItem('jmonic_purchases');
            localStorage.removeItem('inventoryTransactions');
            localStorage.removeItem('jmonic_settings');
            localStorage.removeItem('jmonic_theme');
            localStorage.removeItem('jmonic_notifications');
            localStorage.removeItem('jmonic_analytics');
            
            // Clear any additional J'MONIC keys that might exist
            jmonicKeys.forEach(key => {
                console.log(`🔥 Clearing additional key: ${key}`);
                localStorage.removeItem(key);
            });
            
            console.log('✅ All data cleared from localStorage');
            console.log('🔥 About to show success notification...');
            
            // Show success notification
            this.showNotification('✅ All data has been cleared successfully! The page will refresh in 3 seconds.', 'success');
            
            // Reset flag immediately after successful clearing
            this.isPerformingDataClear = false;
            
            console.log('🔥 Setting timeout for page reload...');
            
            // Show countdown
            let countdown = 3;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    this.showNotification(`✅ Data cleared! Refreshing in ${countdown} seconds...`, 'success');
                } else {
                    clearInterval(countdownInterval);
                }
            }, 1000);
            
            // Refresh the current page to show empty state after countdown
            setTimeout(() => {
                console.log('🔥 Reloading page now...');
                location.reload();
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            this.showNotification('❌ Error clearing data. Please try again.', 'error');
            this.isPerformingDataClear = false; // Reset flag on error
        }
    }

    // Inventory Reports & Transaction Log Functions
    updateInventoryReports() {
        this.updateInventoryStats();
        this.updateTransactionLog();
    }

    updateInventoryStats() {
        const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Calculate total stock left and product count
        let totalStockLeft = 0;
        let productsCount = 0;
        
        // Count total stock across all products
        products.forEach(product => {
            totalStockLeft += parseInt(product.stock_quantity) || 0;
            productsCount += 1;
        });
        
        // Get stock alerts (low stock products)
        const lowStockProducts = products.filter(p => {
            const stock = p.stock_quantity || 0;
            const reorderLevel = p.reorder_level || p.reorderLevel || p.min_stock_level || 5;
            return stock <= reorderLevel;
        });
        
        // Get total transactions from localStorage
        const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        const totalTransactions = transactions.length;
        
        // Update UI elements
        const totalStockLeftElement = document.getElementById('totalStockLeft');
        const productsCountElement = document.getElementById('productsCount');
        const totalTransactionsElement = document.getElementById('totalTransactions');
        const stockAlertsElement = document.getElementById('stockAlerts');
        
        if (totalStockLeftElement) totalStockLeftElement.textContent = totalStockLeft.toLocaleString();
        if (productsCountElement) productsCountElement.textContent = productsCount;
        if (totalTransactionsElement) totalTransactionsElement.textContent = totalTransactions;
        if (stockAlertsElement) stockAlertsElement.textContent = lowStockProducts.length;
        
        // Update stock by products table
        this.updateStockByProductsTable(products);
    }
    
    updateStockByProductsTable(products) {
        const tableBody = document.getElementById('stockByProductsTable');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = '<div class="table-row empty"><span>No products found</span></div>';
            return;
        }
        
        // Sort products by stock quantity (highest first)
        const sortedProducts = [...products].sort((a, b) => 
            (b.stock_quantity || 0) - (a.stock_quantity || 0)
        );
        
        sortedProducts.forEach(product => {
            const stock = parseInt(product.stock_quantity) || 0;
            const reorderLevel = parseInt(product.reorder_level) || 5;
            const costPrice = parseFloat(product.cost_price) || 0;
            const inventoryValue = stock * costPrice;
            
            // Determine status
            let status = 'In Stock';
            let statusClass = 'status-in-stock';
            if (stock === 0) {
                status = 'Out of Stock';
                statusClass = 'status-out-of-stock';
            } else if (stock <= reorderLevel) {
                status = 'Low Stock';
                statusClass = 'status-low-stock';
            }
            
            const row = document.createElement('div');
            row.className = 'table-row';
            row.innerHTML = `
                <div class="col-product">
                    <div class="product-name">${product.name || 'N/A'}</div>
                </div>
                <div class="col-sku">${product.sku || 'N/A'}</div>
                <div class="col-stock">
                    <span class="stock-badge">${stock}</span>
                </div>
                <div class="col-value">GHS ${inventoryValue.toFixed(2)}</div>
                <div class="col-status">
                    <span class="status-badge ${statusClass}">${status}</span>
                </div>
            `;
            tableBody.appendChild(row);
        });
    }

    updateTransactionLog() {
        const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        
        console.log('Transaction Log Debug:', { transactions: transactions.length });
        
        // Use only the stored inventory transactions to avoid duplicates
        // These are already created when sales are made via logInventoryTransaction()
        let allTransactions = [...transactions];
        
        // Apply current filter if set
        if (this.currentTransactionFilter && this.currentTransactionFilter !== 'all') {
            allTransactions = allTransactions.filter(transaction => 
                transaction.type === this.currentTransactionFilter
            );
            console.log(`Filtered to ${this.currentTransactionFilter}: ${allTransactions.length} transactions`);
        }
        
        // Remove duplicates based on reference number and timestamp
        const uniqueTransactions = [];
        const seen = new Set();
        
        allTransactions.forEach(transaction => {
            const key = `${transaction.reference}-${transaction.timestamp}-${transaction.type}-${transaction.quantity}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueTransactions.push(transaction);
            } else {
                console.log('Duplicate transaction removed:', transaction);
            }
        });
        
        allTransactions = uniqueTransactions;
        
        // If we removed duplicates, update the stored transactions
        if (transactions.length !== allTransactions.length) {
            localStorage.setItem('inventoryTransactions', JSON.stringify(allTransactions));
            console.log(`Cleaned up ${transactions.length - allTransactions.length} duplicate transactions`);
        }
        
        // Sort by timestamp (newest first)
        allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const tbody = document.getElementById('transactionLogBody');
        if (!tbody) return;
        
        if (allTransactions.length === 0) {
            tbody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="7">
                        <div class="no-data-message">
                            <i class="fas fa-inbox"></i>
                            <p>No transactions recorded yet</p>
                            <small>Transaction history will appear here as you make inventory changes</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = allTransactions.slice(0, 50).map(transaction => {
            console.log('Rendering transaction:', transaction);
            
            // Safe date handling
            let displayDate = 'Invalid Date';
            try {
                const date = new Date(transaction.timestamp);
                if (!isNaN(date.getTime())) {
                    displayDate = date.toLocaleString();
                }
            } catch (e) {
                console.error('Date parsing error:', e, transaction.timestamp);
            }
            
            const productName = transaction.product || 'Unknown Product';
            const transactionType = transaction.type || 'unknown';
            const typeClass = this.getTransactionTypeClass(transactionType);
            const quantity = transaction.quantity !== undefined && transaction.quantity !== null ? transaction.quantity : 0;
            const quantityClass = quantity > 0 ? 'positive' : 'negative';
            const previousStock = transaction.previousStock !== undefined && transaction.previousStock !== null ? transaction.previousStock : 'N/A';
            const newStock = transaction.newStock !== undefined && transaction.newStock !== null ? transaction.newStock : 'N/A';
            const reference = transaction.reference || 'No Reference';
            const recordedBy = transaction.recorded_by || 'System';
            
            return `
                <tr>
                    <td>${displayDate}</td>
                    <td>${productName}</td>
                    <td><span class="transaction-type ${typeClass}">${transactionType.toUpperCase()}</span></td>
                    <td><span class="quantity ${quantityClass}">${quantity > 0 ? '+' : ''}${quantity}</span></td>
                    <td>${previousStock}</td>
                    <td>${newStock}</td>
                    <td>${reference}</td>
                    <td class="recorded-by-cell">${recordedBy}</td>
                </tr>
            `;
        }).join('');
    }

    getTransactionTypeClass(type) {
        const typeClasses = {
            'sale': 'type-sale',
            'purchase': 'type-purchase',
            'adjustment': 'type-adjustment',
            'return': 'type-return',
            'transfer': 'type-transfer'
        };
        return typeClasses[type] || 'type-other';
    }

    filterTransactions(filterType) {
        // This function will filter the transaction log
        this.currentTransactionFilter = filterType;
        this.updateTransactionLog();
    }

    refreshTransactionLog() {
        this.updateTransactionLog();
        this.showNotification('Transaction log refreshed', 'success');
    }

    exportTransactionLog() {
        const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        
        if (transactions.length === 0) {
            this.showNotification('No transaction data to export', 'warning');
            return;
        }
        
        // Apply current filter if set
        let filteredTransactions = [...transactions];
        if (this.currentTransactionFilter && this.currentTransactionFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => 
                t.type === this.currentTransactionFilter
            );
        }
        
        if (filteredTransactions.length === 0) {
            this.showNotification('No transactions matching the current filter', 'warning');
            return;
        }
        
        // Sort by timestamp (newest first)
        filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Create CSV content with all fields
        let csvContent = "Timestamp,Product,Type,Quantity,Previous Stock,New Stock,Reference,Recorded By\n";
        
        // Add transaction data
        filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.timestamp);
            const recordedBy = transaction.recorded_by || 'System';
            csvContent += `"${date.toLocaleString()}","${transaction.product || ''}","${transaction.type || ''}","${transaction.quantity || ''}","${transaction.previousStock || ''}","${transaction.newStock || ''}","${transaction.reference || ''}","${recordedBy}"\n`;
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filterStr = this.currentTransactionFilter && this.currentTransactionFilter !== 'all' ? `_${this.currentTransactionFilter}` : '';
        a.download = `jmonic_transactions_${dateStr}_${timeStr}${filterStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification(`Transaction log exported successfully (${filteredTransactions.length} records)`, 'success');
    }

    // Export transaction log with detailed summary
    exportTransactionLogWithSummary() {
        const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        
        if (transactions.length === 0) {
            this.showNotification('No transaction data to export', 'warning');
            return;
        }
        
        // Apply current filter if set
        let filteredTransactions = [...transactions];
        if (this.currentTransactionFilter && this.currentTransactionFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => 
                t.type === this.currentTransactionFilter
            );
        }
        
        // Sort by timestamp (newest first)
        filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Calculate summary statistics
        const summaryStats = {
            totalTransactions: filteredTransactions.length,
            byType: {},
            byUser: {},
            totalQuantity: 0,
            dateRange: filteredTransactions.length > 0 ? {
                start: filteredTransactions[filteredTransactions.length - 1].timestamp,
                end: filteredTransactions[0].timestamp
            } : null
        };
        
        filteredTransactions.forEach(t => {
            // Count by type
            summaryStats.byType[t.type] = (summaryStats.byType[t.type] || 0) + 1;
            
            // Count by user
            const user = t.recorded_by || 'System';
            summaryStats.byUser[user] = (summaryStats.byUser[user] || 0) + 1;
            
            // Sum quantities
            summaryStats.totalQuantity += Math.abs(t.quantity || 0);
        });
        
        // Create CSV content with summary
        let csvContent = "GEL-STOCK - TRANSACTION LOG EXPORT\n";
        csvContent += `Export Date: ${new Date().toLocaleString()}\n`;
        csvContent += `Total Records: ${summaryStats.totalTransactions}\n`;
        csvContent += "\n";
        
        // Add summary by type
        csvContent += "SUMMARY BY TYPE\n";
        Object.keys(summaryStats.byType).forEach(type => {
            csvContent += `${type.toUpperCase()}: ${summaryStats.byType[type]}\n`;
        });
        csvContent += "\n";
        
        // Add summary by user
        csvContent += "SUMMARY BY USER\n";
        Object.keys(summaryStats.byUser).forEach(user => {
            csvContent += `${user}: ${summaryStats.byUser[user]} transactions\n`;
        });
        csvContent += "\n\n";
        
        // Add detailed transaction data
        csvContent += "DETAILED TRANSACTIONS\n";
        csvContent += "Timestamp,Product,Type,Quantity,Previous Stock,New Stock,Reference,Recorded By\n";
        
        filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.timestamp);
            const recordedBy = transaction.recorded_by || 'System';
            csvContent += `"${date.toLocaleString()}","${transaction.product || ''}","${transaction.type || ''}","${transaction.quantity || ''}","${transaction.previousStock || ''}","${transaction.newStock || ''}","${transaction.reference || ''}","${recordedBy}"\n`;
        });
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const filterStr = this.currentTransactionFilter && this.currentTransactionFilter !== 'all' ? `_${this.currentTransactionFilter}` : '';
        a.download = `jmonic_transactions_detailed_${dateStr}_${timeStr}${filterStr}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification(`Detailed export completed (${filteredTransactions.length} records with summary)`, 'success');
    }

    // Inventory Transaction Management
    logInventoryTransaction(productId, productName, type, quantity, previousStock, newStock, reference = '') {
        const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        
        // Check for duplicates based on reference and timestamp (within 1 second)
        const now = new Date();
        const duplicateCheck = transactions.find(t => 
            t.reference === reference && 
            t.product_id == productId && 
            t.type === type &&
            t.quantity == quantity &&
            Math.abs(new Date(t.timestamp) - now) < 1000 // Within 1 second
        );
        
        if (duplicateCheck) {
            console.log('Duplicate transaction prevented:', reference);
            return duplicateCheck;
        }
        
        // Get current user's name
        const recordedBy = this.currentUser ? (this.currentUser.fullName || this.currentUser.name || 'System User') : 'System User';
        
        const transaction = {
            id: Date.now() + Math.random(),
            timestamp: now.toISOString(),
            product_id: productId,
            product: productName,
            type: type, // 'purchase', 'sale', 'adjustment', 'return', 'transfer'
            quantity: quantity,
            previousStock: previousStock,
            newStock: newStock,
            reference: reference,
            recorded_by: recordedBy
        };
        
        transactions.push(transaction);
        localStorage.setItem('inventoryTransactions', JSON.stringify(transactions));
        
        console.log('Inventory transaction logged:', transaction);
        return transaction;
    }

    // Create sample inventory transactions for demonstration
    createSampleInventoryTransactions() {
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        if (products.length === 0) return;

        const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
        if (transactions.length > 0) return; // Don't create duplicates

        // Create some sample transactions for the past few days
        const today = new Date();
        
        products.forEach((product, index) => {
            const currentStock = product.stock_quantity || 0;
            
            // Add a purchase transaction (stock in) 3 days ago
            const purchaseDate = new Date(today);
            purchaseDate.setDate(today.getDate() - 3);
            const purchaseQuantity = Math.floor(Math.random() * 20) + 10;
            
            this.logInventoryTransaction(
                product.id,
                product.name,
                'purchase',
                purchaseQuantity,
                Math.max(0, currentStock - purchaseQuantity),
                currentStock,
                `PO-${1000 + index}`
            );

            // Add a stock adjustment transaction 1 day ago (if needed)
            if (Math.random() > 0.7) {
                const adjustmentDate = new Date(today);
                adjustmentDate.setDate(today.getDate() - 1);
                const adjustmentQuantity = Math.floor(Math.random() * 10) - 5; // Can be positive or negative
                
                this.logInventoryTransaction(
                    product.id,
                    product.name,
                    'adjustment',
                    adjustmentQuantity,
                    currentStock,
                    currentStock + adjustmentQuantity,
                    'Stock count adjustment'
                );
            }
        });
        
        console.log('Sample inventory transactions created');
    }

    // Forecasting functions removed - revenue analytics removed from dashboard
    updateRevenueForecast() {}
    updatePaymentMethodsDisplay(dateFilter = null) {}
    calculateForecasts(sales) { return {}; }
    getMonthlyRevenue(sales, months) { return []; }
    getQuarterlyRevenue(sales, quarters) { return []; }
    getYearlyRevenue(sales, years) { return []; }
    calculateWeightedTrend(dataPoints) { return 0; }
    calculateWeightedAverage(dataPoints) { return 0; }
    getRecentSalesRevenue(sales, days) { return 0; }
    calculateAdvancedGrowthRate(monthlyRevenue) { return 0; }
    displayForecasts(forecasts) {}
    displayEmptyForecast() {}
    refreshForecasting() {}
    generateForecastReport() {}
    updateRevenueCharts(sales, products) {}
    initRevenueTrendChart(sales, products) {}
    initProductRevenueChart(sales) {}
    updateRevenueTables(sales, products) {}
    updateTopRevenueProductsTable(sales) {}
    updateRevenueByDateTable(sales, products) {}
    
    // Removed all forecasting and analytics code
}

// Initialize the system
let businessManager;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing business manager...');
    businessManager = new NaturalHairBusinessManager();
    
    // Initialize theme immediately
    initializeTheme();
    
    // Update user info in header after user is set
    updateUserHeaderInfo();
    
    initializeEventListeners();
    setupFormHandlers();
    
    // Export for global access after initialization
    window.businessManager = businessManager;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.editProduct = editProduct;
    window.toggleMobileSidebar = toggleMobileSidebar;
    window.closeMobileSidebar = closeMobileSidebar;
    window.navigateToSection = navigateToSection;
    window.toggleBusinessInfoMode = toggleBusinessInfoMode;
    window.saveBusinessInfo = saveBusinessInfo;
    window.toggleNotificationDropdown = toggleNotificationDropdown;
    window.handleExportClick = handleExportClick;
    window.exportProducts = exportProducts;
    window.exportRevenueData = exportRevenueData;
    
    // Refresh low stock data after initialization
    setTimeout(() => {
        if (businessManager) {
            businessManager.refreshLowStockData();
            businessManager.initializeHeaderDropdowns();
            businessManager.loadSettings(); // Activate settings immediately
            businessManager.updateInventoryReports();
            businessManager.updateRevenueForecast();
            
            // Initialize mobile navigation
            initializeMobileNavigation();
            
            // Log that forecasting is ready
            console.log('Revenue forecasting initialized and ready');
            
            // Test export function accessibility
            if (typeof businessManager.exportRecentSales === 'function') {
                console.log('✅ Export function is available and ready');
            } else {
                console.error('❌ Export function is not available');
            }
        }
    }, 1500);
    window.deleteProduct = deleteProduct;
    
    // Expose settings activation function globally
    window.showSettings = function() {
        if (businessManager) {
            businessManager.showSection('settings');
            console.log('Settings section opened');
        }
    };
    
    window.activateSettings = function() {
        if (businessManager) {
            businessManager.loadSettings();
            businessManager.initializeHeaderDropdowns();
            console.log('✅ Settings activated successfully!');
        }
    };
    
    // Expose delete functionality globally with multiple access points
    window.clearAllData = function() {
        console.log('🌐 Global clearAllData called');
        console.log('🔍 Current clearDataInProgress state:', window.clearDataInProgress);
        console.log('🔍 businessManager exists:', !!window.businessManager);
        
        // Prevent multiple simultaneous calls
        if (window.clearDataInProgress) {
            console.log('🚫 Clear data already in progress, ignoring call');
            console.log('💡 TIP: Run window.resetClearFlags() if stuck');
            return;
        }
        
        try {
            window.clearDataInProgress = true;
            console.log('🌐 Setting clearDataInProgress to true, proceeding...');
            
            if (window.businessManager) {
                console.log('🌐 Calling businessManager.clearAllData()');
                window.businessManager.clearAllData();
            } else {
                console.log('BusinessManager not available, using fallback');
                const confirmClear = confirm('⚠️ DANGER: This will permanently delete ALL your business data.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?');
                if (confirmClear) {
                    try {
                        localStorage.removeItem('jmonic_products');
                        localStorage.removeItem('jmonic_sales');
                        localStorage.removeItem('jmonic_purchases');
                        localStorage.removeItem('inventoryTransactions');
                        localStorage.removeItem('jmonic_settings');
                        
                        // Reset flag before reload
                        window.clearDataInProgress = false;
                        
                        alert('✅ All data cleared! Page will refresh.');
                        setTimeout(() => {
                            location.reload();
                        }, 500);
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ Error clearing data.');
                        window.clearDataInProgress = false; // Reset on error
                    }
                } else {
                    window.clearDataInProgress = false; // Reset on cancel
                }
            }
        } catch (error) {
            console.error('❌ Error in clearAllData:', error);
            window.clearDataInProgress = false;
            alert('❌ An error occurred while clearing data. Please try again.');
        }
    };
    
    // Additional global handlers for reliability
    window.deleteAllData = window.clearAllData; // Alternative name
    window.clearData = window.clearAllData; // Shortened name
    
    // Expose inventory data cleanup function globally
    window.cleanInventoryData = function() {
        console.log('🔧 Manual inventory data cleanup triggered');
        if (window.businessManager) {
            window.businessManager.cleanAndRegenerateInventoryData();
        } else {
            console.error('❌ Business manager not available');
        }
    };

    // Direct emergency clear function that bypasses modal
    window.emergencyClearAllData = function() {
        console.log('🚨 EMERGENCY CLEAR DATA CALLED');
        try {
            if (confirm('EMERGENCY: Clear all business data immediately?')) {
                console.log('🚨 User confirmed emergency clear');
                localStorage.removeItem('jmonic_products');
                localStorage.removeItem('jmonic_sales');
                localStorage.removeItem('jmonic_purchases');
                localStorage.removeItem('inventoryTransactions');
                localStorage.removeItem('jmonic_settings');
                alert('✅ Emergency clear complete! Page will refresh.');
                location.reload();
            }
        } catch (error) {
            console.error('Emergency clear failed:', error);
            alert('Emergency clear failed: ' + error.message);
        }
    };
    
    // Simple direct clear for button onclick
    window.directClearData = function() {
        console.log('🔥 DIRECT CLEAR DATA CALLED');
        if (window.businessManager) {
            window.businessManager.performDataClear();
        } else {
            window.emergencyClearAllData();
        }
    };
    
    // Global function to reset stuck flags
    window.resetClearFlags = function() {
        console.log('🔄 GLOBAL RESET: Clearing all stuck flags...');
        if (window.businessManager) {
            window.businessManager.resetClearDataFlags();
        }
        window.clearDataInProgress = false;
        // Remove any existing modals
        const existingModals = document.querySelectorAll('[id*="clear"], [class*="modal"]');
        existingModals.forEach(modal => {
            if (modal.innerHTML && modal.innerHTML.includes('Clear All Data')) {
                modal.remove();
            }
        });
        console.log('✅ Global flag reset complete');
    };
    
    // Initialize flags to ensure clean state
    window.clearDataInProgress = false;
    
    // Additional global handlers for reliability
    window.deleteAllData = window.clearAllData; // Alternative name
    window.clearData = window.clearAllData; // Shortened name
    
    // Specific handler for HTML onclick attributes
    window.handleClearDataClick = function(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        console.log('🎯 HandleClearDataClick called');
        window.clearAllData();
    };
    
    // Backup function in case others fail
    window.emergencyClearData = function() {
        console.log('🚨 Emergency clear data called');
        try {
            if (confirm('EMERGENCY CLEAR: Delete all business data?')) {
                ['jmonic_products', 'jmonic_sales', 'jmonic_purchases', 'inventoryTransactions', 'jmonic_settings']
                    .forEach(key => localStorage.removeItem(key));
                alert('Data cleared via emergency function');
                location.reload();
            }
        } catch (error) {
            console.error('Emergency clear failed:', error);
        }
    };
    
    console.log('Global functions exported:', {
        businessManager: typeof window.businessManager,
        openModal: typeof window.openModal,
        closeModal: typeof window.closeModal,
        showSettings: typeof window.showSettings,
        activateSettings: typeof window.activateSettings,
        clearAllData: typeof window.clearAllData,
        deleteProduct: typeof window.deleteProduct
    });
    
    // Add test function to verify JavaScript is working
    window.testJS = function() {
        console.log('JavaScript is working properly');
    };
    
    // Load products if on products page initially
    if (document.querySelector('#products.active')) {
        businessManager.loadProductsInventory();
    }
    
    // Initialize inventory tracking if on inventory page
    if (document.querySelector('#inventory.active')) {
        businessManager.initializeInventoryTracking();
    }
    
    // Initialize product stats on page load
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    if (businessManager && document.querySelector('#products')) {
        businessManager.updateProductStats(products);
    }
});

// Event Listeners
function initializeEventListeners() {
    // Sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar-menu a');
    sidebarItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
}

// Navigation Handler
function handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    
    // Remove active class from all sidebar menu items
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Add active class to the clicked item's parent li
    const clickedLi = e.currentTarget.closest('li');
    if (clickedLi) {
        clickedLi.classList.add('active');
    }
    
    // Show the selected section
    showSection(section);
}

// Show Section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title in header
    const pageTitleMap = {
        'overview': 'Dashboard',
        'products': 'Products Management',
        'sales': 'Sales Records',
        'revenue': 'Revenue Analytics',
        'inventory': 'Inventory Tracking',
        'purchases': 'Supplier Orders',
        'reports': 'Reports',
        'categories': 'Category Analytics',
        'creditors': 'Creditors Management',
        'settings': 'Settings'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = pageTitleMap[sectionName] || sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    }
    
    // Load section-specific data
    if (sectionName === 'sales' && businessManager) {
        businessManager.loadSalesDashboard();
    } else if (sectionName === 'products' && businessManager) {
        businessManager.loadProductsInventory();
        // Also update product stats
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        businessManager.updateProductStats(products);
    } else if (sectionName === 'inventory' && businessManager) {
        businessManager.initializeInventoryTracking();
    } else if (sectionName === 'revenue' && revenueAnalytics) {
        revenueAnalytics.loadRevenueAnalytics();
        if (businessManager) {
            businessManager.updateRevenueForecast(); // Update forecasting when revenue section is viewed
        }
    } else if (sectionName === 'reports' && businessManager) {
        // Update inventory reports when reports section is viewed
        businessManager.updateInventoryReports();
    } else if (sectionName === 'creditors' && businessManager) {
        // Load creditors when creditors section is viewed
        businessManager.loadCreditors();
    } else if (sectionName === 'settings' && businessManager) {
        // Initialize settings when settings section is opened
        console.log('Settings section opened - loading settings');
        businessManager.loadSettings();
        businessManager.initializeSettingsTabs();
    } else if (sectionName === 'categories' && businessManager) {
        // Load category analytics when categories section is viewed
        businessManager.loadCategoryAnalytics();
    }
    
    // Update header title and subtitle
    if (typeof updateHeaderTitle === 'function') {
        updateHeaderTitle();
    }
}

// Modal Functions  
function openModal(modalId) {
    console.log('Opening modal:', modalId);
    
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        document.body.style.overflow = 'hidden';
        
        // Load products for sale modal
        if (modalId === 'addSaleModal' && businessManager) {
            businessManager.loadProductsForSale();
            // Set today's date as default
            const dateInput = document.querySelector('#addSaleModal input[name="saleDate"]');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            // Update business name in header
            const settings = JSON.parse(localStorage.getItem('jmonic_business_settings') || '{}');
            const businessName = settings.businessName || 'GEL-STOCK';
            const businessHeader = document.getElementById('saleBusinessHeader');
            if (businessHeader) {
                businessHeader.innerHTML = `<h2 style="margin: 0; font-size: 1.3rem; color: #1f2937; font-weight: bold;">${businessName}</h2>`;
            }
            // Initialize total calculation
            setTimeout(() => businessManager.updateSaleTotal(), 100);
        }
    } else {
        console.error('Modal not found:', modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Business Info Display/Edit Mode Functions
function toggleBusinessInfoMode() {
    const businessInfoDisplay = document.getElementById('businessInfoDisplay');
    const businessInfoEdit = document.getElementById('businessInfoEdit');
    
    if (!businessInfoDisplay || !businessInfoEdit) {
        console.error('Business info elements not found');
        return;
    }
    
    // Check if edit mode is currently visible
    const isEditMode = businessInfoEdit.style.display === 'flex';
    
    if (isEditMode) {
        // Switch back to display mode (cancel edit)
        businessInfoDisplay.style.display = 'flex';
        businessInfoEdit.style.display = 'none';
    } else {
        // Switch to edit mode
        businessInfoDisplay.style.display = 'none';
        businessInfoEdit.style.display = 'flex';
        
        // Populate edit fields with current display values
        const settings = JSON.parse(localStorage.getItem('jmonic_settings') || '{}');
        
        const businessNameInput = document.getElementById('businessName');
        const ownerNameInput = document.getElementById('ownerName');
        const businessEmailInput = document.getElementById('businessEmail');
        const businessPhoneInput = document.getElementById('businessPhone');
        const businessAddressInput = document.getElementById('businessAddress');
        
        if (businessNameInput) businessNameInput.value = settings.businessName || 'J\'MONIC ENTERPRISE';
        if (ownerNameInput) ownerNameInput.value = settings.ownerName || 'Business Owner';
        if (businessEmailInput) businessEmailInput.value = settings.businessEmail || '';
        if (businessPhoneInput) businessPhoneInput.value = settings.businessPhone || '';
        if (businessAddressInput) businessAddressInput.value = settings.businessAddress || '';
        
        // Focus on first field
        if (businessNameInput) businessNameInput.focus();
    }
}

function saveBusinessInfo() {
    const businessNameInput = document.getElementById('businessName');
    const ownerNameInput = document.getElementById('ownerName');
    const businessEmailInput = document.getElementById('businessEmail');
    const businessPhoneInput = document.getElementById('businessPhone');
    const businessAddressInput = document.getElementById('businessAddress');
    
    // Validate required fields
    if (!businessNameInput || !businessNameInput.value.trim()) {
        if (businessManager) {
            businessManager.showNotification('Please enter a business name', 'error');
        }
        return;
    }
    
    if (!ownerNameInput || !ownerNameInput.value.trim()) {
        if (businessManager) {
            businessManager.showNotification('Please enter owner name', 'error');
        }
        return;
    }
    
    // Validate email if provided
    const email = businessEmailInput?.value.trim() || '';
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        if (businessManager) {
            businessManager.showNotification('Please enter a valid email address', 'error');
        }
        return;
    }
    
    // Validate phone if provided
    const phone = businessPhoneInput?.value.trim() || '';
    if (phone && !phone.match(/^(\+233|0)?[0-9]{9}$/)) {
        if (businessManager) {
            businessManager.showNotification('Please enter a valid Ghana phone number (e.g., 0201234567)', 'error');
        }
        return;
    }
    
    // Get current settings
    const settings = JSON.parse(localStorage.getItem('jmonic_settings') || '{}');
    
    // Update with new values
    settings.businessName = businessNameInput?.value || 'J\'MONIC ENTERPRISE';
    settings.ownerName = ownerNameInput?.value || 'Business Owner';
    settings.businessEmail = businessEmailInput?.value || '';
    settings.businessPhone = businessPhoneInput?.value || '';
    settings.businessAddress = businessAddressInput?.value || '';
    
    // Save to localStorage
    localStorage.setItem('jmonic_settings', JSON.stringify(settings));
    
    // Update display
    if (businessManager) {
        businessManager.updateBusinessInfoDisplay();
        businessManager.showNotification('Business information saved successfully!', 'success');
    }
    
    // Switch back to display mode
    toggleBusinessInfoMode();
}

// Product Search Functions
function switchProductTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.product-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName + 'ProductTab');
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.closest('.tab-button').classList.add('active');
    
    // Reset search when switching tabs
    if (tabName === 'search') {
        const input = document.getElementById('skuSearchInput');
        if (input) input.value = '';
        const results = document.getElementById('searchResults');
        if (results) results.innerHTML = '';
        const selectedInfo = document.getElementById('selectedProductInfo');
        if (selectedInfo) selectedInfo.style.display = 'none';
        const addBtn = document.getElementById('addExistingProductBtn');
        if (addBtn) addBtn.style.display = 'none';
        // Hide any suggestion panel
        const sugg = document.getElementById('searchSuggestions');
        if (sugg) { sugg.innerHTML = ''; sugg.style.display = 'none'; }
    }
}

function populateSKUDropdown() {
    // Deprecated: SKU <select> was removed in favor of type-ahead suggestions.
    // Keep this function as a no-op for compatibility.
    console.log('populateSKUDropdown() - no-op (type-ahead suggestions in use)');
    return;
}

// Show suggestions as the user types in the search input
function suggestProducts() {
    const q = (document.getElementById('skuSearchInput')?.value || '').trim().toLowerCase();
    const suggestionsBox = document.getElementById('searchSuggestions');
    const resultsBox = document.getElementById('searchResults');

    if (!suggestionsBox) return;

    if (!q) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
        if (resultsBox) resultsBox.innerHTML = '';
        return;
    }

    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const matches = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        return name.includes(q) || sku.includes(q);
    }).slice(0, 12);

    if (matches.length === 0) {
        suggestionsBox.innerHTML = `<div class="search-no-results"><i class="fas fa-search"></i><p>No products match "${q}"</p></div>`;
        suggestionsBox.style.display = 'block';
        return;
    }

    // Render suggestion items
    suggestionsBox.innerHTML = matches.map(p => {
        const price = p.selling_price || p.price || 0;
        return `<div class="suggestion-item" data-id="${p.id}" onclick="onSuggestionClick('${p.id}')">
                    <div class="suggestion-main"><strong>${escapeHtml(p.sku || '')}</strong> — ${escapeHtml(p.name || '')}</div>
                    <div class="suggestion-meta">GHS ${parseFloat(price).toFixed(2)}</div>
                </div>`;
    }).join('');

    suggestionsBox.style.display = 'block';
    if (resultsBox) resultsBox.innerHTML = '';
}

// Handle click on suggestion item
function onSuggestionClick(productId) {
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Call existing selectProduct with appropriate params
    const selling = parseFloat(product.selling_price || product.price || 0);
    const cost = parseFloat(product.cost_price || 0);
    selectProduct(product.id, product.name, product.sku, selling, cost);

    // Hide suggestions
    const suggestionsBox = document.getElementById('searchSuggestions');
    if (suggestionsBox) { suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; }
}

// Small utility to escape HTML in suggestions
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s];
    });
}

function selectProductFromDropdown() {
    // Deprecated: SKU <select> removed. Use suggestProducts() and click suggestions instead.
    console.warn('selectProductFromDropdown() called but SKU select was removed. Use suggestions.');
    return;
}

function searchProductBySKU() {
    const skuInput = document.getElementById('skuSearchInput').value.trim();
    const searchResults = document.getElementById('searchResults');
    
    if (!skuInput) {
        searchResults.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>Enter a SKU to search for products</p>
            </div>
        `;
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const searchTerm = skuInput.toLowerCase();
    
    // Search by SKU (exact or partial match)
    const results = products.filter(product => 
        (product.sku || '').toLowerCase().includes(searchTerm) ||
        (product.name || '').toLowerCase().includes(searchTerm)
    );
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-inbox"></i>
                <p>No products found matching "<strong>${skuInput}</strong>"</p>
                <p style="font-size: 0.8125rem; margin-top: 0.5rem; opacity: 0.7;">Try a different SKU or create a new product</p>
            </div>
        `;
        document.getElementById('selectedProductInfo').style.display = 'none';
        document.getElementById('addExistingProductBtn').style.display = 'none';
        return;
    }
    
    // Display results
    searchResults.innerHTML = results.map(product => `
        <div class="product-result-item" onclick="selectProduct('${product.id}', '${product.name}', '${product.sku}', ${product.selling_price || product.price || 0}, ${product.cost_price || 0})">
            <div class="product-result-info">
                <div class="product-result-name">${product.name}</div>
                <div class="product-result-sku">SKU: ${product.sku}</div>
                <div class="product-result-price">GHS ${(product.selling_price || product.price || 0).toFixed(2)}</div>
            </div>
            <div class="product-result-checkbox">
                <i class="fas fa-check" style="font-size: 0.75rem;"></i>
            </div>
        </div>
    `).join('');
}

function selectProduct(productId, productName, sku, sellingPrice, costPrice) {
    // Store selected product data - normalize ID to number for consistent comparison
    window.selectedProductData = {
        id: typeof productId === 'string' ? parseFloat(productId) : productId,
        name: productName,
        sku: sku,
        sellingPrice: sellingPrice,
        costPrice: costPrice
    };
    
    // Update selected product info display - using .value for input fields
    document.getElementById('selectedProductName').value = productName;
    document.getElementById('selectedProductSKU').value = sku;
    document.getElementById('selectedProductPrice').value = sellingPrice.toFixed(2);
    document.getElementById('selectedProductCost').value = costPrice.toFixed(2);
    
    // Reset quantity
    document.getElementById('existingProductQuantity').value = 10;
    
    // Clear price input fields (for optional price updates)
    document.getElementById('newSellingPrice').value = '';
    document.getElementById('newCostPrice').value = '';
    
    // Show selected product info and button
    document.getElementById('selectedProductInfo').style.display = 'block';
    document.getElementById('addExistingProductBtn').style.display = 'block';
    
    // Highlight selected item
    document.querySelectorAll('.product-result-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.closest('.product-result-item').classList.add('selected');
}

async function addExistingProduct() {
    if (!window.selectedProductData) {
        businessManager.showNotification('Please select a product first', 'warning');
        return;
    }
    
    const quantityInput = document.getElementById('existingProductQuantity');
    const quantityToAdd = parseInt(quantityInput.value) || 0;
    
    if (quantityToAdd <= 0) {
        businessManager.showNotification('Please enter a valid quantity', 'warning');
        return;
    }
    
    // Get new prices if provided
    const newSellingPrice = document.getElementById('newSellingPrice').value;
    const newCostPrice = document.getElementById('newCostPrice').value;
    
    try {
        // Get current products
        const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
        // Convert selectedProductData.id to number for comparison (may come as string from HTML)
        const selectedId = typeof window.selectedProductData.id === 'string' 
            ? parseFloat(window.selectedProductData.id) 
            : window.selectedProductData.id;
        const productIndex = products.findIndex(p => p.id === selectedId || p.id == selectedId);
        
        if (productIndex === -1) {
            businessManager.showNotification('Product not found', 'error');
            return;
        }
        
        // Store old prices for logging
        const oldSellingPrice = products[productIndex].selling_price;
        const oldCostPrice = products[productIndex].cost_price;
        
        // Update prices if new values provided
        if (newSellingPrice) {
            const sellingPrice = parseFloat(newSellingPrice);
            if (isNaN(sellingPrice) || sellingPrice <= 0) {
                businessManager.showNotification('Please enter a valid selling price', 'warning');
                return;
            }
            products[productIndex].selling_price = sellingPrice;
        }
        
        if (newCostPrice) {
            const costPrice = parseFloat(newCostPrice);
            if (isNaN(costPrice) || costPrice <= 0) {
                businessManager.showNotification('Please enter a valid cost price', 'warning');
                return;
            }
            products[productIndex].cost_price = costPrice;
        }
        
        // Add stock to existing product
        const previousStock = products[productIndex].stock_quantity || 0;
        products[productIndex].stock_quantity = previousStock + quantityToAdd;
        products[productIndex].last_restocked = new Date().toISOString();
        
        // Log inventory transaction
        if (businessManager && businessManager.logInventoryTransaction) {
            businessManager.logInventoryTransaction(
                products[productIndex].id,
                products[productIndex].name,
                'stock-in',
                quantityToAdd,
                previousStock,
                products[productIndex].stock_quantity,
                'Manual Stock Addition'
            );
        }
        
        // Save updated products
        localStorage.setItem('jmonic_products', JSON.stringify(products));
        
        // Build success message
        let successMsg = `Added ${quantityToAdd} units to ${window.selectedProductData.name}. New stock: ${products[productIndex].stock_quantity} units`;
        
        // Add price change info to message if prices were updated
        if (newSellingPrice || newCostPrice) {
            successMsg += '\n\nPrices Updated:';
            if (newSellingPrice) {
                successMsg += `\n• Selling: GHS ${oldSellingPrice} → GHS ${products[productIndex].selling_price}`;
            }
            if (newCostPrice) {
                successMsg += `\n• Cost: GHS ${oldCostPrice} → GHS ${products[productIndex].cost_price}`;
            }
        }
        
        // Show success notification
        businessManager.showNotification(successMsg, 'success');
        
        // Close modal
        closeModal('addProductModal');
        
        // Reset form
        document.getElementById('skuSearchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('selectedProductInfo').style.display = 'none';
        document.getElementById('addExistingProductBtn').style.display = 'none';
        window.selectedProductData = null;
        
        // Refresh dashboard and inventory
        if (businessManager) {
            businessManager.loadDashboardData();
            businessManager.loadProductsInventory();
            businessManager.refreshLowStockData();
        }
    } catch (error) {
        console.error('Error adding stock:', error);
        businessManager.showNotification(`Error adding stock: ${error.message}`, 'error');
    }
}

// Setup Form Handlers
function setupFormHandlers() {
    // Add Product Form (NEW PRODUCT TAB)
    const newProductForm = document.querySelector('#newProductTab form');
    if (newProductForm) {
        newProductForm.addEventListener('submit', handleAddProductSubmit);
    }
    
    // Add Sale Form
    const addSaleForm = document.querySelector('#addSaleModal form');
    if (addSaleForm) {
        addSaleForm.addEventListener('submit', handleAddSaleSubmit);
    }
    
    // Credit Payment Event Listeners
    const creditAmountPaidInput = document.getElementById('creditAmountPaid');
    if (creditAmountPaidInput) {
        creditAmountPaidInput.addEventListener('input', () => {
            businessManager.updateCreditSummary();
        });
    }
}

// Form Submit Handlers
async function handleAddProductSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate required fields
    const sku = formData.get('sku')?.trim();
    const productName = formData.get('productName')?.trim();
    const category = formData.get('category')?.trim() || 'Uncategorized';
    const sellingPrice = formData.get('sellingPrice')?.trim();
    const costPrice = formData.get('costPrice')?.trim();
    const stockQuantity = formData.get('stockQuantity')?.trim();
    
    // Build validation errors
    const errors = [];
    
    if (!sku) errors.push('SKU is required');
    if (!productName) errors.push('Product name is required');
    if (!sellingPrice) errors.push('Selling price is required');
    if (!costPrice) errors.push('Cost price is required');
    if (stockQuantity === '') errors.push('Stock quantity is required');
    
    // Check numeric validations
    if (sellingPrice && isNaN(parseFloat(sellingPrice))) errors.push('Selling price must be a valid number');
    if (costPrice && isNaN(parseFloat(costPrice))) errors.push('Cost price must be a valid number');
    if (stockQuantity && isNaN(parseInt(stockQuantity))) errors.push('Stock quantity must be a valid number');
    
    // Show all errors at once
    if (errors.length > 0) {
        const errorMessage = errors.join('\n• ');
        if (businessManager && businessManager.showLiveNotification) {
            businessManager.showLiveNotification(
                'Form Validation Error',
                '• ' + errorMessage,
                'error',
                'fa-exclamation-circle'
            );
        } else {
            alert('Please fix the following errors:\n• ' + errorMessage);
        }
        return;
    }
    
    const productData = {
        sku: sku,
        productName: productName,
        category: category,
        description: formData.get('description'),
        sellingPrice: parseFloat(sellingPrice),
        costPrice: parseFloat(costPrice),
        stockQuantity: parseInt(stockQuantity),
        reorderLevel: parseInt(formData.get('reorderLevel')) || 10
    };
    
    // Check if we're editing an existing product
    const editingId = form.dataset.editingId;
    
    try {
        let result;
        if (editingId) {
            // Update existing product
            result = await businessManager.updateProduct(editingId, productData);
        } else {
            // Add new product
            result = await businessManager.addProduct(productData);
        }
        
        if (result) {
            closeModal('addProductModal');
            
            // Reset form and modal state
            form.reset();
            delete form.dataset.editingId;
            document.querySelector('#addProductModal h3').textContent = 'Add New Product';
            document.querySelector('#addProductModal button[type="submit"]').textContent = 'Add Product';
            
            // Force refresh the products table and low stock data
            await businessManager.loadProductsInventory();
            businessManager.refreshLowStockData();
            
            // Refresh dashboard KPI cards to show updated stock-in
            businessManager.loadDashboardData();
        }
    } catch (error) {
        // Show validation error to user
        console.error('Product validation error:', error);
        
        // Display error in modal or as notification
        if (businessManager && businessManager.showLiveNotification) {
            businessManager.showLiveNotification(
                'Validation Error',
                error.message,
                'error',
                'fa-exclamation-circle'
            );
        } else {
            alert(error.message); // Fallback
        }
    }
}

async function handleAddSaleSubmit(e) {
    e.preventDefault();
    
    // Validate that at least one product is selected
    const selectedProducts = document.querySelectorAll('#selectedProducts > div');
    console.log('Selected products found:', selectedProducts.length);
    console.log('Selected products:', selectedProducts);
    
    if (selectedProducts.length === 0) {
        console.warn('No products selected in cart');
        if (businessManager && businessManager.showLiveNotification) {
            businessManager.showLiveNotification(
                'Validation Error',
                'Please select at least one product',
                'error',
                'fa-exclamation-circle'
            );
        } else {
            alert('Please select at least one product before submitting the sale.');
        }
        return;
    }
    
    console.log('Proceeding with sale submission...');
    
    const formData = new FormData(e.target);
    
    // Validate required fields
    const paymentMethod = formData.get('paymentMethod')?.trim();
    const saleDate = formData.get('saleDate')?.trim();
    
    console.log('Payment method:', paymentMethod, 'Sale date:', saleDate);
    
    const errors = [];
    if (!paymentMethod) errors.push('Payment method is required');
    if (!saleDate) errors.push('Sale date is required');
    
    if (errors.length > 0) {
        const errorMessage = errors.join('\n• ');
        if (businessManager && businessManager.showLiveNotification) {
            businessManager.showLiveNotification(
                'Form Validation Error',
                '• ' + errorMessage,
                'error',
                'fa-exclamation-circle'
            );
        } else {
            alert('Please fix the following errors:\n• ' + errorMessage);
        }
        return;
    }
    
    await businessManager.submitSale(formData);
}
// Global helper functions
function openAddProductModal() {
    openModal('addProductModal');
    // Populate dropdown when modal opens
    setTimeout(() => {
        populateSKUDropdown();
    }, 100);
}

function editProduct(productId) {
    console.log('Editing product:', productId);
    
    // Get products from localStorage
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const product = products.find(p => p.id == productId);
    
    if (!product) {
        businessManager.showNotification('Product not found!', 'error');
        return;
    }
    
    // Pre-fill the add product modal with existing data
    openModal('addProductModal');
    
    // Wait a bit for modal to open, then fill the form
    setTimeout(() => {
        const form = document.querySelector('#addProductModal form');
        if (form) {
            // Safely set form values with null checks
            const productNameField = form.querySelector('input[name="productName"]');
            const skuField = form.querySelector('input[name="sku"]');
            const stockQuantityField = form.querySelector('input[name="stockQuantity"]');
            const sellingPriceField = form.querySelector('input[name="sellingPrice"]');
            const costPriceField = form.querySelector('input[name="costPrice"]');
            const reorderLevelField = form.querySelector('input[name="reorderLevel"]');
            const descriptionField = form.querySelector('textarea[name="description"]');
            
            if (productNameField) productNameField.value = product.name || '';
            if (skuField) skuField.value = product.sku || '';
            if (stockQuantityField) stockQuantityField.value = product.stock_quantity || '';
            if (sellingPriceField) sellingPriceField.value = product.selling_price || '';
            if (costPriceField) costPriceField.value = product.cost_price || '';
            if (reorderLevelField) reorderLevelField.value = product.reorder_level || '';
            if (descriptionField) descriptionField.value = product.description || '';
            
            // Safely change modal title and button text
            const modalTitle = document.querySelector('#addProductModal h3');
            const submitButton = document.querySelector('#addProductModal button[type="submit"]');
            
            if (modalTitle) modalTitle.textContent = 'Edit Product';
            if (submitButton) submitButton.textContent = 'Update Product';
            
            // Store the product ID for updating
            form.dataset.editingId = productId;
        } else {
            console.error('Could not find product form in modal');
            businessManager.showNotification('Error opening edit form', 'error');
        }
    }, 100);
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        console.log('Deleting product:', productId);
        
        try {
            // Get products from localStorage
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            // Filter out the product to delete
            const updatedProducts = products.filter(p => p.id != productId);
            
            // Save back to localStorage
            localStorage.setItem('jmonic_products', JSON.stringify(updatedProducts));
            
            // Show success message
            if (window.businessManager) {
                window.businessManager.showNotification('Product deleted successfully!', 'success');
                
                // Refresh the products table
                window.businessManager.loadProductsInventory();
                
                // Refresh dashboard data
                window.businessManager.loadDashboardData();
            } else {
                alert('Product deleted successfully!');
                location.reload(); // Fallback: reload page
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product. Please try again.');
        }
    }
}

function exportProducts() {
    businessManager.showNotification('Export feature coming soon!', 'info');
}

// Auto-refresh dashboard every 30 seconds
setInterval(async () => {
    if (businessManager && document.querySelector('#overview.active')) {
        await businessManager.loadDashboardData();
    }
}, 30000);

// Modern Header Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeModernHeader();
});

function initializeModernHeader() {
    // Global Search Functionality
    const globalSearch = document.getElementById('globalSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (globalSearch) {
        globalSearch.addEventListener('input', handleGlobalSearch);
        globalSearch.addEventListener('focus', () => {
            if (globalSearch.value.length > 0) {
                searchSuggestions.style.display = 'block';
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!globalSearch.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.style.display = 'none';
            }
        });
    }
    
    // Notification Button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
        updateNotificationBadge();
    }
    
    // Update header title based on current section
    updateHeaderTitle();
}

function handleGlobalSearch() {
    const query = document.getElementById('globalSearch').value.toLowerCase();
    const suggestions = document.getElementById('searchSuggestions');
    
    if (query.length < 2) {
        suggestions.style.display = 'none';
        return;
    }
    
    // Search through products and sales
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
    
    const productResults = products
        .filter(product => 
            product.name.toLowerCase().includes(query) || 
            product.sku.toLowerCase().includes(query)
        )
        .slice(0, 3)
        .map(product => ({
            type: 'product',
            title: product.name,
            subtitle: `SKU: ${product.sku} - Stock: ${product.stock_quantity}`,
            action: () => showSection('products')
        }));
    
    const saleResults = sales
        .filter(sale => 
            sale.products && sale.products.some(p => 
                p.name.toLowerCase().includes(query)
            )
        )
        .slice(0, 2)
        .map(sale => ({
            type: 'sale',
            title: `Sale #${sale.id}`,
            subtitle: `${sale.products.length} items - GHS ${(sale.revenue || 0).toFixed(2)}`,
            action: () => showSection('sales')
        }));
    
    const allResults = [...productResults, ...saleResults];
    
    if (allResults.length > 0) {
        suggestions.innerHTML = allResults.map(result => `
            <div class="suggestion-item" onclick="${result.action.toString().replace('function ', '').replace('{ ', '').replace(' }', '')}">
                <div class="suggestion-icon">
                    <i class="fas fa-${result.type === 'product' ? 'box' : 'receipt'}"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${result.title}</div>
                    <div class="suggestion-subtitle">${result.subtitle}</div>
                </div>
            </div>
        `).join('');
        suggestions.style.display = 'block';
    } else {
        suggestions.innerHTML = '<div class="suggestion-item"><div class="suggestion-content"><div class="suggestion-title">No results found</div></div></div>';
        suggestions.style.display = 'block';
    }
}

function showNotifications() {
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const lowStockProducts = products.filter(p => p.stock_quantity <= (p.reorder_level || 10));
    
    let notificationContent = '<div class="notification-popup">';
    notificationContent += '<div class="notification-header">Notifications</div>';
    
    if (lowStockProducts.length > 0) {
        notificationContent += '<div class="notification-section">';
        notificationContent += '<div class="notification-section-title">Low Stock Alerts</div>';
        lowStockProducts.forEach(product => {
            notificationContent += `
                <div class="notification-item">
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    <div class="notification-text">
                        <div class="notification-title">${product.name}</div>
                        <div class="notification-subtitle">Only ${product.stock_quantity} units left</div>
                    </div>
                </div>
            `;
        });
        notificationContent += '</div>';
    } else {
        notificationContent += '<div class="notification-item">No new notifications</div>';
    }
    
    notificationContent += '</div>';
    
    // Create temporary notification popup
    const popup = document.createElement('div');
    popup.innerHTML = notificationContent;
    popup.style.position = 'fixed';
    popup.style.top = '80px';
    popup.style.right = '2rem';
    popup.style.zIndex = '1001';
    popup.style.background = 'var(--card-background)';
    popup.style.border = '1px solid var(--border-color)';
    popup.style.borderRadius = 'var(--radius-lg)';
    popup.style.boxShadow = 'var(--shadow-lg)';
    popup.style.minWidth = '300px';
    popup.style.maxWidth = '400px';
    
    document.body.appendChild(popup);
    
    // Remove popup after 5 seconds or on click outside
    setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 5000);
    
    document.addEventListener('click', function removePopup(e) {
        if (!popup.contains(e.target)) {
            if (popup.parentNode) popup.parentNode.removeChild(popup);
            document.removeEventListener('click', removePopup);
        }
    });
}

function updateNotificationBadge() {
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const lowStockCount = products.filter(p => p.stock_quantity <= (p.reorder_level || 10)).length;
    
    const badge = document.querySelector('.notification-badge');
    if (badge && lowStockCount > 0) {
        badge.textContent = lowStockCount;
        badge.style.display = 'flex';
    } else if (badge) {
        badge.style.display = 'none';
    }
}

function updateHeaderTitle() {
    const currentSection = document.querySelector('.content-section.active')?.id || 'overview';
    const pageTitle = document.getElementById('page-title');
    const headerSubtitle = document.querySelector('.header-subtitle');
    
    const titles = {
        'overview': {
            title: 'Business Dashboard',
            subtitle: 'Manage your products and sales'
        },
        'products': {
            title: 'Product Management',
            subtitle: 'Manage your product inventory'
        },
        'sales': {
            title: 'Sales Analytics',
            subtitle: 'Track your sales performance'
        },
        'revenue': {
            title: 'Revenue Analytics',
            subtitle: 'Comprehensive revenue analysis and forecasting'
        },
        'reports': {
            title: 'Business Reports',
            subtitle: 'Analyze your business data'
        }
    };
    
    if (pageTitle && titles[currentSection]) {
        pageTitle.textContent = titles[currentSection].title;
    }
    
    if (headerSubtitle && titles[currentSection]) {
        headerSubtitle.textContent = titles[currentSection].subtitle;
    }
}

// Revenue Analytics System
class RevenueAnalytics {
    constructor() {
        this.timeFilter = 'month';
        this.charts = {};
    }
    
    async loadRevenueAnalytics() {
        try {
            const sales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
            const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
            
            // Calculate comprehensive revenue metrics
            const metrics = this.calculateRevenueMetrics(sales, products);
            
            // Update revenue overview cards
            this.updateRevenueOverview(metrics);
            
            // Update revenue charts
            this.updateRevenueCharts(sales, products);
            
            // Update revenue tables
            this.updateRevenueTables(sales, products);
            
            // Update revenue forecasting
            this.updateRevenueForecasting(sales);
            
            // Update credit sales display from creditors data - call businessManager method
            if (businessManager && businessManager.updateCreditSalesDisplay) {
                businessManager.updateCreditSalesDisplay();
            }
            
        } catch (error) {
            console.error('Error loading revenue analytics:', error);
        }
    }
    
    calculateRevenueMetrics(sales, products) {
        const now = new Date();
        const timeRanges = this.getTimeRanges(now, this.timeFilter);
        
        // Filter sales by selected time period
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            return saleDate >= timeRanges.start && saleDate <= timeRanges.end;
        });
        
        // Calculate total revenue
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
        
        // Calculate total cost and profit
        let totalCost = 0;
        filteredSales.forEach(sale => {
            if (sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(product => {
                    const productData = products.find(p => p.id == product.id);
                    if (productData && productData.cost_price) {
                        totalCost += (productData.cost_price * (product.quantity || 1));
                    }
                });
            }
        });
        
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        
        // Calculate daily average
        const daysDiff = Math.max(1, Math.ceil((timeRanges.end - timeRanges.start) / (1000 * 60 * 60 * 24)));
        const avgDailyRevenue = totalRevenue / daysDiff;
        
        // Find best day
        const dailyRevenue = {};
        filteredSales.forEach(sale => {
            const date = new Date(sale.date || sale.created_at).toDateString();
            dailyRevenue[date] = (dailyRevenue[date] || 0) + (sale.revenue || 0);
        });
        
        const bestDay = Object.entries(dailyRevenue).reduce((best, [date, revenue]) => {
            return revenue > best.revenue ? { date, revenue } : best;
        }, { date: 'No sales', revenue: 0 });
        
        // Calculate previous period for comparison
        const previousRange = this.getPreviousTimeRange(timeRanges);
        const previousSales = sales.filter(sale => {
            const saleDate = new Date(sale.date || sale.created_at);
            return saleDate >= previousRange.start && saleDate <= previousRange.end;
        });
        const previousRevenue = previousSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
        const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
        
        return {
            totalRevenue,
            grossProfit,
            profitMargin,
            avgDailyRevenue,
            bestDay,
            revenueChange,
            orderCount: filteredSales.length,
            avgOrderValue: filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0
        };
    }
    
    updateRevenueOverview(metrics) {
        // Update total revenue
        const totalRevenueEl = document.getElementById('totalRevenueValue');
        if (totalRevenueEl) {
            totalRevenueEl.textContent = `GHS ${metrics.totalRevenue.toFixed(2)}`;
        }
        
        const totalRevenueChange = document.getElementById('totalRevenueChange');
        if (totalRevenueChange) {
            const changeText = metrics.revenueChange >= 0 ? '+' : '';
            totalRevenueChange.textContent = `${changeText}${metrics.revenueChange.toFixed(1)}% from last period`;
            totalRevenueChange.className = `revenue-change ${metrics.revenueChange >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update gross profit
        const grossProfitEl = document.getElementById('grossProfitValue');
        if (grossProfitEl) {
            grossProfitEl.textContent = `GHS ${metrics.grossProfit.toFixed(2)}`;
        }
        
        const grossProfitMargin = document.getElementById('grossProfitMargin');
        if (grossProfitMargin) {
            grossProfitMargin.textContent = `${metrics.profitMargin.toFixed(1)}% margin`;
        }
        
        // Update daily average
        const avgDailyEl = document.getElementById('avgDailyRevenue');
        if (avgDailyEl) {
            avgDailyEl.textContent = `GHS ${metrics.avgDailyRevenue.toFixed(2)}`;
        }
        
        // Update best day
        const bestDayEl = document.getElementById('bestDayRevenue');
        if (bestDayEl) {
            bestDayEl.textContent = `GHS ${metrics.bestDay.revenue.toFixed(2)}`;
        }
        
        const bestDayDate = document.getElementById('bestDayDate');
        if (bestDayDate) {
            bestDayDate.textContent = metrics.bestDay.date !== 'No sales' 
                ? new Date(metrics.bestDay.date).toLocaleDateString()
                : 'No sales yet';
        }
    }

}

// Initialize revenue analytics
const revenueAnalytics = new RevenueAnalytics();

// Export function for revenue data
function exportRevenueData() {
    businessManager.showNotification('Revenue export feature coming soon!', 'info');
}

// Handle export button click with error handling
function handleExportClick() {
    try {
        console.log('Export button clicked');
        if (typeof businessManager !== 'undefined' && businessManager) {
            if (typeof businessManager.exportRecentSales === 'function') {
                console.log('Calling exportRecentSales function...');
                businessManager.exportRecentSales();
            } else {
                console.error('exportRecentSales function not found');
                alert('Export function is not available. Please refresh the page and try again.');
            }
        } else {
            console.error('businessManager not available');
            alert('System not ready. Please refresh the page and try again.');
        }
    } catch (error) {
        console.error('Export button error:', error);
        alert('Export failed: ' + error.message);
    }
}

// Mobile navigation handler
function initializeMobileNavigation() {
    const mobileNavItems = document.querySelectorAll('.sidebar.mobile .nav-item');
    const desktopNavItems = document.querySelectorAll('.sidebar.desktop-only .sidebar-menu a');
    
    // Handle mobile navigation clicks
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all mobile nav items
            mobileNavItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get section and trigger navigation
            const section = item.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Sync desktop and mobile navigation
    function syncNavigation(activeSection) {
        // Update mobile navigation
        mobileNavItems.forEach(item => {
            const section = item.getAttribute('data-section');
            if (section === activeSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update desktop navigation
        desktopNavItems.forEach(item => {
            const section = item.getAttribute('data-section');
            if (section === activeSection) {
                item.parentElement.classList.add('active');
            } else {
                item.parentElement.classList.remove('active');
            }
        });
    }
    
    // Watch for section changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('content-section') && target.classList.contains('active')) {
                    syncNavigation(target.id);
                }
            }
        });
    });
    
    // Observe all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        observer.observe(section, { attributes: true });
    });
    
    console.log('Mobile navigation initialized');
}

// Mobile sidebar functions
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        console.log('Mobile sidebar toggled');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
        console.log('Mobile sidebar closed');
    }
}

/* Toggle mobile user dropdown menu */
function toggleMobileUserMenu() {
    const dropdown = document.getElementById('mobileUserDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    }
    // Close sidebar if open
    closeMobileSidebar();
}

/* Close mobile user dropdown when clicking outside */
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('mobileUserDropdown');
    const profileBtn = document.querySelector('.mobile-user-profile-btn');
    
    if (dropdown && profileBtn) {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }
});

/* Update mobile header with user info */
function updateMobileHeader(user) {
    if (!user) {
        // Demo user
        document.getElementById('mobileHeaderBusinessName').textContent = 'GEL-STOCK';
        document.getElementById('mobileUserAvatar').textContent = 'G';
        document.getElementById('mobileUserName').textContent = 'Demo';
        return;
    }
    
    // Display business name or GEL-STOCK
    const businessName = user.businessName || 'GEL-STOCK';
    document.getElementById('mobileHeaderBusinessName').textContent = businessName;
    
    // Display user name
    const userName = user.fullName || user.name || 'User';
    document.getElementById('mobileUserName').textContent = userName;
    
    // Update avatar with user initial
    const initial = userName.charAt(0).toUpperCase();
    document.getElementById('mobileUserAvatar').textContent = initial;
}

function navigateToSection(sectionName) {
    console.log('Navigating to section:', sectionName);
    
    // Close mobile sidebar and dropdown first
    closeMobileSidebar();
    const dropdown = document.getElementById('mobileUserDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    // Update active states in mobile sidebar
    const mobileMenuItems = document.querySelectorAll('.mobile-sidebar-menu li');
    mobileMenuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update active states in bottom navigation
    const bottomNavItems = document.querySelectorAll('.sidebar.mobile .nav-item');
    bottomNavItems.forEach(item => {
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show the selected section
    if (typeof showSection === 'function') {
        showSection(sectionName);
        
        // Load profile data if navigating to settings
        if (sectionName === 'settings' && businessManager) {
            setTimeout(() => {
                businessManager.loadProfileData();
            }, 100);
        }
    }
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
        console.log('Navigation completed to:', sectionName);
    }, 300);
}

// Mobile dropdown toggle functions
function toggleNotifications() {
    console.log('Toggle notifications from mobile sidebar');
    if (window.dashboardApp && typeof window.dashboardApp.toggleDropdown === 'function') {
        window.dashboardApp.toggleDropdown('notification');
        window.dashboardApp.loadNotifications();
    }
    closeMobileSidebar();
}

function toggleSettings() {
    console.log('Toggle settings from mobile sidebar');
    if (window.dashboardApp && typeof window.dashboardApp.showSection === 'function') {
        window.dashboardApp.showSection('settings');
        window.dashboardApp.loadSettings();
    }
    closeMobileSidebar();
}

// Theme Management Functions
function initializeTheme() {
    // Get saved theme or default to light
    const savedTheme = localStorage.getItem('jmonic_theme') || 'light';
    
    // Apply theme immediately
    applyThemeGlobal(savedTheme);
    
    // Set up theme change listeners
    setupThemeListeners();
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const currentTheme = localStorage.getItem('jmonic_theme') || 'light';
        if (currentTheme === 'auto') {
            applyThemeGlobal('auto');
        }
    });
}

function applyThemeGlobal(theme) {
    const body = document.body;
    const html = document.documentElement;
    
    // Add smooth transition animation
    body.classList.add('theme-changing');
    
    // Remove all theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    html.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    if (theme === 'dark') {
        body.classList.add('theme-dark');
        html.classList.add('theme-dark');
    } else if (theme === 'light') {
        body.classList.add('theme-light');
        html.classList.add('theme-light');
    } else if (theme === 'auto') {
        body.classList.add('theme-auto');
        html.classList.add('theme-auto');
        
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            body.classList.add('theme-dark');
            html.classList.add('theme-dark');
        } else {
            body.classList.add('theme-light');
            html.classList.add('theme-light');
        }
    }
    
    // Remove animation class after transition
    setTimeout(() => {
        body.classList.remove('theme-changing');
    }, 500);
    
    // Store theme preference
    localStorage.setItem('jmonic_theme', theme);
    
    // Update all theme selectors
    updateThemeSelectors(theme);
}

function setupThemeListeners() {
    // Add event listeners to all theme selectors
    const themeInputs = document.querySelectorAll('input[name="theme"], input[name="theme-dash"]');
    
    themeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                const theme = e.target.value;
                applyThemeGlobal(theme);
                
                // Show theme change notification
                if (window.businessManager && typeof window.businessManager.showNotification === 'function') {
                    window.businessManager.showNotification(
                        `Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 
                        'success'
                    );
                }
            }
        });
    });
}

function updateThemeSelectors(theme) {
    // Update all theme radio buttons
    const themeInputs = document.querySelectorAll('input[name="theme"], input[name="theme-dash"]');
    themeInputs.forEach(input => {
        input.checked = input.value === theme;
    });
    
    // Add visual feedback to theme cards
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        const input = card.previousElementSibling;
        if (input && input.value === theme) {
            card.style.transform = 'scale(1.05)';
            setTimeout(() => {
                card.style.transform = '';
            }, 200);
        }
    });
}

// Clean up any debug panels that might exist from cached scripts
setTimeout(() => {
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
        debugPanel.remove();
        console.log('🧹 Removed existing debug panel');
    }
    
    // Remove any remaining theme indicator elements or sun icons in header
    const themeElements = document.querySelectorAll('#themeIndicator, .theme-indicator, .header-actions .fa-sun, .dashboard-header .fa-sun');
    themeElements.forEach(element => {
        element.remove();
        console.log('🧹 Removed theme indicator element');
    });
    
    // Remove any header actions container if it's empty
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && headerActions.children.length === 0) {
        headerActions.remove();
        console.log('🧹 Removed empty header actions container');
    }
    
    // Also remove any debug panels that might be created later
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Remove debug panels
                    if (node.id === 'debug-panel' || node.classList?.contains('debug-panel')) {
                        node.remove();
                        console.log('🧹 Prevented debug panel from appearing');
                    }
                    // Remove any theme indicators that might be added
                    if (node.id === 'themeIndicator' || node.classList?.contains('theme-indicator') || 
                        (node.classList?.contains('fa-sun') && node.closest('.dashboard-header'))) {
                        node.remove();
                        console.log('🧹 Prevented theme indicator from appearing');
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}, 100);

// Override any global debug functions that might exist from cached scripts
window.debugButtons = undefined;
window.testJS = function() {
    console.log('JavaScript is working properly');
};

// Final system health check and optimization
setTimeout(() => {
    console.log('🔍 Running system health check...');
    
    // Check core functions
    const healthCheck = {
        businessManager: !!window.businessManager,
        clearAllData: typeof window.clearAllData === 'function',
        openModal: typeof window.openModal === 'function',
        closeModal: typeof window.closeModal === 'function',
        deleteProduct: typeof window.deleteProduct === 'function',
        deleteButtonsPresent: !!(document.getElementById('deleteDataBtn') && document.getElementById('deleteDataBtn-dash'))
    };
    
    console.log('✅ System Health Check:', healthCheck);
    
    // Ensure all critical buttons have event handlers
    ['deleteDataBtn', 'deleteDataBtn-dash'].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn && !btn.onclick && !btn.dataset.handlerAdded) {
            btn.onclick = () => {
                console.log(`🗑️ Direct onclick for ${btnId}`);
                if (window.clearAllData) {
                    window.clearAllData();
                } else {
                    alert('Clear data function not available');
                }
            };
            btn.dataset.handlerAdded = 'true';
            console.log(`✅ Added onclick handler to ${btnId}`);
        }
    });
    
    // Clean up any potential memory leaks or duplicate listeners
    const duplicateHandlers = document.querySelectorAll('[data-handler-added="true"]');
    console.log(`🧹 Found ${duplicateHandlers.length} elements with handlers`);
    
    console.log('🎯 System optimization complete');
    
    // Set up periodic delete button health check
    setInterval(() => {
        if (window.businessManager) {
            const deleteButtons = ['deleteDataBtn', 'deleteDataBtn-dash'];
            let workingButtons = 0;
            
            deleteButtons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    workingButtons++;
                    // Ensure button has proper onclick if missing
                    if (!btn.onclick && !btn.dataset.hasGlobalHandler) {
                        btn.onclick = function(e) {
                            e.preventDefault();
                            console.log('🔧 Backup onclick handler activated for:', btnId);
                            window.clearAllData();
                        };
                        btn.dataset.hasGlobalHandler = 'true';
                        console.log('🔧 Added backup onclick to:', btnId);
                    }
                }
            });
            
            if (workingButtons === 0) {
                console.warn('⚠️ No delete buttons found during health check');
            }
        }
    }, 10000); // Check every 10 seconds
}, 2000);

// Global notification functions
// Global test function for notifications
function testNotifications() {
    if (window.businessManager && window.businessManager.testNotifications) {
        window.businessManager.testNotifications();
    } else {
        console.error('❌ Business manager not available');
    }
}

// Global function to show custom notification
function showTestNotification(title, message, type = 'info') {
    if (window.businessManager && window.businessManager.showLiveNotification) {
        window.businessManager.showLiveNotification(title, message, type);
    } else {
        console.error('❌ Business manager not available');
    }
}

// Debug function to force show dropdown
function debugShowNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
        dropdown.style.visibility = 'visible';
        dropdown.style.opacity = '1';
        dropdown.style.zIndex = '99999';
        dropdown.classList.add('show');
        console.log('🔔 Debug: Dropdown forced to show');
        
        // Load notifications
        if (window.businessManager && window.businessManager.loadNotifications) {
            window.businessManager.loadNotifications();
        }
    } else {
        console.error('❌ Dropdown not found');
    }
}

// Debug function to add test data for notifications
function addTestDataForNotifications() {
    // Add some test products with low stock
    const testProducts = [
        {
            id: 'test1',
            name: 'iPhone 15 Pro',
            stock_quantity: 2,
            reorderLevel: 5,
            price: 4500,
            created_at: new Date().toISOString()
        },
        {
            id: 'test2', 
            name: 'Samsung Galaxy S24',
            stock_quantity: 1,
            reorderLevel: 3,
            price: 3200,
            created_at: new Date().toISOString()
        },
        {
            id: 'test3',
            name: 'MacBook Pro M3',
            stock_quantity: 0,
            reorderLevel: 2,
            price: 8500,
            created_at: new Date().toISOString()
        }
    ];
    
    // Store in localStorage
    const existingProducts = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    const updatedProducts = [...existingProducts, ...testProducts];
    localStorage.setItem('jmonic_products', JSON.stringify(updatedProducts));
    
    // Add a recent sale
    const testSale = {
        id: 'sale_test1',
        customer_name: 'John Doe',
        total_amount: 1500,
        paymentMethod: 'cash',
        date: new Date().toISOString(),
        products: [
            { name: 'Phone Case', quantity: 2, subtotal: 100 },
            { name: 'Screen Protector', quantity: 3, subtotal: 75 }
        ]
    };
    
    const existingSales = JSON.parse(localStorage.getItem('jmonic_sales') || '[]');
    existingSales.push(testSale);
    localStorage.setItem('jmonic_sales', JSON.stringify(existingSales));
    
    console.log('✅ Test data added for notifications');
    
    // Refresh notifications
    if (window.businessManager && window.businessManager.loadNotifications) {
        window.businessManager.loadNotifications();
    }
    
    return { products: testProducts, sale: testSale };
}

// Test SKU-Product Name validation
function testSKUProductValidation() {
    console.log('🧪 Testing SKU-Product Name validation...');
    
    if (!window.businessManager) {
        console.error('❌ Business manager not available');
        return;
    }
    
    // First, add a product
    const product1 = {
        sku: 'VALID-001',
        productName: 'Original Product',
        description: 'First product',
        sellingPrice: '50',
        costPrice: '30',
        stockQuantity: '10',
        reorderLevel: '5'
    };
    
    try {
        console.log('Adding initial product...');
        window.businessManager.handleProductsAPI('POST', product1);
        console.log('✅ Initial product added successfully');
        
        // Now try to add with same SKU but different name (should fail)
        const product2 = {
            sku: 'VALID-001', // Same SKU
            productName: 'Different Product Name', // Different name
            description: 'This should fail',
            sellingPrice: '60',
            costPrice: '40',
            stockQuantity: '5',
            reorderLevel: '3'
        };
        
        console.log('Trying to add with same SKU but different name...');
        window.businessManager.handleProductsAPI('POST', product2);
        console.log('❌ This should not succeed!');
        
    } catch (error) {
        console.log('✅ Validation working correctly:', error.message);
    }
    
    // Test: Same product name with different SKU (should also fail)
    try {
        const product3 = {
            sku: 'DIFFERENT-002', // Different SKU
            productName: 'Original Product', // Same name as first product
            description: 'This should also fail',
            sellingPrice: '70',
            costPrice: '50',
            stockQuantity: '8',
            reorderLevel: '4'
        };
        
        console.log('Trying to add with same name but different SKU...');
        window.businessManager.handleProductsAPI('POST', product3);
        console.log('❌ This should not succeed either!');
        
    } catch (error) {
        console.log('✅ Name validation also working:', error.message);
    }
    
    // Test: Correct way - same SKU and same name (should succeed)
    try {
        const product4 = {
            sku: 'VALID-001', // Same SKU
            productName: 'Original Product', // Same name
            description: 'Adding more stock',
            sellingPrice: '50',
            costPrice: '30',
            stockQuantity: '15', // Additional stock
            reorderLevel: '5'
        };
        
        console.log('Adding more stock with matching SKU and name...');
        window.businessManager.handleProductsAPI('POST', product4);
        console.log('✅ Stock addition successful!');
        
    } catch (error) {
        console.log('❌ This should have worked:', error.message);
    }
}

// Quick test function to verify add product works
function testAddProductFunctionality() {
    console.log('🧪 Testing Add Product functionality...');
    
    if (window.businessManager) {
        const testProduct = {
            sku: 'TEST-001',
            productName: 'Test Product',
            description: 'This is a test product',
            sellingPrice: '50',
            costPrice: '30',
            stockQuantity: '10',
            reorderLevel: '5'
        };
        
        try {
            const result = window.businessManager.handleProductsAPI('POST', testProduct);
            console.log('✅ Add product test successful:', result);
        } catch (error) {
            console.error('❌ Add product test failed:', error);
        }
    } else {
        console.error('❌ Business manager not available');
    }
}

// Test function to simulate adding stock with same SKU
function testSameSKUStock() {
    console.log('🧪 Testing same SKU stock addition...');
    
    // Add initial product
    const productData1 = {
        sku: 'TEST-SKU-001',
        productName: 'Test Product',
        description: 'Initial test product',
        sellingPrice: '100',
        costPrice: '50',
        stockQuantity: '5',
        reorderLevel: '10'
    };
    
    // Add more stock with same SKU
    const productData2 = {
        sku: 'TEST-SKU-001', // Same SKU
        productName: 'Test Product', 
        description: 'Adding more stock',
        sellingPrice: '100',
        costPrice: '50',
        stockQuantity: '15', // Adding 15 more units
        reorderLevel: '10'
    };
    
    if (window.businessManager) {
        console.log('Adding initial product...');
        window.businessManager.handleProductsAPI('POST', productData1);
        
        setTimeout(() => {
            console.log('Adding more stock to same SKU...');
            window.businessManager.handleProductsAPI('POST', productData2);
            
            // Refresh notifications
            setTimeout(() => {
                window.businessManager.loadNotifications();
                console.log('✅ Test completed. Check product should now have 20 units total.');
            }, 500);
        }, 1000);
    }
}

function toggleNotificationDropdown() {
    if (window.businessManager) {
        window.businessManager.toggleNotificationDropdown();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationDropdown');
    const notificationBell = document.getElementById('notificationBell');
    
    if (dropdown && notificationBell) {
        if (!dropdown.contains(event.target) && !notificationBell.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});

// Helper function to show live notifications
function showLiveNotification(title, message, type = 'info', icon = 'fa-info-circle') {
    if (window.businessManager) {
        window.businessManager.showLiveNotification(title, message, type, icon);
    }
}

// Test notification function
function testNotificationSystem() {
    console.log('🧪 Testing notification system...');
    
    // Add sample product with low stock for testing
    const testProducts = [
        {
            id: 'test-1',
            name: 'Test Product Low Stock',
            stock_quantity: 2,
            reorderLevel: 10,
            min_stock_level: 5
        }
    ];
    
    localStorage.setItem('jmonic_products', JSON.stringify(testProducts));
    console.log('📦 Added test product with low stock');
    
    // Test live notification
    showLiveNotification('Test Alert', 'This is a test notification', 'success', 'fa-check-circle');
    
    // Test badge update
    const badge = document.getElementById('headerNotificationBadge');
    if (badge) {
        badge.textContent = '1';
        badge.style.display = 'block';
        console.log('✅ Badge updated');
    }
    
    // Test dropdown visibility
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        console.log('✅ Dropdown element found');
        console.log('📊 Dropdown current display:', dropdown.style.display);
    } else {
        console.error('❌ Dropdown element not found');
    }
    
    // Load notifications
    if (window.businessManager) {
        window.businessManager.loadNotifications();
        console.log('✅ Notifications loaded');
    }
    
    console.log('🧪 Test complete - check the notification bell!');
}

// Function to clear test data and restore clean dashboard  
function clearTestData() {
    console.log('🧹 Clearing test data...');
    localStorage.removeItem('jmonic_products');
    localStorage.removeItem('jmonic_sales');
    localStorage.removeItem('inventoryTransactions');
    
    // Hide notification badge
    const badge = document.getElementById('headerNotificationBadge');
    if (badge) {
        badge.style.display = 'none';
    }
    
    // Reload notifications to clear them
    if (window.businessManager) {
        window.businessManager.loadNotifications();
    }
    
    console.log('✅ Test data cleared - dashboard should be clean now!');
}

// Comprehensive diagnostic function
function diagnoseNotificationSystem() {
    console.log('🔍 COMPREHENSIVE NOTIFICATION SYSTEM DIAGNOSIS');
    console.log('================================================');
    
    // Check elements
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    const badge = document.getElementById('headerNotificationBadge');
    const notificationList = document.getElementById('notificationList');
    
    console.log('📋 Element Check:');
    console.log('  - Bell:', !!bell, bell);
    console.log('  - Dropdown:', !!dropdown, dropdown);
    console.log('  - Badge:', !!badge, badge);
    console.log('  - List:', !!notificationList, notificationList);
    
    // Check business manager
    console.log('📋 BusinessManager Check:');
    console.log('  - Exists:', !!window.businessManager);
    console.log('  - Has toggleNotificationDropdown:', !!(window.businessManager && window.businessManager.toggleNotificationDropdown));
    console.log('  - Has loadNotifications:', !!(window.businessManager && window.businessManager.loadNotifications));
    
    // Check data
    const products = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    console.log('📋 Data Check:');
    console.log('  - Products:', products.length, products);
    
    // Test dropdown manually
    if (dropdown) {
        console.log('📋 Manual Dropdown Test:');
        console.log('  - Current display:', dropdown.style.display);
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        console.log('  - New display:', dropdown.style.display);
    }
    
    // Test notification bell click handler
    if (bell) {
        console.log('📋 Bell Click Test:');
        console.log('  - onclick attribute:', bell.getAttribute('onclick'));
        console.log('  - Attempting manual click...');
        try {
            bell.click();
            console.log('  - ✅ Manual click successful');
        } catch (error) {
            console.log('  - ❌ Manual click failed:', error);
        }
    }
    
    console.log('================================================');
}

// Function to add sample SKU products for testing dropdown
function loadSampleProducts() {
    console.log('📦 Loading sample products for dropdown...');
    
    const sampleProducts = [
        {
            id: 'prod-oil-001',
            sku: 'OIL-001',
            name: 'Hair Oil Premium',
            description: 'Premium hair oil treatment',
            selling_price: 50,
            price: 50,
            cost_price: 30,
            stock_quantity: 25,
            reorder_level: 10,
            created_at: new Date().toISOString()
        },
        {
            id: 'prod-oil-002',
            sku: 'OIL-002',
            name: 'Hair Oil Regular',
            description: 'Regular hair oil treatment',
            selling_price: 35,
            price: 35,
            cost_price: 20,
            stock_quantity: 15,
            reorder_level: 8,
            created_at: new Date().toISOString()
        },
        {
            id: 'prod-shampoo-001',
            sku: 'SHP-001',
            name: 'Natural Hair Shampoo',
            description: 'Gentle shampoo for natural hair',
            selling_price: 45,
            price: 45,
            cost_price: 25,
            stock_quantity: 20,
            reorder_level: 10,
            created_at: new Date().toISOString()
        },
        {
            id: 'prod-conditioner-001',
            sku: 'COND-001',
            name: 'Deep Conditioner',
            description: 'Deep conditioning treatment',
            selling_price: 60,
            price: 60,
            cost_price: 35,
            stock_quantity: 12,
            reorder_level: 5,
            created_at: new Date().toISOString()
        },
        {
            id: 'prod-gel-001',
            sku: 'GEL-001',
            name: 'Hair Gel Strong Hold',
            description: 'Strong hold hair gel',
            selling_price: 40,
            price: 40,
            cost_price: 22,
            stock_quantity: 30,
            reorder_level: 15,
            created_at: new Date().toISOString()
        }
    ];
    
    console.log('💾 Saving to localStorage...');
    localStorage.setItem('jmonic_products', JSON.stringify(sampleProducts));
    console.log('✅ Sample products saved! Total:', sampleProducts.length);
    console.log('✅ Products:', sampleProducts.map(p => `${p.sku} - ${p.name}`).join(', '));
    
    // Verify data was saved
    const saved = JSON.parse(localStorage.getItem('jmonic_products') || '[]');
    console.log('🔍 Verification - Products in localStorage:', saved.length);
    
    // If dropdown exists, refresh it
    const dropdown = document.getElementById('skuDropdown');
    console.log('🎯 Dropdown element found:', !!dropdown);
    
    if (dropdown) {
        console.log('📝 Calling populateSKUDropdown()...');
        populateSKUDropdown();
        console.log('✅ Dropdown refreshed!');
    } else {
        console.warn('⚠️ Dropdown not found yet (modal may not be open)');
        console.log('💡 Tip: Open the Add Product modal first, then run loadSampleProducts() again');
    }
    
    console.log('✅ loadSampleProducts complete!');
    return sampleProducts;
}


// ===== REMOVED PHONE AUTHENTICATION SYSTEM =====
// Phone-based authentication has been disabled
// All users have direct access to the dashboard

// Add test function to window for browser console access
window.testNotificationSystem = testNotificationSystem;
window.diagnoseNotificationSystem = diagnoseNotificationSystem;
window.clearTestData = clearTestData;
window.loadSampleProducts = loadSampleProducts;

/* ===== LOGIN & AUTHENTICATION FUNCTIONS ===== */

/**
 * Validate Ghana phone number format
 * Accepts: +233XXXXXXXXX or 0XXXXXXXXX (Ghana format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Ghana phone number
 */
function validateGhanaPhone(phone) {
    if (!phone) return false;
    
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Ghana phone number patterns:
    // +233XXXXXXXXX (9 digits after country code)
    // 0XXXXXXXXX (10 digits total)
    const ghanaPhoneRegex = /^(\+233\d{9}|0\d{9})$/;
    
    return ghanaPhoneRegex.test(cleanPhone);
}

/**
 * Format phone number to standard Ghana format
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
function formatGhanaPhone(phone) {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    if (cleanPhone.startsWith('0')) {
        // Convert 0XXXXXXXXX to +233XXXXXXXXX
        return '+233' + cleanPhone.slice(1);
    }
    
    return cleanPhone;
}

/**
 * Switch from login to registration screen
 * @param {Event} event - Click event
 */
function switchToRegistration(event) {
    event.preventDefault();
    
    const loginScreen = document.getElementById('loginScreen');
    const registrationScreen = document.getElementById('registrationScreen');
    
    if (loginScreen) {
        loginScreen.classList.add('hidden');
    }
    if (registrationScreen) {
        registrationScreen.classList.remove('hidden');
    }
    
    // Clear registration form
    document.getElementById('registrationForm').reset();
    document.getElementById('registrationError').style.display = 'none';
}

/**
 * Switch from registration to login screen
 * @param {Event} event - Click event
 */
function switchToLogin(event) {
    event.preventDefault();
    
    const loginScreen = document.getElementById('loginScreen');
    const registrationScreen = document.getElementById('registrationScreen');
    
    if (loginScreen) {
        loginScreen.classList.remove('hidden');
    }
    if (registrationScreen) {
        registrationScreen.classList.add('hidden');
    }
    
    // Clear login form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

/**
 * Handle registration form submission
 * @param {Event} event - Form submission event
 */
function handleRegistration(event) {
    event.preventDefault();
    
    const businessName = document.getElementById('businessName').value.trim();
    const ownerName = document.getElementById('ownerName').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const errorDiv = document.getElementById('registrationError');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Validation checks
    if (!businessName) {
        showRegistrationError('Please enter your business name');
        return;
    }
    
    if (!ownerName) {
        showRegistrationError('Please enter your full name');
        return;
    }
    
    if (!phone) {
        showRegistrationError('Please enter your phone number');
        return;
    }
    
    if (!validateGhanaPhone(phone)) {
        showRegistrationError('Please enter a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)');
        return;
    }
    
    if (!password || password.length < 6) {
        showRegistrationError('Password must be at least 6 characters long');
        return;
    }
    
    if (password !== confirmPassword) {
        showRegistrationError('Passwords do not match');
        return;
    }
    
    if (!agreeTerms) {
        showRegistrationError('Please agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    // Create new user account
    const formattedPhone = formatGhanaPhone(phone);
    
    const newUser = {
        businessName: businessName,
        name: ownerName,
        phone: formattedPhone,
        role: 'owner',
        registrationTime: new Date().toISOString()
    };
    
    // Store user in session storage
    sessionStorage.setItem('gel_user', JSON.stringify(newUser));
    
    // Optional: Store business info for dashboard
    sessionStorage.setItem('gel_business_name', businessName);
    
    // Show success animation
    showRegistrationSuccess();
    
    // Reload page to show dashboard with new user
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

/**
 * Show registration error message with animation
 * @param {string} message - Error message to display
 */
function showRegistrationError(message) {
    const errorDiv = document.getElementById('registrationError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'flex';
        
        // Add shake animation
        errorDiv.style.animation = 'none';
        setTimeout(() => {
            errorDiv.style.animation = 'shake 0.4s ease-in-out';
        }, 10);
    }
}

/**
 * Show registration success message
 */
function showRegistrationSuccess() {
    const registerBtn = document.querySelector('.register-btn');
    if (registerBtn) {
        registerBtn.innerHTML = '<i class="fas fa-check-circle"></i> Account Created!';
        registerBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        registerBtn.disabled = true;
    }
}

/**
 * Handle login form submission
 * @param {Event} event - Form submission event
 */
function handleLogin(event) {
    event.preventDefault();
    
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Simple validation (in production, validate against backend)
    if (!phone || !password) {
        showLoginError('Please enter both phone number and password');
        return;
    }
    
    // Validate Ghana phone format
    if (!validateGhanaPhone(phone)) {
        showLoginError('Please enter a valid Ghana phone number (0XXXXXXXXX or +233XXXXXXXXX)');
        return;
    }
    
    // Format phone number to standard +233 format
    const formattedPhone = formatGhanaPhone(phone);
    
    // For demo purposes, accept any valid phone and password
    // In production, validate against your backend authentication API
    // Create user session
    const user = {
        name: formattedPhone,
        phone: formattedPhone,
        role: 'owner',
        loginTime: new Date().toISOString()
    };
    
    // Store in session storage (cleared when browser closes)
    sessionStorage.setItem('gel_user', JSON.stringify(user));
    
    // If remember me is checked, also store in localStorage for persistence
    if (rememberMe) {
        localStorage.setItem('gel_user_remember', JSON.stringify(user));
    }
    
    // Show success animation
    showLoginSuccess();
    
    // Reload page to reinitialize with user logged in
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

/**
 * Enter demo mode without login
 */
function enterDemoMode() {
    // Set demo mode in session storage
    sessionStorage.setItem('gel_demo_mode', 'true');
    
    // Show success animation
    const demoBtn = document.querySelector('.demo-btn');
    if (demoBtn) {
        demoBtn.innerHTML = '<i class="fas fa-check-circle"></i> Demo Mode Activated';
        demoBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
    
    // Reload page to show demo dashboard with sample data
    setTimeout(() => {
        window.location.reload();
    }, 800);
}

/**
 * Show login error message with animation
 * @param {string} message - Error message to display
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'flex';
        
        // Add shake animation
        errorDiv.style.animation = 'none';
        setTimeout(() => {
            errorDiv.style.animation = 'shake 0.4s ease-in-out';
        }, 10);
    }
}

/**
 * Show login success message
 */
function showLoginSuccess() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-check-circle"></i> Logging In...';
        loginBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        loginBtn.disabled = true;
    }
}

/**
 * Logout user - called from header
 */
function logoutUser() {
    if (businessManager) {
        businessManager.logout();
    }
}

/**
 * Update user profile
 */
function updateProfile() {
    if (!businessManager) return;
    businessManager.updateProfile();
}

/**
 * Show delete account confirmation
 */
function showDeleteAccountConfirm() {
    if (!businessManager) return;
    businessManager.showDeleteAccountConfirm();
}

/**
 * Toggle user profile dropdown menu
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const btn = document.querySelector('.user-profile-btn');
    
    if (dropdown && dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        btn.classList.add('active');
    } else if (dropdown) {
        dropdown.style.display = 'none';
        btn.classList.remove('active');
    }
}

/**
 * Close user menu when clicking outside
 */
document.addEventListener('click', (e) => {
    const userMenu = document.querySelector('.user-profile-menu');
    if (userMenu && !userMenu.contains(e.target)) {
        const dropdown = document.getElementById('userDropdown');
        const btn = document.querySelector('.user-profile-btn');
        if (dropdown) {
            dropdown.style.display = 'none';
            btn?.classList.remove('active');
        }
    }
});

/**
 * Update user info in header after login
 */
function updateUserHeaderInfo() {
    if (businessManager && businessManager.currentUser) {
        const user = businessManager.currentUser;
        const userName = user.name || user.email?.split('@')[0] || 'User';
        
        // Update header user name
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) {
            headerUserName.textContent = userName;
        }
        
        // Update dropdown user info
        document.getElementById('dropdownUserName').textContent = userName;
        
        // Display phone or email depending on how user registered
        const contactInfo = user.phone || user.email || 'demo@gel-stock.com';
        document.getElementById('dropdownUserEmail').textContent = contactInfo;
        
        // Show business name if available - update both header and dashboard
        if (user.businessName) {
            const businessInfo = document.getElementById('businessInfo');
            if (businessInfo) {
                businessInfo.textContent = user.businessName;
            }
            // Update header business name
            const headerBusinessName = document.getElementById('headerBusinessName');
            if (headerBusinessName) {
                headerBusinessName.textContent = user.businessName;
            }
        }
        
        const roleDisplay = businessManager.isDemoMode ? 'Demo Mode' : (user.role || 'User');
        document.getElementById('dropdownUserRole').textContent = roleDisplay;
    }
}

/* ===== END LOGIN & AUTHENTICATION FUNCTIONS ===== */
