# 🚀 Deployment Guide - Don Paolo Restaurant Management System

Complete guide for deploying both frontend and backend to production.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

### Required Accounts
- **Backend Hosting**: Render, Azure App Service, AWS Elastic Beanstalk, or Heroku
- **Frontend Hosting**: Netlify, Vercel, or Azure Static Web Apps
- **Database**: Render PostgreSQL, Azure SQL Database, AWS RDS, or PostgreSQL
- **Domain Name** (optional): For custom domain

### Required Tools
- Git (for version control)
- Azure CLI (if using Azure)
- Node.js 18+ (for building frontend)
- .NET 9.0 SDK (for building backend)

---

## Backend Deployment

### Option 1: Azure App Service (Recommended)

#### Step 1: Prepare Backend for Production

```bash
cd Api

# Create production appsettings
cp appsettings.json appsettings.Production.json
```

#### Step 2: Update appsettings.Production.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_AZURE_SQL_CONNECTION_STRING"
  },
  "Jwt": {
    "Key": "YOUR_STRONG_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG",
    "Issuer": "https://your-api.azurewebsites.net",
    "Audience": "https://your-frontend.netlify.app"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

#### Step 3: Create Azure App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name donpaolo-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name donpaolo-plan \
  --resource-group donpaolo-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group donpaolo-rg \
  --plan donpaolo-plan \
  --name donpaolo-api \
  --runtime "DOTNET|9.0"
```

#### Step 4: Configure App Settings

```bash
# Set connection string
az webapp config connection-string set \
  --resource-group donpaolo-rg \
  --name donpaolo-api \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="YOUR_CONNECTION_STRING"

# Set JWT settings
az webapp config appsettings set \
  --resource-group donpaolo-rg \
  --name donpaolo-api \
  --settings \
    Jwt__Key="YOUR_JWT_SECRET_KEY" \
    Jwt__Issuer="https://donpaolo-api.azurewebsites.net" \
    Jwt__Audience="https://your-frontend.netlify.app"
```

#### Step 5: Deploy Backend

```bash
# Build the project
cd Api
dotnet publish -c Release -o ./publish

# Deploy using Azure CLI
az webapp deploy \
  --resource-group donpaolo-rg \
  --name donpaolo-api \
  --src-path ./publish \
  --type zip

# Or use Git deployment
az webapp deployment source config-local-git \
  --resource-group donpaolo-rg \
  --name donpaolo-api

# Add remote and push
git remote add azure https://donpaolo-api.scm.azurewebsites.net/donpaolo-api.git
git push azure main
```

#### Step 6: Run Migrations

```bash
# SSH into Azure App Service
az webapp ssh --resource-group donpaolo-rg --name donpaolo-api

# Run migrations
cd /home/site/wwwroot
dotnet ef database update
```

### Option 2: AWS Elastic Beanstalk

#### Step 1: Install EB CLI

```bash
pip install awsebcli
```

#### Step 2: Initialize EB

```bash
cd Api
eb init -p linux-x64 -r us-east-1 donpaolo-api
```

#### Step 3: Create Environment

```bash
eb create donpaolo-api-env
```

#### Step 4: Configure Environment Variables

```bash
eb setenv \
  ConnectionStrings__DefaultConnection="YOUR_CONNECTION_STRING" \
  Jwt__Key="YOUR_JWT_SECRET" \
  Jwt__Issuer="https://your-api.elasticbeanstalk.com" \
  Jwt__Audience="https://your-frontend.netlify.app"
```

#### Step 5: Deploy

```bash
eb deploy
```

### Option 3: Heroku

#### Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Login
heroku login
```

#### Step 2: Create Heroku App

```bash
cd Api
heroku create donpaolo-api
```

#### Step 3: Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### Step 4: Configure Environment Variables

```bash
heroku config:set \
  Jwt__Key="YOUR_JWT_SECRET" \
  Jwt__Issuer="https://donpaolo-api.herokuapp.com" \
  Jwt__Audience="https://your-frontend.netlify.app"
```

#### Step 5: Deploy

```bash
git push heroku main
```

### Option 4: Render (Recommended - Simple & Free Tier Available) ⭐

Render is a modern platform that's perfect for .NET applications. It offers a free tier and is much simpler than Azure.

#### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email

#### Step 2: Prepare Your Project

Create `render.yaml` in the root of your project:

```yaml
services:
  - type: web
    name: donpaolo-api
    env: dotnet
    plan: free  # or starter ($7/month) for better performance
    buildCommand: cd Api && dotnet publish -c Release -o ./publish
    startCommand: cd Api/publish && dotnet Api.dll
    envVars:
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: ASPNETCORE_URLS
        value: http://0.0.0.0:10000
      - key: ConnectionStrings__DefaultConnection
        fromDatabase:
          name: donpaolo-db
          property: connectionString
      - key: Jwt__Key
        generateValue: true  # Render will generate a secure key
      - key: Jwt__Issuer
        value: https://donpaolo-api.onrender.com
      - key: Jwt__Audience
        value: https://your-frontend.netlify.app
      - key: AllowedOrigins__0
        value: https://your-frontend.netlify.app

databases:
  - name: donpaolo-db
    plan: free  # or starter ($7/month) for production
    databaseName: donpaolo
    user: donpaolo_user
```

#### Step 3: Deploy via Render Dashboard

**Option A: Using render.yaml (Recommended)**

1. Go to Render Dashboard → New → Blueprint
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml`
4. Click "Apply" to deploy

**Option B: Manual Setup**

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `donpaolo-api`
   - **Environment**: `Docker` or `Native`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `Api`
   - **Build Command**: `dotnet publish -c Release -o ./publish`
   - **Start Command**: `cd publish && dotnet Api.dll`

#### Step 4: Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Configure:
   - **Name**: `donpaolo-db`
   - **Database**: `donpaolo`
   - **User**: `donpaolo_user`
   - **Plan**: Free (or Starter for production)
3. Copy the **Internal Database URL** (for connection string)

#### Step 5: Configure Environment Variables

In your Web Service settings, add:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:10000
ConnectionStrings__DefaultConnection=<Internal Database URL from PostgreSQL>
Jwt__Key=<Generate a strong secret key, min 32 characters>
Jwt__Issuer=https://donpaolo-api.onrender.com
Jwt__Audience=https://your-frontend.netlify.app
AllowedOrigins__0=https://your-frontend.netlify.app
```

**To generate JWT key:**
```bash
# Generate a secure random key
openssl rand -base64 32
```

#### Step 6: Update Program.cs for Render

Make sure your `Program.cs` uses the correct port:

```csharp
var app = builder.Build();

// Render uses PORT environment variable or defaults to 10000
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
app.Urls.Add($"http://0.0.0.0:{port}");

// ... rest of your code
```

Or update `appsettings.json`:
```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:10000"
      }
    }
  }
}
```

#### Step 7: Update Database Provider (if using PostgreSQL)

If you're using PostgreSQL instead of SQLite:

```bash
cd Api
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet remove package Microsoft.EntityFrameworkCore.Sqlite
```

Update `Program.cs`:
```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

#### Step 8: Run Migrations

After deployment, run migrations:

**Option A: Using Render Shell**
1. Go to your Web Service → Shell
2. Run:
```bash
cd /opt/render/project/src/Api
dotnet ef database update
```

**Option B: Using Build Command**
Add to your build command:
```bash
cd Api && dotnet ef database update && dotnet publish -c Release -o ./publish
```

#### Step 9: Verify Deployment

1. Your API will be available at: `https://donpaolo-api.onrender.com`
2. Test health endpoint: `https://donpaolo-api.onrender.com/api/Health`
3. Swagger UI: `https://donpaolo-api.onrender.com/swagger`

#### Render Advantages

✅ **Free tier available** (with limitations)  
✅ **Simple setup** - No CLI needed  
✅ **Automatic HTTPS**  
✅ **Built-in PostgreSQL**  
✅ **Auto-deploy from Git**  
✅ **Free SSL certificates**  
✅ **Easy environment variable management**  
✅ **Built-in monitoring**

#### Render Pricing

- **Free Tier**: 
  - Web services spin down after 15 minutes of inactivity
  - 750 hours/month
  - Good for development/testing
  
- **Starter Plan** ($7/month):
  - Always-on service
  - Better performance
  - Recommended for production

#### Render vs Other Platforms

| Feature | Render | Azure | Heroku |
|---------|--------|-------|--------|
| Free Tier | ✅ Yes | ❌ No | ❌ No |
| Setup Complexity | ⭐ Easy | ⭐⭐⭐ Complex | ⭐⭐ Medium |
| PostgreSQL Included | ✅ Yes | ❌ Separate | ✅ Yes |
| Auto HTTPS | ✅ Yes | ✅ Yes | ✅ Yes |
| Git Integration | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Frontend Deployment

### Option 1: Netlify (Recommended)

#### Step 1: Update API Base URL

Create `.env.production` in frontend folder:

```bash
cd frontend
touch .env.production
```

Add to `.env.production`:
```
REACT_APP_API_URL=https://donpaolo-api.azurewebsites.net
```

#### Step 2: Update API Service

Check `frontend/src/services/api.ts` - ensure it uses environment variable:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5152';
```

#### Step 3: Build Frontend

```bash
cd frontend
npm install
npm run build
```

#### Step 4: Deploy to Netlify

**Option A: Using Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod --dir=build
```

**Option B: Using Netlify Dashboard**

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add environment variable:
   - `REACT_APP_API_URL` = `https://donpaolo-api.azurewebsites.net`
6. Deploy

### Option 2: Vercel

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
cd frontend
vercel --prod
```

#### Step 3: Configure Environment Variables

In Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add `REACT_APP_API_URL` = `https://donpaolo-api.azurewebsites.net`

### Option 3: Azure Static Web Apps

#### Step 1: Create Static Web App

```bash
az staticwebapp create \
  --name donpaolo-frontend \
  --resource-group donpaolo-rg \
  --location eastus2 \
  --branch main \
  --app-location "frontend" \
  --output-location "build"
```

#### Step 2: Configure Build

Create `staticwebapp.config.json` in frontend folder:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
```

---

## Environment Configuration

### Backend Environment Variables

Required in production:

```bash
# Database
ConnectionStrings__DefaultConnection="Server=..."

# JWT
Jwt__Key="your-strong-secret-key-minimum-32-characters"
Jwt__Issuer="https://your-api-domain.com"
Jwt__Audience="https://your-frontend-domain.com"

# CORS (if needed)
AllowedOrigins="https://your-frontend-domain.com"
```

### Frontend Environment Variables

Create `.env.production`:

```bash
REACT_APP_API_URL=https://your-api-domain.com
```

### Update CORS in Backend

Update `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = builder.Configuration["FrontendUrl"] ?? "https://your-frontend.netlify.app";
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

---

## Database Setup

### Option 1: Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name donpaolo-sql-server \
  --resource-group donpaolo-rg \
  --location eastus \
  --admin-user donpaolo-admin \
  --admin-password "StrongPassword123!"

# Create Database
az sql db create \
  --resource-group donpaolo-rg \
  --server donpaolo-sql-server \
  --name donpaolo-db \
  --service-objective Basic

# Configure Firewall
az sql server firewall-rule create \
  --resource-group donpaolo-rg \
  --server donpaolo-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Option 2: PostgreSQL (Heroku/AWS RDS)

Update `Program.cs` to use PostgreSQL:

```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

Install package:
```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

---

## Post-Deployment Checklist

### ✅ Backend Verification

- [ ] API is accessible: `https://your-api.azurewebsites.net/api/Health`
- [ ] Swagger UI works: `https://your-api.azurewebsites.net/swagger`
- [ ] Database migrations applied
- [ ] JWT authentication working
- [ ] CORS configured correctly
- [ ] Environment variables set

### ✅ Frontend Verification

- [ ] Frontend loads: `https://your-frontend.netlify.app`
- [ ] API calls work (check browser console)
- [ ] Login functionality works
- [ ] All pages accessible
- [ ] Environment variables configured

### ✅ Security Checklist

- [ ] HTTPS enabled (both frontend and backend)
- [ ] JWT secret is strong and secure
- [ ] Database connection string is secure
- [ ] CORS only allows your frontend domain
- [ ] Environment variables not in code
- [ ] API rate limiting configured (optional)

### ✅ Performance

- [ ] Frontend build optimized
- [ ] Images optimized
- [ ] API response times acceptable
- [ ] Database indexes created
- [ ] CDN configured (if using)

---

## Quick Deployment Scripts

### Backend Deployment Script

Create `deploy-backend.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Backend..."

cd Api

# Build
echo "📦 Building..."
dotnet publish -c Release -o ./publish

# Deploy to Azure
echo "☁️ Deploying to Azure..."
az webapp deploy \
  --resource-group donpaolo-rg \
  --name donpaolo-api \
  --src-path ./publish \
  --type zip

# Run migrations
echo "🗄️ Running migrations..."
az webapp ssh --resource-group donpaolo-rg --name donpaolo-api --command "cd /home/site/wwwroot && dotnet ef database update"

echo "✅ Backend deployed successfully!"
```

### Frontend Deployment Script

Create `deploy-frontend.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Frontend..."

cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🏗️ Building..."
npm run build

# Deploy to Netlify
echo "☁️ Deploying to Netlify..."
netlify deploy --prod --dir=build

echo "✅ Frontend deployed successfully!"
```

Make scripts executable:
```bash
chmod +x deploy-backend.sh deploy-frontend.sh
```

---

## Troubleshooting

### Backend Issues

**Problem**: API returns 500 errors
- Check application logs: `az webapp log tail --name donpaolo-api --resource-group donpaolo-rg`
- Verify database connection string
- Check environment variables

**Problem**: CORS errors
- Verify CORS policy allows your frontend domain
- Check `AllowedOrigins` configuration

**Problem**: Database connection fails
- Verify firewall rules allow Azure services
- Check connection string format
- Ensure database exists

### Frontend Issues

**Problem**: API calls fail
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for CORS errors
- Verify backend is running

**Problem**: Build fails
- Check Node.js version (18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

---

## Continuous Deployment (CI/CD)

### GitHub Actions for Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]
    paths:
      - 'Api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '9.0.x'
      
      - name: Build
        run: |
          cd Api
          dotnet publish -c Release -o ./publish
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: donpaolo-api
          publish-directory: './Api/publish'
          azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}
```

### GitHub Actions for Frontend

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=frontend/build
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Cost Estimation

### Azure (Monthly)
- App Service (B1): ~$13/month
- Azure SQL Database (Basic): ~$5/month
- Static Web Apps: Free tier available
- **Total**: ~$18/month

### Netlify + Heroku
- Netlify: Free tier available
- Heroku: $7/month (Hobby)
- PostgreSQL: $0 (included)
- **Total**: ~$7/month

---

## Support

For issues or questions:
1. Check application logs
2. Review environment variables
3. Verify database connectivity
4. Check CORS configuration

---

**Your Don Paolo Restaurant Management System is now ready for production! 🎉**

