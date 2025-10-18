# Postman Troubleshooting Guide - Heritage Store Management API

## ✅ **Current Status: WORKING PERFECTLY**

The API is now fully functional! Here's what was fixed and how to use it properly.

## 🔧 **Issues That Were Fixed**

### 1. **Backend Server Not Running**
**Problem**: `dotnet run` was executed from wrong directory
**Solution**: Always run from `/Users/osz/Desktop/diploma/gradproject/Api`

### 2. **Port Already in Use**
**Problem**: Multiple instances trying to use port 5152
**Solution**: Kill existing processes before starting new ones

### 3. **Wrong Login Credentials**
**Problem**: Postman collection had incorrect email
**Solution**: Updated to correct credentials

## 🚀 **How to Start Backend Properly**

### **Step 1: Kill Existing Processes**
```bash
# Kill any existing dotnet processes
pkill -f "dotnet run"

# Kill processes using port 5152
lsof -ti:5152 | xargs kill -9
```

### **Step 2: Start Backend**
```bash
# Navigate to Api directory
cd /Users/osz/Desktop/diploma/gradproject/Api

# Start the server
dotnet run --urls=http://localhost:5152
```

### **Step 3: Verify Server is Running**
```bash
# Test health endpoint
curl http://localhost:5152/api/Health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0","environment":"Development"}
```

## 📋 **Postman Setup Guide**

### **Step 1: Import Collection**
1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `Heritage_Store_Management_API.postman_collection.json`

### **Step 2: Create Environment**
1. Click "Environments" → "Create Environment"
2. Name: "Heritage Store Development"
3. Add variables:
   - `baseUrl`: `http://localhost:5152`
   - `authToken`: (leave empty, will be auto-filled)

### **Step 3: Test Login**
1. Go to "Authentication" → "Login"
2. Click "Send"
3. **Expected Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "expiresAt": "2025-10-12T19:33:23.631609Z",
  "user": {
    "id": 2,
    "fullName": "John Admin",
    "email": "admin@company.com",
    "isActive": true,
    "roles": ["SuperAdmin"],
    "assignedStoreId": null
  }
}
```

### **Step 4: Test Protected Endpoints**
1. Try "Users Management" → "Get All Users"
2. Try "Products Management" → "Get All Products"
3. All requests should work automatically with the saved token

## 🔐 **Correct Login Credentials**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **SuperAdmin** | `admin@company.com` | `admin123` | Full system access |
| **StoreManager** | `sarah.store1@company.com` | `manager123` | Store-specific access |
| **Cashier** | `tom.store1@company.com` | `cashier123` | POS operations |
| **Customer** | `alice.customer@company.com` | `customer123` | Online shopping |

## 🧪 **Testing Workflow**

### **1. Health Check**
```bash
curl http://localhost:5152/api/Health
```

### **2. Login Test**
```bash
curl -X POST http://localhost:5152/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```

### **3. Protected Endpoint Test**
```bash
curl -X GET http://localhost:5152/api/Users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Couldn't connect to server"**
**Cause**: Backend not running
**Solution**: 
```bash
cd /Users/osz/Desktop/diploma/gradproject/Api
dotnet run --urls=http://localhost:5152
```

### **Issue 2: "Address already in use"**
**Cause**: Port 5152 already occupied
**Solution**:
```bash
lsof -ti:5152 | xargs kill -9
dotnet run --urls=http://localhost:5152
```

### **Issue 3: "Invalid email or password"**
**Cause**: Wrong credentials
**Solution**: Use `admin@company.com` / `admin123`

### **Issue 4: "Unauthorized" on protected endpoints**
**Cause**: Missing or invalid JWT token
**Solution**: 
1. Login first to get token
2. Ensure token is saved in environment variable
3. Check if token is expired (60 minutes)

### **Issue 5: "Forbidden" on role-based endpoints**
**Cause**: Insufficient permissions
**Solution**: Use appropriate user credentials for the endpoint

## 📊 **API Endpoints Status**

| Endpoint | Method | Auth Required | Roles Allowed | Status |
|----------|--------|---------------|---------------|---------|
| `/api/Health` | GET | ❌ | None | ✅ Working |
| `/api/Auth/login` | POST | ❌ | None | ✅ Working |
| `/api/Users` | GET | ✅ | SuperAdmin, StoreManager | ✅ Working |
| `/api/Product` | GET | ✅ | All authenticated | ✅ Working |
| `/api/Dashboard/stats` | GET | ✅ | All authenticated | ✅ Working |
| `/api/Sales` | GET | ✅ | SuperAdmin, StoreManager | ✅ Working |
| `/api/Purchase` | GET | ✅ | SuperAdmin, StoreManager | ✅ Working |
| `/api/Reports/sales` | GET | ✅ | SuperAdmin, StoreManager | ✅ Working |

## 🔍 **Debugging Tips**

### **1. Check Server Logs**
Look for error messages in the terminal where `dotnet run` is executing.

### **2. Verify JWT Token**
Decode your JWT token at [jwt.io](https://jwt.io) to check:
- Expiration time
- Role claims
- User ID

### **3. Test with curl**
Use curl commands to isolate issues:
```bash
# Test without authentication
curl http://localhost:5152/api/Health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5152/api/Users
```

### **4. Check Environment Variables**
In Postman, ensure:
- `baseUrl` is set to `http://localhost:5152`
- `authToken` is populated after login

## 🎯 **Success Indicators**

✅ **Backend Running**: Health endpoint returns 200 OK
✅ **Login Working**: Returns JWT token and user info
✅ **Authorization Working**: Protected endpoints return data
✅ **Role-Based Access**: Different users see appropriate data

## 📝 **Quick Reference**

### **Start Backend**
```bash
cd /Users/osz/Desktop/diploma/gradproject/Api
dotnet run --urls=http://localhost:5152
```

### **Test Login**
```bash
curl -X POST http://localhost:5152/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```

### **Test Users Endpoint**
```bash
curl -X GET http://localhost:5152/api/Users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

The API is now fully functional and ready for testing! 🚀✨
