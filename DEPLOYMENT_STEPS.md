# 🚀 Complete Deployment Guide: Render + Supabase

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `donpaolo-db` (or any name you prefer)
   - **Database Password**: Choose a **strong password** (save this - you'll need it!)
   - **Region**: Choose closest to your users (e.g., `US East`, `EU West`)
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

## Step 2: Get Supabase Connection String

### ⚠️ IMPORTANT: Use Connection Pooler for Better IPv4 Support

Supabase's direct connection may only resolve to IPv6, which Render cannot access. **Use the Connection Pooler instead** for better compatibility.

### Option A: Connection Pooler (RECOMMENDED for Render)

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **"Connection Pooling"** section
3. Select **"Session Mode"** (required for EF Core)
4. Copy the **"Connection string"** - it looks like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
   ```
   OR
   ```
   postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. **IMPORTANT**: 
   - Replace `[YOUR-PASSWORD]` with your actual password
   - If you see port `6543`, change it to `5432` (Session Mode)
   - The pooler typically has better IPv4 support

### Option B: Direct Connection (May Have IPv6 Issues)

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the actual password you set when creating the project
6. **WARNING**: This may only resolve to IPv6, which Render cannot access. Use Option A if you encounter connection issues.

## Step 3: Update render.yaml for Supabase

Your `render.yaml` currently references a Render PostgreSQL database. Since you're using Supabase, you need to update it:

1. Open `render.yaml`
2. Remove or comment out the `databases` section (lines 36-43)
3. Update the `ConnectionStrings__DefaultConnection` to use `sync: false` so you can set it manually

Here's what your `render.yaml` should look like:

```yaml
services:
  - type: web
    name: donpaolo-api
    plan: free
    region: oregon
    buildCommand: cd Api && dotnet restore && dotnet publish -c Release -o ./publish
    startCommand: cd Api/publish && dotnet Api.dll --urls http://0.0.0.0:$PORT
    healthCheckPath: /api/Health
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:$PORT
      - key: PORT
        value: 10000
      # Supabase Database Connection - Set manually in Render dashboard
      - key: ConnectionStrings__DefaultConnection
        sync: false  # IMPORTANT: Set this manually with your Supabase connection string
      # JWT Configuration
      - key: Jwt__Key
        sync: false  # Generate with: openssl rand -base64 32
      - key: Jwt__Issuer
        value: https://donpaolo-api.onrender.com
      - key: Jwt__Audience
        sync: false  # Set to your frontend URL
      - key: AllowedOrigins__0
        sync: false  # Set to your frontend URL
      - key: EnableSwagger
        value: "true"

# Remove or comment out the databases section since we're using Supabase
# databases:
#   - name: donpaolo-db
#     plan: free
#     databaseName: donpaolo
#     user: donpaolo_user
#     postgresMajorVersion: 15
```

## Step 4: Deploy to Render

### Option A: Using Render Blueprint (Recommended)

1. Push your code to GitHub (if not already done)
2. Go to [render.com](https://render.com) and sign up/login
3. Click **"New"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render will detect `render.yaml` automatically
6. Click **"Apply"** to create the service
7. Render will start building and deploying

### Option B: Manual Setup

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `donpaolo-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `Api` if your project is in a subfolder)
   - **Environment**: `Docker` or `Native`
   - **Build Command**: `cd Api && dotnet restore && dotnet publish -c Release -o ./publish`
   - **Start Command**: `cd Api/publish && dotnet Api.dll --urls http://0.0.0.0:$PORT`
5. Click **"Create Web Service"**

## Step 5: Configure Environment Variables on Render

After deployment starts, go to your service → **Environment** tab and add:

### Required Variables:

1. **ConnectionStrings__DefaultConnection**
   - **Value**: Your Supabase connection string from Step 2
   - Example: `postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres`

2. **Jwt__Key**
   - Generate a secure key:
     ```bash
     openssl rand -base64 32
     ```
   - Copy the output and paste as the value

3. **Jwt__Audience**
   - **Value**: Your frontend URL (e.g., `https://donpaolo.netlify.app`)
   - Or use `*` for development

4. **AllowedOrigins__0**
   - **Value**: Your frontend URL (e.g., `https://donpaolo.netlify.app`)
   - Or use `*` for development

### Optional Variables:

- **Jwt__Issuer**: Usually your API URL (e.g., `https://donpaolo-api.onrender.com`)
- **ASPNETCORE_ENVIRONMENT**: `Production`

## Step 6: Configure Supabase Network Access

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **"Network Restrictions"**
4. Make sure **"Your database can be accessed by all IP addresses"** is enabled
   - OR add Render's IP ranges if you want to restrict access
5. Save changes

## Step 7: Run Database Migrations

Your application should automatically run migrations on startup (check your `Program.cs`), but you can also run them manually:

### Option A: Automatic (Recommended)
- Your `Program.cs` should run migrations automatically when the app starts
- Check the Render logs to see if migrations ran successfully

### Option B: Manual via Render Shell
1. Go to your Render service → **Shell** tab
2. Run:
   ```bash
   cd Api
   dotnet ef database update
   ```

### Option C: Manual via Supabase SQL Editor
1. Go to Supabase dashboard → **SQL Editor**
2. Copy the SQL from your migration files
3. Run them manually (not recommended, but possible)

## Step 8: Verify Deployment

1. Check Render logs for:
   - ✅ "Database connection successful"
   - ✅ "Migrations applied successfully"
   - ✅ "Your service is live 🎉"

2. Test your API:
   - Health check: `https://your-service.onrender.com/api/Health`
   - Swagger UI: `https://your-service.onrender.com/swagger` (if enabled)

3. Test database connection:
   - Try making an API call that uses the database
   - Check logs for any connection errors

## Step 9: Troubleshooting

### Connection Issues

**Problem**: "Network is unreachable" or IPv6 errors
- **Solution**: Your `Program.cs` already handles IPv4 resolution. If issues persist, check Supabase network settings.

**Problem**: "Password authentication failed"
- **Solution**: Double-check your connection string password matches the Supabase project password.

**Problem**: "Database does not exist"
- **Solution**: Make sure you're using `postgres` as the database name in the connection string.

### Migration Issues

**Problem**: Migrations fail
- **Solution**: Check Render logs for specific error messages. Common issues:
  - Missing tables (run migrations in order)
  - Permission issues (check Supabase user permissions)

### Build Issues

**Problem**: Build fails on Render
- **Solution**: 
  - Check that `Api.csproj` is in the correct location
  - Verify .NET SDK version compatibility
  - Check build logs for specific errors

## Step 10: Production Considerations

1. **Upgrade Plans**: 
   - Render: Free tier spins down after inactivity. Consider "Starter" ($7/month) for always-on
   - Supabase: Free tier has limits. Consider paid plan for production

2. **Security**:
   - Use strong passwords
   - Enable Supabase network restrictions if possible
   - Rotate JWT keys regularly
   - Use HTTPS (Render provides this automatically)

3. **Monitoring**:
   - Set up Render alerts
   - Monitor Supabase dashboard for database usage
   - Check application logs regularly

4. **Backups**:
   - Supabase free tier includes daily backups
   - Consider setting up additional backup strategy for production

## Quick Checklist

- [ ] Supabase project created
- [ ] Connection string copied and password replaced
- [ ] `render.yaml` updated (removed databases section)
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables set on Render
- [ ] Supabase network access configured
- [ ] Migrations run successfully
- [ ] Health check endpoint working
- [ ] API endpoints tested

## Need Help?

- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Check your Render logs for detailed error messages
- Check Supabase logs in the dashboard

