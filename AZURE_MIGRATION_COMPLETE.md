# Azure SQL Database Migration Guide - Heritage Store Management System

## 🎯 **Current Status: Ready for Azure SQL Migration**

Your project has been successfully updated to use Azure SQL Server instead of SQLite. Here's what you need to do next:

## 📋 **Step-by-Step Azure Setup**

### **Step 1: Get Your Azure SQL Connection Details**

In Azure Data Studio, you need to get your connection details:

1. **Server Name**: `your-azure-sql-server.database.windows.net`
2. **Database Name**: `heritage-store-db` (create this)
3. **Username**: Your admin username
4. **Password**: Your admin password

### **Step 2: Update Connection String**

Replace the placeholder connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:YOUR_SERVER_NAME.database.windows.net,1433;Initial Catalog=heritage-store-db;Persist Security Info=False;User ID=YOUR_USERNAME;Password=YOUR_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

**Example:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:heritage-store-server.database.windows.net,1433;Initial Catalog=heritage-store-db;Persist Security Info=False;User ID=heritageadmin;Password=MyStrongPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

### **Step 3: Create Database in Azure**

In Azure Data Studio:

1. **Connect to your Azure SQL Server**
2. **Right-click on your server** → "New Query"
3. **Run this SQL command:**
```sql
CREATE DATABASE [heritage-store-db];
```

### **Step 4: Apply Migrations**

Run these commands in your terminal:

```bash
cd /Users/osz/Desktop/diploma/gradproject/Api

# Apply migrations to create tables
dotnet ef database update

# Start the application
dotnet run
```

### **Step 5: Verify Migration**

The application will automatically:
- ✅ Create all database tables
- ✅ Seed initial data (users, roles, products, etc.)
- ✅ Start the API server

## 🔧 **What's Already Done**

### **✅ Package Updates**
- Added `Microsoft.EntityFrameworkCore.SqlServer`
- Removed `Microsoft.EntityFrameworkCore.Sqlite`
- Updated `Program.cs` to use SQL Server
- Removed SQLite-specific code

### **✅ Migration Created**
- Created `InitialAzureSqlMigration` for SQL Server
- Removed old SQLite migrations
- Fixed all compilation errors

### **✅ Configuration Updated**
- Updated `appsettings.json` with Azure SQL connection string template
- Configured SQL Server options in `Program.cs`

## 🚀 **Next Steps**

### **1. Get Your Azure Credentials**
From Azure Portal or Azure Data Studio:
- Server name
- Username
- Password
- Database name

### **2. Update Connection String**
Replace the placeholder values in `appsettings.json`

### **3. Run Migration**
```bash
dotnet ef database update
```

### **4. Test the Application**
```bash
dotnet run
```

### **5. Test with Postman**
Use the same credentials as before:
- **Email**: `admin@company.com`
- **Password**: `admin123`

## 🔍 **Troubleshooting**

### **Connection Issues**
- Verify server name format: `server.database.windows.net`
- Check firewall rules allow your IP
- Ensure username/password are correct

### **Migration Issues**
- Make sure database exists in Azure
- Check connection string is correct
- Verify user has sufficient permissions

### **Performance Issues**
- Consider upgrading Azure SQL tier
- Monitor DTU usage in Azure Portal
- Add appropriate indexes

## 📊 **Expected Results**

After successful migration:
- ✅ All 8 users will be created
- ✅ All 13 products will be seeded
- ✅ All roles and permissions will work
- ✅ API will respond on `http://localhost:5152`
- ✅ Postman collection will work perfectly

## 🎯 **Benefits of Azure SQL**

- **Scalability**: Easy to scale up/down
- **Security**: Built-in encryption and security
- **Backup**: Automatic backups
- **Monitoring**: Built-in performance monitoring
- **High Availability**: 99.99% uptime SLA

## 📝 **Quick Reference**

### **Connection String Format**
```
Server=tcp:SERVER_NAME.database.windows.net,1433;
Initial Catalog=DATABASE_NAME;
Persist Security Info=False;
User ID=USERNAME;
Password=PASSWORD;
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

### **Commands to Run**
```bash
# Navigate to API directory
cd /Users/osz/Desktop/diploma/gradproject/Api

# Apply migrations
dotnet ef database update

# Start application
dotnet run
```

### **Test Endpoints**
- Health: `GET http://localhost:5152/api/Health`
- Login: `POST http://localhost:5152/api/Auth/login`
- Users: `GET http://localhost:5152/api/Users`

Your Heritage Store Management System is now ready for Azure SQL Database! 🚀✨
