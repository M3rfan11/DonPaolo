# 🚀 Render Manual Setup Guide for Don Paolo Backend

## Step-by-Step Configuration

### 1. Source Code ✅
- **Repository**: M3rfan11 / DonPaolo (already connected)
- **Branch**: `main` ✅

### 2. Name ✅
- **Name**: `donpaolo-api` (or keep "DonPaolo")

### 3. Language ⚠️ IMPORTANT
- **Change from "Docker" to**: Select **"Native"** or **"Other"**
- OR: Leave as "Docker" but you'll need to specify build commands manually

**Recommended**: Use **Native** and specify build commands below

### 4. Root Directory ⚠️ REQUIRED
- **Root Directory**: `Api`
- This tells Render where your .NET project is located

### 5. Build Command ⚠️ REQUIRED
```
dotnet restore && dotnet publish -c Release -o ./publish
```

### 6. Start Command ⚠️ REQUIRED
```
cd publish && dotnet Api.dll --urls http://0.0.0.0:$PORT
```

### 7. Environment Variables ⚠️ REQUIRED
Click "Add Environment Variable" and add these:

1. **ASPNETCORE_ENVIRONMENT**
   - Value: `Production`

2. **ASPNETCORE_URLS**
   - Value: `http://0.0.0.0:$PORT`

3. **PORT**
   - Value: `10000`

4. **ConnectionStrings__DefaultConnection**
   - Value: (Will be set after creating PostgreSQL database - see below)

5. **Jwt__Key**
   - Value: Generate with: `openssl rand -base64 32`
   - Or use a strong random string (minimum 32 characters)

6. **Jwt__Issuer**
   - Value: `https://donpaolo-api.onrender.com`
   - (Will be your actual service URL after deployment)

7. **Jwt__Audience**
   - Value: Your frontend URL (e.g., `https://donpaolo.netlify.app`)

8. **AllowedOrigins__0**
   - Value: Your frontend URL (e.g., `https://donpaolo.netlify.app`)

### 8. Instance Type
- **Free** is fine for testing (spins down after inactivity)
- **Starter ($7/month)** for production (always-on)

### 9. Region
- **Oregon (US West)** is fine, or choose closest to your users

---

## After Creating the Web Service

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `donpaolo-db`
   - **Database**: `donpaolo`
   - **User**: `donpaolo_user`
   - **Plan**: Free (or Starter for production)
   - **Region**: Same as your web service (Oregon)
3. Click **Create Database**

### Step 2: Get Database Connection String

1. Go to your PostgreSQL service
2. Find **"Internal Database URL"** or **"Connection String"**
3. Copy the connection string (looks like: `postgresql://donpaolo_user:password@hostname:5432/donpaolo`)

### Step 3: Update Web Service Environment Variables

1. Go back to your Web Service → **Environment**
2. Update **ConnectionStrings__DefaultConnection** with the database URL you copied
3. Update **Jwt__Issuer** with your actual service URL (will be shown after first deploy)

### Step 4: Run Database Migrations

After the first deployment:

1. Go to your Web Service → **Shell** (or **Logs**)
2. Run:
   ```bash
   cd /opt/render/project/src/Api
   dotnet ef database update
   ```

OR add to build command temporarily:
```
dotnet restore && dotnet ef database update && dotnet publish -c Release -o ./publish
```

### Step 5: Verify Deployment

1. Your API will be available at: `https://donpaolo-api.onrender.com`
2. Test health endpoint: `https://donpaolo-api.onrender.com/api/Health`
3. Swagger UI: `https://donpaolo-api.onrender.com/swagger`

---

## Quick Reference - Exact Values to Enter

### Build & Start Commands:
```
Build Command: dotnet restore && dotnet publish -c Release -o ./publish
Start Command: cd publish && dotnet Api.dll --urls http://0.0.0.0:$PORT
Root Directory: Api
```

### Environment Variables (Minimum Required):
```
ASPNETCORE_ENVIRONMENT = Production
ASPNETCORE_URLS = http://0.0.0.0:$PORT
PORT = 10000
ConnectionStrings__DefaultConnection = <from PostgreSQL>
Jwt__Key = <generate with: openssl rand -base64 32>
Jwt__Issuer = https://donpaolo-api.onrender.com
Jwt__Audience = <your frontend URL>
AllowedOrigins__0 = <your frontend URL>
```

---

## Alternative: Use Blueprint (Easier!)

Instead of manual setup, you can:

1. Go to **New** → **Blueprint**
2. Connect your GitHub repository: `M3rfan11/DonPaolo`
3. Render will automatically detect `render.yaml`
4. Click **Apply**
5. Render will create both the web service and database automatically!

This is much easier and recommended! 🎉

