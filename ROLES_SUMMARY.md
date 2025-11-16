# 👥 Roles in the Application

## 📋 Current Active Roles

Based on the seed data (`SeedRoles.cs` and `SeedUsers.cs`), the application currently has **4 active roles**:

### 1. **SuperAdmin** 🛡️
**Description:** Super Administrator with full system access

**Permissions in Simplified System:**
- ✅ Access POS system (all stores)
- ✅ Process sales (any store)
- ✅ View sales reports (all stores, can filter by store)
- ✅ Full system access

**Seed User:**
- Email: `admin@company.com`
- Password: `admin123`

**API Access:**
- `[Authorize(Roles = "SuperAdmin,Cashier")]` - POS endpoints
- `[Authorize(Roles = "SuperAdmin")]` - Admin endpoints
- Can see all products from all stores

---

### 2. **StoreManager** 🏪
**Description:** Store Manager with store-specific access

**Permissions in Simplified System:**
- ✅ Access POS system (their assigned store)
- ✅ Process sales (their store)
- ✅ View sales reports (their store only)
- ⚠️ Note: In simplified system, this role has same access as Cashier

**Seed Users:**
- `sarah.store1@company.com` / `manager123` (Store 1)
- `mike.store2@company.com` / `manager123` (Store 2)
- `alex.online@company.com` / `online123` (Online Store)

**API Access:**
- `[Authorize(Roles = "SuperAdmin,StoreManager,Cashier")]` - Sales history
- Store-scoped filtering applied automatically

---

### 3. **Cashier** 💰
**Description:** Cashier with POS access for local sales

**Permissions in Simplified System:**
- ✅ Access POS system (their assigned store only)
- ✅ Process sales (their store)
- ✅ View sales reports (their store only)
- ❌ Cannot access admin features

**Seed Users:**
- `tom.store1@company.com` / `cashier123` (Store 1)
- `lisa.store2@company.com` / `cashier123` (Store 2)

**API Access:**
- `[Authorize(Roles = "SuperAdmin,Cashier")]` - POS products and sales
- `[Authorize(Roles = "SuperAdmin,StoreManager,Cashier")]` - Sales history
- Only sees products from their assigned store

**Requirements:**
- Must be assigned to a store (`AssignedStoreId`)
- Cannot process sales without store assignment

---

### 4. **Customer** 🛒
**Description:** Customer role for online ordering and order tracking

**Permissions in Simplified System:**
- ⚠️ **Not used in simplified POS system**
- This role was for online ordering features (removed)
- Currently has no access to POS or Reports

**Seed User:**
- `alice.customer@company.com` / `customer123`

**Note:** In the simplified system, customers are created automatically from POS sales, not as system users.

---

## 🔍 Role Usage in Simplified System

### Active Roles (Used):
1. **SuperAdmin** - Full access
2. **Cashier** - POS operations
3. **StoreManager** - Same as Cashier (store-scoped)

### Inactive Roles (Not Used):
- **Customer** - Not used in simplified system

---

## 📊 Role Permissions Matrix

| Feature | SuperAdmin | StoreManager | Cashier | Customer |
|---------|-----------|--------------|---------|----------|
| **POS - View Products** | ✅ All stores | ✅ Own store | ✅ Own store | ❌ |
| **POS - Process Sale** | ✅ All stores | ✅ Own store | ✅ Own store | ❌ |
| **POS - Sales History** | ✅ All stores | ✅ Own store | ✅ Own store | ❌ |
| **Reports - View** | ✅ All stores | ✅ Own store | ✅ Own store | ❌ |
| **Reports - Filter by Store** | ✅ Yes | ❌ No | ❌ No | ❌ |

---

## 🔐 Role Authorization in Controllers

### POSController
```csharp
[Authorize(Roles = "SuperAdmin,Cashier")]  // Get products, Process sale
[Authorize(Roles = "SuperAdmin,StoreManager,Cashier")]  // Sales history
```

### ReportsController
```csharp
[Authorize]  // All authenticated users (role filtering done in code)
// SuperAdmin sees all stores
// StoreManager/Cashier see only their store
```

---

## 🏪 Store Assignment

**Important:** Cashiers and StoreManagers must be assigned to a store to use the POS system.

**Store Assignment:**
- Stored in `User.AssignedStoreId`
- Set during user creation/seeding
- Required for POS operations

**Error if not assigned:**
```
"You are not assigned to any store"
```

---

## 📝 Default Test Users

| Role | Email | Password | Store |
|------|-------|----------|-------|
| SuperAdmin | `admin@company.com` | `admin123` | None (all stores) |
| StoreManager | `sarah.store1@company.com` | `manager123` | Store 1 |
| Cashier | `tom.store1@company.com` | `cashier123` | Store 1 |
| StoreManager | `mike.store2@company.com` | `manager123` | Store 2 |
| Cashier | `lisa.store2@company.com` | `cashier123` | Store 2 |
| StoreManager | `alex.online@company.com` | `online123` | Online Store |
| Customer | `alice.customer@company.com` | `customer123` | None |

---

## ⚠️ Legacy Roles (Not Active)

These roles exist in old migrations but are **NOT** actively used:

- **Admin** - Replaced by SuperAdmin
- **User** - Not used in simplified system
- **WarehouseManager** - Not used in simplified system
- **SalesStaff** - Not used in simplified system
- **PurchaseStaff** - Not used in simplified system

**Note:** The `SeedUsers.cs` clears old roles and creates only the 4 active roles listed above.

---

## 🎯 For Simplified POS System

**Recommended Roles:**
1. **SuperAdmin** - For system administrators
2. **Cashier** - For daily POS operations

**StoreManager** can be used but has same permissions as Cashier in the simplified system.

**Customer** role is not needed since customers are auto-created from sales.

---

## 🔄 Role Creation Process

Roles are created during application startup in `Program.cs`:

```csharp
await SeedRoles.SeedAsync(context);
await SeedUsers.SeedAsync(context);
```

This ensures:
1. Roles are created if they don't exist
2. Test users are created with proper role assignments
3. Users are assigned to stores

---

## 📌 Summary

**Active Roles:** 4
- SuperAdmin ✅
- StoreManager ✅
- Cashier ✅
- Customer ⚠️ (not used in simplified system)

**For POS System:** Only SuperAdmin and Cashier are essential.


