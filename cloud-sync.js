/**
 * Cloud Sync Module for GEL-STOCK Demo Data
 * Syncs products and sales across devices using Firebase Realtime Database
 */

// Firebase Configuration
// NOTE: These are placeholder values. For production, use environment variables.
// DO NOT commit real API keys to public repositories!
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY_HERE",
    authDomain: "gel-stock-demo.firebaseapp.com",
    projectId: "gel-stock-demo",
    storageBucket: "gel-stock-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef1234567890"
};

// Initialize Firebase (will be loaded from CDN)
let db = null;
let firebaseReady = false;

/**
 * Initialize Firebase connection
 */
function initializeFirebaseSync() {
    // Firebase script tags will be added to HTML
    // This function will be called after Firebase is loaded
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        firebaseReady = true;
        console.log('Cloud sync initialized successfully');
        
        // Start listening for changes
        setupRealtimeListeners();
    } catch (error) {
        console.warn('Cloud sync initialization failed:', error);
        // Fall back to localStorage
        firebaseReady = false;
    }
}

/**
 * Setup realtime listeners for products and sales
 */
function setupRealtimeListeners() {
    if (!firebaseReady || !db) return;

    // Listen for product changes
    db.ref('demo/products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            localStorage.setItem('gel_stock_products', JSON.stringify(data));
            // Trigger update event
            window.dispatchEvent(new CustomEvent('cloud-sync-products', { detail: data }));
        }
    }, (error) => {
        console.warn('Error listening to products:', error);
    });

    // Listen for sales changes
    db.ref('demo/sales').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            localStorage.setItem('gel_stock_sales', JSON.stringify(data));
            // Trigger update event
            window.dispatchEvent(new CustomEvent('cloud-sync-sales', { detail: data }));
        }
    }, (error) => {
        console.warn('Error listening to sales:', error);
    });
}

/**
 * Sync products to cloud
 * @param {Array} products - Products array to sync
 */
function syncProductsToCloud(products) {
    if (!firebaseReady || !db) {
        console.log('Cloud sync not available, using local storage only');
        return Promise.resolve();
    }

    return db.ref('demo/products').set(products)
        .catch(error => {
            console.warn('Error syncing products to cloud:', error);
            // Still save locally even if cloud sync fails
        });
}

/**
 * Sync sales to cloud
 * @param {Array} sales - Sales array to sync
 */
function syncSalesToCloud(sales) {
    if (!firebaseReady || !db) {
        console.log('Cloud sync not available, using local storage only');
        return Promise.resolve();
    }

    return db.ref('demo/sales').set(sales)
        .catch(error => {
            console.warn('Error syncing sales to cloud:', error);
            // Still save locally even if cloud sync fails
        });
}

/**
 * Sync a single product to cloud
 * @param {Object} product - Product to sync
 */
function syncProductToCloud(product) {
    if (!firebaseReady || !db || !product.id) return Promise.resolve();

    return db.ref(`demo/products/${product.id}`).set(product)
        .catch(error => {
            console.warn('Error syncing product to cloud:', error);
        });
}

/**
 * Sync a single sale to cloud
 * @param {Object} sale - Sale to sync
 */
function syncSaleToCloud(sale) {
    if (!firebaseReady || !db || !sale.id) return Promise.resolve();

    return db.ref(`demo/sales/${sale.id}`).set(sale)
        .catch(error => {
            console.warn('Error syncing sale to cloud:', error);
        });
}

/**
 * Get products from cloud or local storage
 * @returns {Promise<Array>} Products array
 */
function getProductsSync() {
    if (!firebaseReady || !db) {
        return Promise.resolve(JSON.parse(localStorage.getItem('gel_stock_products') || '[]'));
    }

    return db.ref('demo/products').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (data) {
                localStorage.setItem('gel_stock_products', JSON.stringify(data));
                return data;
            }
            return JSON.parse(localStorage.getItem('gel_stock_products') || '[]');
        })
        .catch(error => {
            console.warn('Error fetching products from cloud:', error);
            return JSON.parse(localStorage.getItem('gel_stock_products') || '[]');
        });
}

/**
 * Get sales from cloud or local storage
 * @returns {Promise<Array>} Sales array
 */
function getSalesSync() {
    if (!firebaseReady || !db) {
        return Promise.resolve(JSON.parse(localStorage.getItem('gel_stock_sales') || '[]'));
    }

    return db.ref('demo/sales').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (data) {
                localStorage.setItem('gel_stock_sales', JSON.stringify(data));
                return data;
            }
            return JSON.parse(localStorage.getItem('gel_stock_sales') || '[]');
        })
        .catch(error => {
            console.warn('Error fetching sales from cloud:', error);
            return JSON.parse(localStorage.getItem('gel_stock_sales') || '[]');
        });
}

// Export functions for global use
window.CloudSync = {
    initializeFirebaseSync,
    syncProductsToCloud,
    syncSalesToCloud,
    syncProductToCloud,
    syncSaleToCloud,
    getProductsSync,
    getSalesSync,
    isReady: () => firebaseReady
};
