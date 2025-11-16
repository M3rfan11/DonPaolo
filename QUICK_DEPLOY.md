# 🚀 Quick Deployment Guide

## Prerequisites
- Azure account (for backend) or AWS/Heroku
- Netlify account (for frontend) or Vercel
- Git repository

## Quick Start (5 minutes)

### 1. Backend Deployment

#### Option A: Render (Recommended - Easiest & Free Tier) ⭐

```bash
# 1. Go to render.com and sign up with GitHub
# 2. Click "New" → "Blueprint"
# 3. Connect your GitHub repository
# 4. Render will detect render.yaml automatically
# 5. Click "Apply"

# Or manually:
# 1. New → Web Service
# 2. Connect GitHub repo
# 3. Set:
#    - Build: cd Api && dotnet publish -c Release -o ./publish
#    - Start: cd Api/publish && dotnet Api.dll --urls http://0.0.0.0:10000
# 4. Add PostgreSQL database
# 5. Set environment variables in dashboard
```

#### Option B: Azure

```bash
# Login to Azure
az login

# Run deployment script
./deploy-backend.sh

# Configure environment variables
az webapp config appsettings set \
  --resource-group donpaolo-rg \
  --name donpaolo-api \
  --settings \
    Jwt__Key="YOUR_STRONG_SECRET_KEY_MIN_32_CHARS" \
    Jwt__Issuer="https://donpaolo-api.azurewebsites.net" \
    Jwt__Audience="https://your-frontend.netlify.app"
```

### 2. Frontend Deployment (Netlify)

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Create .env.production
cd frontend
cp .env.production.example .env.production
# Edit .env.production and set REACT_APP_API_URL

# Deploy
./deploy-frontend.sh
```

### 3. Configure Environment Variables

**In Netlify Dashboard:**
1. Go to Site Settings → Environment Variables
2. Add: `REACT_APP_API_URL` = `https://donpaolo-api.onrender.com` (or your backend URL)

**In Render Dashboard (if using Render):**
1. Go to your Web Service → Environment
2. Add:
   - `Jwt__Key` = Generate with: `openssl rand -base64 32`
   - `Jwt__Issuer` = `https://donpaolo-api.onrender.com`
   - `Jwt__Audience` = Your frontend URL
   - `AllowedOrigins__0` = Your frontend URL

**In Azure App Service (if using Azure):**
1. Go to Configuration → Application Settings
2. Add:
   - `Jwt__Key` = Your secret key
   - `Jwt__Issuer` = Your API URL
   - `Jwt__Audience` = Your frontend URL
   - `AllowedOrigins__0` = Your frontend URL

### 4. Database Setup

```bash
# Create Azure SQL Database
az sql server create \
  --name donpaolo-sql-server \
  --resource-group donpaolo-rg \
  --location eastus \
  --admin-user admin \
  --admin-password "StrongPassword123!"

az sql db create \
  --resource-group donpaolo-rg \
  --server donpaolo-sql-server \
  --name donpaolo-db \
  --service-objective Basic

# Set connection string
az webapp config connection-string set \
  --resource-group donpaolo-rg \
  --name donpaolo-api \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="Server=tcp:donpaolo-sql-server.database.windows.net,1433;Initial Catalog=donpaolo-db;User ID=admin;Password=StrongPassword123!;Encrypt=True;"
```

### 5. Run Migrations

```bash
# SSH into Azure App Service
az webapp ssh --resource-group donpaolo-rg --name donpaolo-api

# Run migrations
cd /home/site/wwwroot
dotnet ef database update
```

## That's it! 🎉

Your application should now be live:
- **Backend**: 
  - Render: https://donpaolo-api.onrender.com
  - Azure: https://donpaolo-api.azurewebsites.net
- **Frontend**: https://your-site.netlify.app

## Troubleshooting

**CORS Errors?**
- Make sure `AllowedOrigins` includes your frontend URL
- Check that CORS policy is set correctly in Program.cs

**API Not Working?**
- Check application logs: `az webapp log tail --name donpaolo-api --resource-group donpaolo-rg`
- Verify environment variables are set
- Check database connection

**Frontend Can't Connect?**
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for errors
- Ensure backend CORS allows your frontend domain

## Next Steps

1. Set up custom domain
2. Configure SSL certificates
3. Set up monitoring
4. Configure backups
5. Set up CI/CD pipeline

For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

