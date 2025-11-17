# 🔍 Testing Database Connection from Render Shell

This guide will help you test the database connection directly from Render's shell to diagnose connection issues.

## Step 1: Access Render Shell

1. Go to your Render dashboard: https://dashboard.render.com
2. Navigate to your **DonPaolo** service
3. Click on **"Shell"** in the left sidebar (under MANAGE section)
4. A terminal window will open in your browser

## Step 2: Check Environment Variables

First, let's verify the connection string is set:

```bash
echo $ConnectionStrings__DefaultConnection
```

Or check if it's set as DATABASE_URL:

```bash
echo $DATABASE_URL
```

**Expected output:** You should see your Supabase connection string (password will be visible, that's OK in the shell)

## Step 3: Test DNS Resolution

Test if the hostname resolves:

```bash
nslookup aws-1-eu-north-1.pooler.supabase.com
```

Or:

```bash
host aws-1-eu-north-1.pooler.supabase.com
```

**What to look for:**
- ✅ If you see IPv4 addresses (like `13.60.102.132`), that's good
- ❌ If you only see IPv6 addresses (like `2a05:d018:...`), that's the problem

## Step 4: Test Network Connectivity

Test if you can reach the database port:

```bash
nc -zv aws-1-eu-north-1.pooler.supabase.com 5432
```

Or:

```bash
timeout 5 bash -c "echo > /dev/tcp/aws-1-eu-north-1.pooler.supabase.com/5432" && echo "Port is open" || echo "Port is closed/unreachable"
```

**Expected output:**
- ✅ `Connection succeeded` or `Port is open` = Good
- ❌ `Connection refused` or `Port is closed` = Network/firewall issue

## Step 5: Test PostgreSQL Connection

If `psql` is available, test the actual connection:

```bash
# Extract connection details (replace with your actual connection string)
export PGPASSWORD="don-paolo123"
psql -h aws-1-eu-north-1.pooler.supabase.com -p 5432 -U postgres.dxfizbqyjuyemdtncezd -d postgres -c "SELECT version();"
unset PGPASSWORD
```

**Or use the full connection string:**

```bash
# Replace with your actual connection string
psql "postgresql://postgres.dxfizbqyjuyemdtncezd:don-paolo123@aws-1-eu-north-1.pooler.supabase.com:5432/postgres" -c "SELECT version();"
```

**Expected output:**
- ✅ PostgreSQL version info = Connection successful!
- ❌ Error message = Check the error for details

## Step 6: Test with .NET (if psql not available)

If you're in the Api directory, you can test with dotnet:

```bash
cd Api
dotnet ef dbcontext info
```

Or create a simple test:

```bash
cd Api
dotnet run --no-build 2>&1 | grep -A 20 "DB Config\|Database connection"
```

## Common Issues and Solutions

### Issue 1: "Name or service not known"
**Problem:** DNS resolution failed
**Solution:** 
- Check if hostname is correct
- Try using connection pooler instead of direct connection

### Issue 2: "Connection refused" or "No route to host"
**Problem:** Network/firewall blocking
**Solution:**
- Check Supabase → Settings → Database → Network Restrictions
- Make sure "all IP addresses" is enabled
- Verify you're using the connection pooler (better IPv4 support)

### Issue 3: "Password authentication failed"
**Problem:** Wrong password
**Solution:**
- Verify password in Supabase dashboard
- Make sure password in connection string matches
- Check for special characters that need URL encoding

### Issue 4: "Database does not exist"
**Problem:** Wrong database name
**Solution:**
- Use `postgres` as the database name (not your project name)
- Verify in connection string: `.../postgres` at the end

### Issue 5: Only IPv6 addresses in DNS
**Problem:** Hostname only resolves to IPv6
**Solution:**
- Use Supabase Connection Pooler (has better IPv4 support)
- The pooler hostname should be: `aws-X-region.pooler.supabase.com`

## Quick Diagnostic Commands

Run these commands in Render Shell to get a full diagnostic:

```bash
# 1. Check environment variable
echo "Connection String: ${ConnectionStrings__DefaultConnection:0:50}..."

# 2. Test DNS
nslookup aws-1-eu-north-1.pooler.supabase.com

# 3. Test connectivity
nc -zv aws-1-eu-north-1.pooler.supabase.com 5432

# 4. Test PostgreSQL (if psql available)
export PGPASSWORD="your-password-here"
psql -h aws-1-eu-north-1.pooler.supabase.com -p 5432 -U postgres.dxfizbqyjuyemdtncezd -d postgres -c "SELECT 1;"
unset PGPASSWORD
```

## What to Share

If you need help, share:
1. Output of `echo $ConnectionStrings__DefaultConnection` (you can mask the password)
2. Output of `nslookup` command
3. Output of `nc -zv` command
4. Any error messages from `psql` or connection attempts

This will help identify exactly where the connection is failing!

