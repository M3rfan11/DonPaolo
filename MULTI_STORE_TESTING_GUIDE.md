# 🏪 Multi-Store System Testing Guide

## 🚀 Quick Start Testing

### 1. **Start the Services**
```bash
# Terminal 1 - Backend (already running on port 5152)
cd /Users/osz/Desktop/diploma/gradproject/Api
dotnet run

# Terminal 2 - Frontend (already running on port 3000)
cd /Users/osz/Desktop/diploma/gradproject/frontend
npm start
```

### 2. **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5152

---

## 🧪 Complete Testing Workflow

### **Step 1: Login as Super Admin**
1. Go to http://localhost:3000
2. Login with admin credentials:
   - **Email**: `admin@example.com`
   - **Password**: `Admin123!`

### **Step 2: Create Multiple Stores**
1. Navigate to **"Store Management"** (admin-only menu)
2. Click **"Add Store"**
3. Create stores like:
   - **Store 1**: "Downtown Store" (123 Main St, New York)
   - **Store 2**: "Mall Location" (456 Mall Ave, Los Angeles)
   - **Store 3**: "Airport Kiosk" (789 Airport Blvd, Chicago)

### **Step 3: Create Store-Specific Users**
1. Go to **"Users"** page
2. Create new users for each store:
   - **Store Admin**: `storeadmin1@test.com` (assign to Downtown Store)
   - **Cashier 1**: `cashier1@test.com` (assign to Downtown Store)
   - **Store Admin 2**: `storeadmin2@test.com` (assign to Mall Location)
   - **Cashier 2**: `cashier2@test.com` (assign to Mall Location)

### **Step 4: Assign Users to Stores**
1. Go back to **"Store Management"**
2. For each store, click **"Manage Users"**
3. Assign the created users to their respective stores
4. Assign appropriate roles (Admin, Cashier, etc.)

### **Step 5: Test Store-Specific Access**
1. **Logout** from admin account
2. **Login as Store Admin 1** (`storeadmin1@test.com`)
3. Navigate to **"Store Dashboard"** for their assigned store
4. Verify they only see data for their specific store

### **Step 6: Test Direct Sales**
1. **Login as Cashier 1** (`cashier1@test.com`)
2. Go to their **Store Dashboard**
3. Click **"Direct Sale"**
4. Create a direct sale:
   - Customer: "John Doe"
   - Add products from the store
   - Complete the sale
5. Verify inventory is reduced automatically

### **Step 7: Test Multi-Store Order Management**
1. **Login as regular user** (create one if needed)
2. Go to **POS** page
3. Create an order (this goes to admin dashboard)
4. **Login as admin** and process the order
5. Verify order appears in the correct store's dashboard

---

## 🔍 API Testing with cURL

### **Test Store Management APIs**

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:5152/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | jq -r '.accessToken')

# Get all stores
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5152/api/StoreManagement/stores

# Create a new store
curl -X POST http://localhost:5152/api/StoreManagement/stores \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store",
    "address": "123 Test St",
    "city": "Test City",
    "phoneNumber": "555-0123",
    "managerName": "Test Manager"
  }'

# Get store dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5152/api/StoreManagement/stores/1/dashboard
```

### **Test Direct Sales APIs**

```bash
# Get store products
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5152/api/DirectSales/store/1/products

# Create direct sale
curl -X POST http://localhost:5152/api/DirectSales/create-sale \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": 1,
    "customerName": "Test Customer",
    "customerEmail": "customer@test.com",
    "customerPhone": "555-0123",
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 10.00
      }
    ]
  }'

# Get store direct sales
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5152/api/DirectSales/store/1
```

---

## 🎯 Key Features to Test

### **✅ Store Management**
- [ ] Create/edit/delete stores
- [ ] Assign users to stores
- [ ] Remove users from stores
- [ ] View store dashboards

### **✅ Store-Specific Access Control**
- [ ] Store admins only see their store data
- [ ] Cashiers only access their assigned store
- [ ] Super admins can access all stores

### **✅ Direct Sales**
- [ ] Cashiers can create direct sales
- [ ] Inventory automatically reduces
- [ ] Sales are immediately completed
- [ ] Order numbers start with "DS"

### **✅ Multi-Store Inventory**
- [ ] Each store has separate inventory
- [ ] Products can be in multiple stores
- [ ] Low stock alerts per store
- [ ] Store-specific product availability

### **✅ Order Management**
- [ ] Online orders go to admin dashboard
- [ ] Direct sales appear in store dashboards
- [ ] Order tracking works across stores
- [ ] Shipping/delivery buttons work

---

## 🐛 Common Issues & Solutions

### **Issue**: "You don't have access to this store"
**Solution**: Make sure user is assigned to the correct store in Store Management

### **Issue**: "Store not found"
**Solution**: Verify store ID exists and user has proper permissions

### **Issue**: "Insufficient stock"
**Solution**: Check inventory levels in the specific store's warehouse

### **Issue**: Frontend compilation errors
**Solution**: Make sure all imports are correct and DataGrid is imported from @mui/x-data-grid

---

## 📊 Expected Results

### **Super Admin Dashboard**
- Can see all stores
- Can manage all users
- Can access all store dashboards
- Can process orders from any store

### **Store Admin Dashboard**
- Only sees their assigned store
- Can view store-specific inventory
- Can see store-specific sales
- Can manage store products

### **Cashier Dashboard**
- Only sees their assigned store
- Can create direct sales
- Can view store products
- Cannot access other stores

### **Regular User**
- Can place orders via POS
- Orders go to admin for processing
- Can track their orders
- Cannot access store management

---

## 🎉 Success Criteria

The multi-store system is working correctly when:

1. ✅ **Multiple stores can be created and managed**
2. ✅ **Users are properly assigned to specific stores**
3. ✅ **Store-specific access control works**
4. ✅ **Direct sales reduce inventory correctly**
5. ✅ **Online orders integrate with store management**
6. ✅ **Each store operates independently**
7. ✅ **Super admin can oversee all stores**

---

## 🚀 Next Steps

Once testing is complete, you can:

1. **Add more stores** as needed
2. **Create store-specific promotions**
3. **Implement store-to-store transfers**
4. **Add store performance analytics**
5. **Integrate with external shipping providers**

The multi-store system is now ready for production use! 🎊














