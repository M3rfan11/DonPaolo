# 🚀 Supabase Database Setup Guide

This guide will help you set up your database on Supabase and connect it to your Render deployment.

## 📋 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `donpaolo-db` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

## 📋 Step 2: Get Connection String

### Option A: Direct Connection (Port 5432)
1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **"Connection string"**
3. Copy the **URI** format connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
4. **Important**: Replace `[YOUR-PASSWORD]` with the password you set when creating the project

### Option B: Connection Pooler (For High Traffic) 
**Note**: Port 6543 is Transaction Mode only (deprecated for Session Mode). EF Core requires Session Mode, so use port 5432.

If you need connection pooling for high traffic:
1. Use Supabase's connection pooler with Session Mode (port 5432)
2. The pooler host format: `aws-0-[REGION].pooler.supabase.com:5432`
3. Check Supabase dashboard → Settings → Database for the exact pooler connection string

**Important**: The application automatically uses port 5432 for Supabase (Session Mode required for EF Core).

## 📋 Step 3: Update Render Environment Variable

1. Go to your Render dashboard
2. Navigate to your **Web Service** (donpaolo-api)
3. Go to **Environment** tab
4. Add/Update this environment variable:
   - **Key**: `ConnectionStrings__DefaultConnection`
   - **Value**: Paste your Supabase connection string
5. Click **"Save Changes"**
6. Render will automatically redeploy

## 📋 Step 4: Run Migrations on Supabase

You have **two options**:

### Option A: Automatic (Recommended) ✅

The application will automatically run migrations on startup. Just deploy and the migrations will run!

**What happens:**
- On first deployment, `context.Database.Migrate()` in `Program.cs` will:
  1. Create all tables
  2. Set up indexes
  3. Create foreign keys
  4. Set up identity columns (sequences)

**To verify:**
1. After deployment, check logs for: `"Migrations applied successfully"`
2. Or check Supabase dashboard → **Table Editor** to see your tables

### Option B: Manual SQL Script

If you prefer to run SQL manually, use the Supabase SQL Editor:

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. The migrations will run automatically, but if you want to verify, you can check the tables

## 📋 Step 5: Verify Setup

### Check in Supabase Dashboard:
1. Go to **Table Editor** in Supabase
2. You should see all your tables:
   - `Roles`
   - `Users`
   - `Categories`
   - `Products`
   - `AuditLogs`
   - And all other tables

### Check via API:
```bash
curl https://donpaolo-api.onrender.com/api/health/database
```

This will show:
- Connection status
- Applied migrations
- Test query results

## 🎯 Your Database Tables

Based on your migrations, you have these tables:

### Core Tables:
- **Roles** - User roles (SuperAdmin, Cashier, etc.)
- **Users** - System users
- **UserRoles** - Many-to-many relationship
- **AuditLogs** - Activity logging

### Product Management:
- **Categories** - Product categories
- **Products** - Products catalog
- **ProductInventories** - Stock levels per warehouse
- **ProductMovements** - Inventory movements
- **ProductMovementSummaries** - Daily summaries
- **ProductAssemblies** - Product assembly tracking
- **BillOfMaterials** - BOM for assemblies

### Order Management:
- **Customers** - Customer information
- **SalesOrders** - Sales orders
- **SalesItems** - Sales order line items
- **PurchaseOrders** - Purchase orders
- **PurchaseItems** - Purchase order line items
- **ShoppingCarts** - Shopping cart items
- **OrderTrackings** - Order status tracking

### Request Management:
- **ProductRequests** - Product requests
- **ProductRequestItems** - Request line items

### Warehouse:
- **Warehouses** - Warehouse/store locations

## 🔧 Troubleshooting

### If you get "Network is unreachable" errors:

**This is the most common issue when connecting to Supabase from Render.**

**Solution 1: Verify Connection String Format ✅**
1. Make sure you're using port **5432** (Session Mode required for EF Core)
2. Port 6543 is Transaction Mode only and won't work with EF Core
3. Connection string format:
   ```
   postgresql://postgres:YOUR_PASSWORD@db.jjznaktpwigboqyozcbo.supabase.co:5432/postgres
   ```
4. The application code will automatically detect Supabase and ensure port 5432 is used.

**Solution 2: Check Network Restrictions in Supabase**
1. Go to Supabase → **Settings** → **Database**
2. Scroll to **"Network Restrictions"** section
3. Make sure it says **"Your database can be accessed by all IP addresses"**
4. If it's restricted, click **"Add restriction"** and allow all IPs, or add Render's IP ranges

**Solution 3: Verify Connection String**
- Make sure the password is correct (no extra spaces)
- Make sure the host is `db.jjznaktpwigboqyozcbo.supabase.co` (with `db.` prefix)
- Make sure you're using the full connection string with password replaced

### If migrations don't run automatically:

1. **Check connection string**:
   - Verify it's set correctly in Render
   - Format: `postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres` (or port 6543 for pooler)

2. **Check Supabase logs**:
   - Go to Supabase dashboard → **Logs** → **Postgres Logs**
   - Look for any connection errors

3. **Run migrations manually** (if needed):
   ```bash
   # In Render shell or locally with Supabase connection string
   cd Api
   dotnet ef database update
   ```

### If you see "null value in column Id" errors:

This means the identity columns (sequences) aren't set up. The `FixPostgreSQLIdentityColumns` migration should handle this automatically, but if it doesn't:

1. Check Supabase SQL Editor
2. Run this to check if sequences exist:
   ```sql
   SELECT * FROM pg_sequences WHERE schemaname = 'public';
   ```
3. If sequences are missing, the migration will create them on next deployment

## ✅ Benefits of Supabase

- ✅ **Better UI** - Easy to browse tables and run queries
- ✅ **Better debugging** - See exactly what's in your database
- ✅ **Free tier** - 500 MB database, 2 GB bandwidth
- ✅ **Automatic backups** - Daily backups included
- ✅ **Connection pooling** - Better performance
- ✅ **Real-time** (optional) - Can enable real-time subscriptions later

## 🔄 Migration from Render PostgreSQL

If you're currently using Render's PostgreSQL:

1. **Export data** (if you have important data):
   ```bash
   # From Render PostgreSQL
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Set up Supabase** (follow steps above)

3. **Import data** (if needed):
   ```bash
   # To Supabase
   psql $SUPABASE_CONNECTION_STRING < backup.sql
   ```

4. **Update connection string** in Render

5. **Redeploy** - Migrations will run automatically

## 📝 Next Steps

1. ✅ Create Supabase project
2. ✅ Get connection string
3. ✅ Update Render environment variable
4. ✅ Deploy (migrations run automatically)
5. ✅ Verify tables in Supabase dashboard
6. ✅ Test API endpoints

Your application code is already compatible - just update the connection string!

