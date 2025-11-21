# Admin Dashboard Guide - GEL-STOCK

## Overview
The GEL-STOCK Admin Dashboard provides comprehensive analytics and business metrics for tracking user registrations, products, sales, revenue, and system activity.

## Accessing the Dashboard

1. **Open the Admin Dashboard:**
   ```
   http://localhost:9000/admin/dashboard.html
   ```

2. **Enter Your Admin Key:**
   - Default admin key: `admin123`
   - This is set in `/api/admin_stats.php`
   - **IMPORTANT:** Change this in production to a secure key!

3. **Click "View Dashboard"**

## Features

### KPI Cards (Top Section)
- **Total Users** - Total registered users with new registrations today
- **Total Products** - Total products across all users with inventory value
- **Total Sales** - Total transactions with average order value
- **Total Revenue** - System revenue with revenue for today

### Recent Registrations Table
Shows the last 100 registered users with:
- Name and phone number
- Email address
- Registration date
- Last login date

### Sales by Payment Method
Breakdown of sales transactions by payment method:
- Number of sales per method
- Total amount per method
- Payment methods: Cash, Card, Mobile Money, Credit, etc.

### Products by Category
Inventory organized by product category:
- Number of products per category
- Total stock units per category

### Top Products
Most popular products across all users:
- Product name and SKU
- Number of users with this product
- Average stock levels

### System Activity (Last 24 Hours)
Real-time metrics including:
- Active users
- Product adders
- Sellers/transaction makers
- New users (weekly and monthly)
- Database size

## Changing the Admin Key

### In Production:
1. Set environment variable in your server:
   ```bash
   export GEL_STOCK_ADMIN_KEY="your-secure-key-here"
   ```

2. Or edit `/api/admin_stats.php` line 14:
   ```php
   $ADMIN_KEY = getenv('GEL_STOCK_ADMIN_KEY') ?: 'your-secure-key-here';
   ```

### Recommended Security:
- Use a long, random string (20+ characters)
- Include numbers, uppercase, lowercase, special characters
- Change it regularly
- Don't share it in code commits

Example secure key: `Gl-Stk@2024!Admin#Secure`

## API Endpoints

The dashboard calls `/api/admin_stats.php` with the following structure:

```javascript
GET /api/admin_stats.php?type=all&adminKey=admin123
```

Response format:
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "users": {...},
    "products": {...},
    "sales": {...},
    "revenue": {...},
    "activity": {...}
  },
  "timestamp": "2024-01-15 10:30:45"
}
```

## Data Tracked

### Users Section
- Total registered count
- Daily registrations
- Recent user profiles
- Last login information

### Products Section
- Total product count
- Inventory value
- Category breakdown
- Top products by popularity

### Sales Section
- Total sales transactions
- Average order value
- Payment method breakdown

### Revenue Section
- Total revenue (all-time)
- Today's revenue
- Monthly revenue
- Yearly revenue

### Activity Section
- 24-hour active users
- Product additions last 24h
- Sales transactions last 24h
- Weekly new users
- Monthly new users
- Database size

## Troubleshooting

### Dashboard Not Loading
1. Check browser console (F12) for JavaScript errors
2. Verify admin key is correct
3. Ensure `/api/admin_stats.php` file exists
4. Check database connection in `/api/config.php`

### "Unauthorized - Invalid admin key"
- Admin key entered doesn't match the one in `admin_stats.php`
- Default key is `admin123`
- Change it if you've modified the file

### No Data Showing
- User products/sales tables may not be created yet
- Run `/api/user_data_schema.sql` to create tables
- Or wait for first user to register and add data

### Database Size Shows 0
- Tables may not have been queried yet
- Add some test data (products/sales)
- Database size updates after 10+ transactions

## Performance Notes

- Dashboard loads all data in one request
- For large installations (1000+ users), may take 5-10 seconds
- Consider adding pagination for user listings in future updates
- Database queries use indexes on critical fields

## Next Steps

1. **Deploy to production server** - gel-stock.me
2. **Update admin key** - Use secure key in production
3. **Monitor regularly** - Check dashboard weekly for metrics
4. **Backup data** - Regular MySQL backups recommended
5. **Scale dashboard** - Add more detailed analytics pages as needed

## Support

For issues with the admin dashboard:
1. Check `/api/admin_stats.php` exists and is readable
2. Verify database tables exist: `user_products`, `user_sales`, `users`
3. Check `/api/config.php` for database connection settings
4. Review browser console for JavaScript errors
5. Test API directly: `http://localhost:9000/api/admin_stats.php?type=all&adminKey=admin123`
