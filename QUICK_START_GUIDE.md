# 🚀 Food & Beverage Management System - Quick Start Guide

## 📋 Overview
Complete guide for using the Food & Beverage Management API with Postman and REST clients.

## 🔧 Setup Instructions

### 1. Import Postman Collection
- Import `Food_Beverage_API_Collection.postman_collection.json`
- Set up environment variables

### 2. Environment Variables
```json
{
  "baseUrl": "http://localhost:5152",
  "accessToken": "",
  "refreshToken": "",
  "adminToken": "your-admin-jwt-token"
}
```

### 3. Quick Authentication Setup
1. **Login as Admin**: `🔐 Authentication → Login User`
   - Body: `{"email": "admin@system.com", "password": "Admin123!"}`
   - Test script auto-saves tokens to `{{accessToken}}` and `{{refreshToken}}`

2. **Create Regular User** (Optional):
   - `🔐 Authentication → Register New User`
   - Then login with new credentials

## 🎯 User Experience Map

### 👤 Regular User Flows (Cashier/Waiter/Branch Staff)

#### 1. Authentication & Profile
```
POST /api/Auth/login          # Login
POST /api/Auth/register       # Register
POST /api/Auth/refresh        # Token refresh
GET  /api/UserProfile/profile # View profile
PATCH /api/UserProfile/profile # Update profile
```

#### 2. Product Browsing & POS
```
GET /api/Category             # Browse categories
GET /api/Product              # View products
GET /api/Sales/products/cards # Card-style product picker
```

#### 3. Sales Order Management
```
POST /api/Sales                    # Create order
PUT  /api/Sales/{id}              # Update order
POST /api/Sales/{id}/confirm       # Confirm order
POST /api/Sales/{id}/ship          # Ship order
POST /api/Sales/{id}/deliver       # Deliver order
POST /api/Sales/{id}/cancel        # Cancel order
GET  /api/Sales                    # List orders
GET  /api/Sales/{id}               # Order details
GET  /api/Sales/status/{status}    # Filter by status
```

#### 4. Product Requests
```
POST /api/ProductRequest           # Request items
GET  /api/ProductRequest/user/{userId} # My requests
GET  /api/ProductRequest/status/{status} # Status board
```

#### 5. Movement Analytics (Read-Only)
```
GET /api/ProductMovement/analytics # Analytics dashboard
GET /api/ProductMovement/trend     # Trend analysis
```

### 👑 Admin Dashboard Flows

#### 1. System Overview
```
GET /api/admin/stats              # System KPIs
```

#### 2. User & Role Management
```
GET    /api/admin/users           # List users
POST   /api/admin/users           # Create user
PATCH  /api/admin/users/{id}      # Update user
DELETE /api/admin/users/{id}      # Delete user
POST   /api/admin/users/{userId}/roles # Assign role
DELETE /api/admin/users/{userId}/roles/{roleId} # Remove role
```

#### 3. Catalog Management
```
# Categories
GET    /api/Category              # Active categories
GET    /api/Category/all          # All categories (admin)
POST   /api/Category              # Create category
PUT    /api/Category/{id}         # Update category
DELETE /api/Category/{id}         # Soft delete
PATCH  /api/Category/{id}/restore # Restore category

# Products
GET    /api/Product               # Active products
GET    /api/Product/all           # All products (admin)
POST   /api/Product               # Create product
PUT    /api/Product/{id}          # Update product
DELETE /api/Product/{id}          # Soft delete
PUT    /api/Product/{productId}/inventory/{warehouseId} # Set inventory
```

#### 4. Warehouse Management
```
GET    /api/Warehouse             # Active warehouses
GET    /api/Warehouse/all         # All warehouses
POST   /api/Warehouse             # Create warehouse
PUT    /api/Warehouse/{id}        # Update warehouse
DELETE /api/Warehouse/{id}        # Soft delete
GET    /api/Warehouse/{id}/inventory # Warehouse inventory
```

#### 5. Purchase Management
```
GET    /api/Purchase              # List purchases
POST   /api/Purchase              # Create purchase
PUT    /api/Purchase/{id}         # Update purchase
POST   /api/Purchase/{id}/approve # Approve purchase
POST   /api/Purchase/{id}/receive # Receive purchase
POST   /api/Purchase/{id}/cancel  # Cancel purchase
GET    /api/Purchase/status/{status} # Filter by status
```

#### 6. Product Assembly (BOM)
```
GET    /api/ProductAssembly       # List assemblies
POST   /api/ProductAssembly       # Create assembly
PUT    /api/ProductAssembly/{id}  # Update assembly
GET    /api/ProductAssembly/{id}/validate # Validate materials
POST   /api/ProductAssembly/{id}/start # Start assembly
POST   /api/ProductAssembly/{id}/complete # Complete assembly
POST   /api/ProductAssembly/{id}/cancel # Cancel assembly
GET    /api/ProductAssembly/report # Assembly reports
```

#### 7. Product Request Management
```
GET    /api/ProductRequest        # List requests
POST   /api/ProductRequest/{id}/approve # Approve request
POST   /api/ProductRequest/{id}/reject # Reject request
POST   /api/ProductRequest/{id}/receive # Receive items
GET    /api/ProductRequest/stats  # Request statistics
GET    /api/ProductRequest/report # Request reports
```

#### 8. Movement & Analytics
```
POST   /api/ProductMovement/report # Flexible reports
GET    /api/ProductMovement/analytics # Analytics
GET    /api/ProductMovement/trend # Trend analysis
GET    /api/ProductMovement/filters # Available filters
GET    /api/ProductMovement/comparison # Comparison reports
GET    /api/ProductMovement/alerts # Movement alerts
POST   /api/ProductMovement # Manual adjustments
```

## 🔄 Lifecycle States & Transitions

### Purchase Orders
```
Pending → Approved → Received
   ↓         ↓         ↓
Cancelled  Cancelled  (Final)
```

### Sales Orders
```
Pending → Confirmed → Shipped → Delivered
   ↓         ↓          ↓         ↓
Cancelled  Cancelled   Cancelled  (Final)
```

### Product Assembly
```
Pending → InProgress → Completed
   ↓         ↓           ↓
Cancelled  Cancelled   (Final)
```

### Product Requests
```
Pending → Approved → Completed
   ↓         ↓          ↓
Rejected  Completed   (Final)
```

## 🎯 Recommended Implementation Order

### Phase 1: Core Setup
1. **Admin**: Create Categories
2. **Admin**: Create Products (assign categories)
3. **Admin**: Create Warehouses
4. **Admin**: Set Product Inventory per warehouse

### Phase 2: User Operations
5. **Staff**: Test Sales flow (POS)
6. **Branch User**: Create Product Requests
7. **Admin**: Approve/Receive requests

### Phase 3: Supply Chain
8. **Admin**: Create/Approve/Receive Purchases
9. **Admin**: Test Assembly (BOM) workflow

### Phase 4: Analytics
10. **BI**: Generate Movement reports
11. **BI**: Sales analytics and trends

## 🖥️ Frontend Page Structure

### User Pages
```
/login          # Authentication
/profile        # User profile
/pos            # Point of Sale (card grid)
/orders         # Sales orders list
/requests       # Product requests
```

### Admin Pages
```
/admin/dashboard    # System KPIs
/admin/users        # User management
/admin/catalog      # Categories & Products
/admin/warehouses   # Warehouse management
/admin/purchases    # Purchase management
/admin/sales        # Sales overview
/admin/assembly     # Product assembly
/admin/requests     # Request approval
/admin/analytics    # Reports & analytics
```

## 🔧 UI Button Mapping

| Action | Endpoint | Method |
|--------|----------|--------|
| Save/Update | `/api/{resource}/{id}` | PUT/PATCH |
| Enable/Disable | `/api/{resource}/{id}` | PATCH |
| Approve | `/api/{resource}/{id}/approve` | POST |
| Confirm | `/api/{resource}/{id}/confirm` | POST |
| Start | `/api/{resource}/{id}/start` | POST |
| Complete | `/api/{resource}/{id}/complete` | POST |
| Cancel | `/api/{resource}/{id}/cancel` | POST |
| Delete | `/api/{resource}/{id}` | DELETE |

## ⚠️ Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| 401 | Unauthorized | Prompt re-login |
| 403 | Forbidden | Show "No permission" |
| 404 | Not Found | Show "Not found" |
| 409 | Conflict | Show duplicate error |
| 422 | Validation | Show field errors |

## 🧪 Testing Scripts

### Postman Test Examples
```javascript
// Status check
pm.test("Status 200", () => pm.response.code === 200);

// Token capture
if (pm.response.json().accessToken) {
    pm.environment.set("accessToken", pm.response.json().accessToken);
}

// Data validation
pm.test("Has required fields", () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property('id');
    pm.expect(json).to.have.property('name');
});
```

## 🚀 Quick Start Commands

### Using cURL
```bash
# Login
curl -X POST http://localhost:5152/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.com","password":"Admin123!"}'

# Get products
curl -X GET http://localhost:5152/api/Product \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Newman (Postman CLI)
```bash
# Run full collection
newman run Food_Beverage_API_Collection.postman_collection.json \
  -e environment.json \
  --reporters cli,html
```

## 🔐 Security Notes

- **Never commit tokens** to version control
- **Use HTTPS** in production
- **Rotate tokens** regularly
- **Implement RBAC** properly
- **Validate all inputs** on both client and server

## 📊 Sample Data Flow

1. **Admin creates catalog** → Categories → Products → Inventory
2. **User browses products** → Card picker → Creates sales order
3. **Admin manages supply** → Purchases → Assembly → Stock updates
4. **Branch requests items** → Admin approves → Inventory updated
5. **Analytics track everything** → Reports → Trends → Alerts

This system provides complete end-to-end food & beverage management with proper role-based access control! 🎉
