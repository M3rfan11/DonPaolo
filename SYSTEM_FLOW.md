# 🎯 POS System Flow - Complete Guide

## 📋 System Overview

This is a simplified POS (Point of Sale) system with sales reporting. The system has two main components:
1. **POS System** - For processing sales transactions
2. **Sales Reports** - For viewing sales analytics and reports

---

## 🔐 1. Authentication Flow

### Step 1: Login
```
User → Login Page (/login)
  ↓
Enter Email & Password
  ↓
POST /api/Auth/login
  ↓
Backend validates credentials
  ↓
Returns JWT Token + User Info
  ↓
Token stored in localStorage
  ↓
Redirect to POS (/pos)
```

**Default Users (from seed data):**
- **Admin**: `admin@system.com` / `Admin123!`
- **Cashier**: `cashier@system.com` / `Cashier123!`

---

## 🛒 2. POS Transaction Flow

### Step 1: Load Products
```
User opens POS page
  ↓
GET /api/POS/products
  ↓
Backend returns available products (with POS stock > 0)
  ↓
Products displayed in grid/cards
```

**Product Filtering:**
- Only shows products with `POSQuantity > 0`
- Filtered by user's assigned store (if Cashier)
- SuperAdmin sees all products

### Step 2: Add Items to Cart
```
User clicks product card
  ↓
Product added to cart
  ↓
User can adjust quantity
  ↓
Cart shows: Product, Quantity, Unit Price, Total
```

### Step 3: Customer Information (Optional)
```
User can enter:
  - Customer Name
  - Customer Phone (triggers lookup)
  - Customer Email
  - Customer Address
```

**Customer Lookup:**
- If phone number entered → `GET /api/Customer/lookup/{phone}`
- If customer found → Auto-fill name, email, address
- If not found → User can enter new customer info

### Step 4: Apply Discounts & Tax
```
User can optionally set:
  - Discount Amount
  - Tax Amount
```

**Calculation:**
- Subtotal = Sum of all cart items
- Final Total = Subtotal - Discount + Tax

### Step 5: Select Payment Method
```
User selects:
  - Cash (default)
  - Card
  - Other payment methods
```

### Step 6: Process Sale
```
User clicks "Complete Sale"
  ↓
POST /api/POS/sale
  Body: {
    customerName, customerPhone, customerEmail,
    items: [{productId, quantity, unitPrice, totalPrice}],
    totalAmount, discountAmount, taxAmount, finalAmount,
    paymentMethod
  }
  ↓
Backend Processing:
  1. Validates user has assigned store
  2. Generates unique sale number (POS20251113XXXX)
  3. Starts database transaction
  4. Creates/updates customer record
  5. Creates SalesOrder record
  6. For each item:
     - Checks inventory availability
     - Deducts POSQuantity from ProductInventory
     - Creates SalesItem record
  7. Commits transaction
  8. Creates audit log
  9. Updates revenue tracking
  ↓
Returns Sale Response with:
  - Sale Number
  - Sale ID
  - Customer Info
  - Items List
  - Totals
  - Cashier Name
  - Store Name
  ↓
Frontend shows receipt dialog
  ↓
User can print receipt
  ↓
Cart cleared, ready for next sale
```

**Transaction Safety:**
- All operations in database transaction
- If any step fails → entire transaction rolled back
- Inventory only deducted on successful sale

---

## 📊 3. Sales Reports Flow

### Step 1: Navigate to Reports
```
User clicks "Reports" in navigation
  ↓
Navigate to /reports
  ↓
Reports page loads
```

### Step 2: Set Filters
```
User can filter by:
  - Year (default: current year)
  - Quarter (Q1, Q2, Q3, Q4) - optional
  - Store - optional (if SuperAdmin)
```

### Step 3: Load Report
```
User clicks "Apply Filters" or filters auto-apply
  ↓
GET /api/Reports/sales?year=2025&quarter=1&storeId=1
  ↓
Backend Processing:
  1. Gets all sales orders for the year
  2. Applies quarter filter if specified
  3. Applies store filter if specified
  4. Calculates quarterly breakdown (Q1-Q4)
  5. Calculates top products
  6. Calculates store performance
  7. Calculates overall statistics
  ↓
Returns Sales Report with:
  - Total Sales
  - Total Orders
  - Average Order Value
  - Quarterly Data (4 quarters)
  - Top Products (by revenue)
  - Store Performance
  ↓
Frontend displays:
  - Summary cards (Total Sales, Orders, Avg Order, Store)
  - Quarterly breakdown cards
  - Top products table
  - Store performance table
```

---

## 🔄 4. Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                            │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   POS Page   │         │ Reports Page │                │
│  │   (/pos)     │         │  (/reports)  │                │
│  └──────┬───────┘         └──────┬───────┘                │
└─────────┼─────────────────────────┼────────────────────────┘
          │                         │
          │ API Calls               │ API Calls
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│  ┌──────────────┐         ┌──────────────┐                │
│  │POSController │         │ReportsCtrl   │                │
│  └──────┬───────┘         └──────┬───────┘                │
└─────────┼─────────────────────────┼────────────────────────┘
          │                         │
          │ Database Operations      │ Database Queries
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │SalesOrders   │  │SalesItems    │  │ProductInv   │    │
│  │Customers     │  │Products      │  │Warehouses    │    │
│  │Users         │  │Categories    │  │AuditLogs    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 5. Key Database Tables

### SalesOrders
- Stores each completed sale
- Fields: OrderNumber, CustomerName, TotalAmount, Status, PaymentStatus, CreatedByUserId, OrderDate

### SalesItems
- Stores individual items in each sale
- Fields: SalesOrderId, ProductId, Quantity, UnitPrice, TotalPrice, WarehouseId

### ProductInventories
- Tracks stock levels per product per warehouse
- Fields: ProductId, WarehouseId, Quantity, POSQuantity
- **POSQuantity** is deducted when sale is processed

### Customers
- Stores customer information
- Auto-created when phone number is provided in sale

---

## 🎯 6. User Roles & Permissions

### Cashier
- ✅ Access POS system
- ✅ Process sales
- ✅ View sales reports
- ❌ Cannot access other features

### SuperAdmin
- ✅ Access POS system
- ✅ Process sales
- ✅ View all sales reports (all stores)
- ✅ Can filter reports by any store

---

## 🔍 7. Important Features

### Inventory Management
- Products must have `POSQuantity > 0` to appear in POS
- When sale is processed, `POSQuantity` is deducted
- If insufficient stock → sale is rejected

### Customer Management
- Customers auto-created from sales
- Phone number lookup finds existing customers
- Customer data persists for future sales

### Sale Numbering
- Format: `POS{YYYYMMDD}{XXXX}`
- Example: `POS202511130001`
- Auto-incremented per day

### Audit Trail
- Every sale creates audit log entry
- Tracks: Who, What, When, IP Address, User Agent

---

## 🚀 8. Quick Start Flow

1. **Start the system**
   ```bash
   ./start_full_system.sh
   ```

2. **Login**
   - Go to http://localhost:3000
   - Login with: `cashier@system.com` / `Cashier123!`

3. **Process a Sale**
   - Click "POS" in navigation
   - Select products from grid
   - Add to cart
   - Enter customer info (optional)
   - Click "Complete Sale"
   - View receipt

4. **View Reports**
   - Click "Reports" in navigation
   - Select year/quarter filters
   - View sales analytics

---

## 📊 9. Report Features

### Sales Report Includes:
- **Summary Statistics**
  - Total Sales (revenue)
  - Total Orders (count)
  - Average Order Value

- **Quarterly Breakdown**
  - Q1, Q2, Q3, Q4 data
  - Sales per quarter
  - Orders per quarter
  - Average order value per quarter

- **Top Products**
  - Ranked by revenue
  - Shows quantity sold and total revenue

- **Store Performance**
  - Sales per store
  - Average order value per store

---

## ⚠️ 10. Important Notes

1. **Store Assignment**: Cashiers must be assigned to a store to process sales
2. **Inventory**: Only products with POS stock can be sold
3. **Transactions**: All sales are atomic (all-or-nothing)
4. **Customer Data**: Customers are auto-created from sales
5. **Reports**: Based on completed sales orders only

---

## 🔗 API Endpoints Used

### Authentication
- `POST /api/Auth/login` - User login

### POS
- `GET /api/POS/products` - Get available products
- `POST /api/POS/sale` - Process sale transaction
- `GET /api/Customer/lookup/{phone}` - Lookup customer by phone

### Reports
- `GET /api/Reports/sales` - Get sales report with filters

---

This flow ensures a simple, focused POS system with comprehensive sales reporting! 🎉


