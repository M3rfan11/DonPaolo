# 🔍 Connection String Guide: Where It's Used

## Where `ConnectionStrings__DefaultConnection` is Used

### 1. **In Your Code (`Api/Program.cs`)**

The connection string is read in this priority order:

```csharp
// Line 22-24 in Program.cs
var connectionString = 
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")  // 1st priority
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")                        // 2nd priority  
    ?? builder.Configuration.GetConnectionString("DefaultConnection");           // 3rd priority (from appsettings.json)
```

**Priority:**
1. ✅ **Environment Variable** `ConnectionStrings__DefaultConnection` (used in production/Render)
2. Environment Variable `DATABASE_URL` (fallback)
3. ⚠️ **appsettings.json** (only for local development with SQLite)

### 2. **In Configuration Files**

#### `Api/appsettings.json` (Local Development)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=authrbac_dev.db"  // SQLite for local dev
  }
}
```
⚠️ **This is SQLite - only for local development!**

#### `Api/appsettings.Development.json` (Local Development)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=authrbac_dev.db"  // SQLite for local dev
  }
}
```

### 3. **In Render Dashboard (Production)**

The connection string should be set as an **Environment Variable**:

- **Key**: `ConnectionStrings__DefaultConnection`
- **Value**: Your Supabase connection string
- **Location**: Render Dashboard → Your Service → Environment tab

## How to Verify It's Set Correctly

### Option 1: Check Render Logs

After deploying, check the logs. You should see:

```
[DB Config] ========================================
[DB Config] Connection String Source Detection
[DB Config] ========================================
[DB Config] From appsettings.json: SET (SQLite for local dev)
[DB Config] From ConnectionStrings__DefaultConnection env var: SET ✅
[DB Config] From DATABASE_URL env var: NOT SET
[DB Config] Connection string source: Environment Variable (ConnectionStrings__DefaultConnection) ✅
[DB Config] Connection string starts with: postgresql://postgres...
```

### Option 2: Check in Render Shell

1. Go to Render Dashboard → Your Service → **Shell**
2. Run:
   ```bash
   echo $ConnectionStrings__DefaultConnection
   ```
3. You should see your Supabase connection string

### Option 3: Check Render Environment Variables

1. Go to Render Dashboard → Your Service → **Environment** tab
2. Look for `ConnectionStrings__DefaultConnection`
3. It should be set with your Supabase connection string

## Common Issues

### Issue 1: Using SQLite in Production ❌

**Symptom:**
```
[DB Config] Connection string source: appsettings.json (⚠️ This is SQLite for local dev - should NOT be used in production!)
```

**Problem:** Environment variable is not set, so it's falling back to appsettings.json

**Solution:**
1. Go to Render Dashboard → Environment
2. Add `ConnectionStrings__DefaultConnection` with your Supabase connection string
3. Save and redeploy

### Issue 2: Environment Variable Not Found ❌

**Symptom:**
```
[DB Config] From ConnectionStrings__DefaultConnection env var: NOT SET ❌
```

**Problem:** The environment variable is not set in Render

**Solution:**
1. Go to Render Dashboard → Your Service → Environment
2. Click "+ Add" to add a new environment variable
3. Key: `ConnectionStrings__DefaultConnection`
4. Value: Your Supabase connection string
5. Click "Save Changes"

### Issue 3: Wrong Connection String Format ❌

**Problem:** Connection string is malformed or incorrect

**Correct Format:**
```
postgresql://postgres.dxfizbqyjuyemdtncezd:your_password@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

**Check:**
- ✅ Starts with `postgresql://` or `postgres://`
- ✅ Has username (for pooler: `postgres.dxfizbqyjuyemdtncezd`)
- ✅ Has password (your Supabase password)
- ✅ Has hostname (`aws-X-region.pooler.supabase.com` for pooler)
- ✅ Has port (`5432` for Session Mode)
- ✅ Has database name (`postgres`)

## How the Connection String is Used

1. **Read from environment** (line 22-24 in Program.cs)
2. **Parsed and converted** to Npgsql format (line 67-173)
3. **Used to configure DbContext** (line 195-210)
4. **Used for migrations and seeding** (line 300+)

## Quick Checklist

- [ ] `ConnectionStrings__DefaultConnection` is set in Render Environment
- [ ] Connection string starts with `postgresql://`
- [ ] Connection string includes correct username (pooler format if using pooler)
- [ ] Connection string includes correct password
- [ ] Connection string includes correct hostname
- [ ] Connection string uses port `5432`
- [ ] Connection string includes database name `postgres`
- [ ] Logs show "Connection string source: Environment Variable ✅"
- [ ] Logs do NOT show "appsettings.json" as source in production

## Testing the Connection String

### In Render Shell:

```bash
# 1. Check if it's set
echo $ConnectionStrings__DefaultConnection

# 2. Test connection (if psql available)
psql "$ConnectionStrings__DefaultConnection" -c "SELECT version();"
```

### In Your Application Logs:

Look for:
- ✅ `Connection string source: Environment Variable (ConnectionStrings__DefaultConnection) ✅`
- ✅ `Database connection successful!`
- ❌ `Cannot connect to database` = Connection issue (not config issue)

