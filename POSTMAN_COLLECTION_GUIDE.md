# Heritage Store Management API - Postman Collection Guide

## Quick Start

### 1. Import Collection
- Open Postman
- Click "Import" → "Upload Files"
- Select `Heritage_Store_Management_API.postman_collection.json`

### 2. Set Environment Variables
- Create new environment: "Heritage Store Development"
- Add variables:
  - `baseUrl`: `http://localhost:5152`
  - `authToken`: (will be set automatically after login)

### 3. Authentication Flow
1. **Login** → `POST /api/Auth/login`
   - Use credentials: `admin@company.com` / `admin123`
   - Token will be automatically saved to `authToken` variable

2. **All other requests** will automatically use the bearer token

## API Endpoints Overview

### 🔐 Authentication
- `POST /api/Auth/login` - User login
- `POST /api/Auth/register` - User registration
- `POST /api/Auth/refresh` - Refresh JWT token

### 📊 Dashboard
- `GET /api/Dashboard/stats` - Get dashboard statistics
- `GET /api/Dashboard/recent-activities` - Get recent activities

### 👥 Users Management (SuperAdmin only)
- `GET /api/Users` - Get all users
- `GET /api/Users/{id}` - Get user by ID
- `POST /api/Users` - Create new user
- `PUT /api/Users/{id}` - Update user
- `DELETE /api/Users/{id}` - Delete user

### 🛍️ Products Management
- `GET /api/Product` - Get all products
- `GET /api/Product/{id}` - Get product by ID
- `POST /api/Product` - Create new product
- `PUT /api/Product/{id}` - Update product
- `DELETE /api/Product/{id}` - Delete product

### 📦 Inventory Management
- `GET /api/ProductInventory` - Get all inventory
- `GET /api/ProductInventory/store/{storeId}` - Get inventory by store
- `PUT /api/ProductInventory/{id}` - Update inventory

### 💰 Sales Management
- `GET /api/Sales` - Get all sales orders
- `GET /api/Sales/{id}` - Get sales order by ID
- `POST /api/Sales` - Create sales order

### 🛒 Purchase Management
- `GET /api/Purchase` - Get all purchase orders
- `GET /api/Purchase/{id}` - Get purchase order by ID
- `POST /api/Purchase` - Create purchase order

### 📋 Product Requests
- `GET /api/ProductRequest` - Get all requests
- `POST /api/ProductRequest` - Create request
- `PUT /api/ProductRequest/{id}/approve` - Approve request

### 🔧 Product Assembly
- `GET /api/ProductAssembly` - Get all assemblies
- `POST /api/ProductAssembly` - Create assembly

### 🏪 POS System
- `GET /api/POS/products` - Get POS products
- `POST /api/POS/sale` - Process sale

### 📈 Reports & Analytics
- `GET /api/Reports/sales` - Get sales report
- `GET /api/Reports/purchases` - Get purchase report
- `GET /api/Reports/peak-sales` - Get peak sales analysis

### 🏷️ Categories
- `GET /api/Category` - Get all categories
- `POST /api/Category` - Create category

### 🏬 Stores/Warehouses
- `GET /api/Warehouse` - Get all stores
- `POST /api/Warehouse` - Create store

### 👤 Customer Orders
- `GET /api/CustomerOrder` - Get all customer orders
- `POST /api/CustomerOrder` - Create customer order

### ❤️ Health Check
- `GET /api/Health` - Health check endpoint

## Sample Request Bodies

### Login Request
```json
{
  "email": "admin@company.com",
  "password": "admin123"
}
```

### Create Product Request
```json
{
  "name": "Heritage Perfume",
  "description": "Premium fragrance collection",
  "price": 99.99,
  "categoryId": 1,
  "sku": "HP001",
  "isActive": true
}
```

### Create Sales Order Request
```json
{
  "customerName": "John Customer",
  "customerEmail": "john@example.com",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 99.99
    }
  ]
}
```

### Create Purchase Order Request
```json
{
  "supplierName": "Supplier Co",
  "supplierEmail": "supplier@example.com",
  "items": [
    {
      "productId": 1,
      "quantity": 10,
      "unitPrice": 50.00
    }
  ]
}
```

### Create Product Request
```json
{
  "requestType": "Restock",
  "priority": "High",
  "items": [
    {
      "productId": 1,
      "requestedQuantity": 20,
      "reason": "Low stock"
    }
  ]
}
```

### Create Assembly Request
```json
{
  "name": "Heritage Gift Set",
  "description": "Premium gift set",
  "salePrice": 199.99,
  "isActive": true,
  "materials": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
```

### POS Sale Request
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 99.99
    }
  ],
  "paymentMethod": "Cash",
  "customerName": "Walk-in Customer"
}
```

## Role-Based Access

### SuperAdmin
- Full access to all endpoints
- User management
- Store management
- All reports and analytics

### StoreManager
- Store-specific operations
- Inventory management
- Sales and purchase orders
- Reports for assigned store

### Cashier
- POS operations
- Product requests
- Limited inventory access

### Customer
- Customer orders
- Product browsing
- Order tracking

## Testing Workflow

1. **Start Backend**: `dotnet run` in Api directory
2. **Login**: Use admin credentials to get token
3. **Test Endpoints**: Go through each category systematically
4. **Verify Responses**: Check status codes and response data
5. **Test Error Cases**: Try invalid data, unauthorized access

## Common Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Troubleshooting

### Authentication Issues
- Ensure backend is running on correct port
- Check if token is properly set in environment
- Verify login credentials

### CORS Issues
- Check if CORS is configured in backend
- Ensure frontend URL is allowed

### Database Issues
- Verify database connection
- Check if migrations are applied
- Ensure seed data is loaded

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:5152` |
| `authToken` | JWT authentication token | Auto-set after login |
| `refreshToken` | Token refresh token | Auto-set after login |

## Collection Features

- **Automatic Token Management**: Login automatically saves token
- **Environment Variables**: Easy switching between environments
- **Pre-configured Requests**: All endpoints ready to use
- **Sample Data**: Realistic request bodies included
- **Error Handling**: Proper error response examples

This collection provides a complete testing suite for your Heritage Store Management API!
