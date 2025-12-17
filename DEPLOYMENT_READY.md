# Deployment Ready - Backend & Frontend Only

This project is configured for deployment without the `printer/` folder. The printer folder is for local development only.

## ✅ What's Included in Deployment

### Backend (Api/)
- ✅ All API controllers and services
- ✅ Database models and migrations
- ✅ Authentication and authorization
- ✅ All business logic

### Frontend (frontend/)
- ✅ React application
- ✅ ePOS SDK library (`epos-2.27.0.js` in public folder)
- ✅ All UI components
- ✅ Printer service (works with ePOS SDK from public folder)

## ❌ What's Excluded

- ❌ `printer/` folder (local development only)
  - Printer helper .NET backend
  - ePOS SDK samples
  - Printer configuration scripts

## 📦 Deployment Files

### Backend Deployment

**Render (render.yaml)**
- ✅ Configured to build only `Api/` folder
- ✅ Excludes printer folder automatically
- ✅ Uses port 10000

**Docker (Api/Dockerfile)**
- ✅ Only copies `Api/` directory
- ✅ `.dockerignore` excludes printer folder

**Azure (deploy-backend.sh)**
- ✅ Only builds and deploys `Api/` folder
- ✅ No printer folder references

### Frontend Deployment

**Vercel (vercel.json)**
- ✅ Builds only `frontend/` folder
- ✅ ePOS SDK included from `public/` folder

**Netlify (deploy-frontend.sh)**
- ✅ Builds only `frontend/` folder
- ✅ ePOS SDK included in build output

## 🔧 Environment Variables

### Backend (.env or Render Dashboard)
```env
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<your-database-connection-string>
Jwt__Key=<your-jwt-secret>
Jwt__Issuer=https://your-api-url.com
Jwt__Audience=https://your-frontend-url.com
AllowedOrigins__0=https://your-frontend-url.com
```

### Frontend (.env.production or Vercel/Netlify)
```env
REACT_APP_API_URL=https://your-api-url.com
REACT_APP_PRINTER_HELPER_URL=<optional-for-ngrok>
```

## 🚀 Quick Deploy

### Backend to Render
1. Push to GitHub
2. Connect repository to Render
3. Render will use `render.yaml` automatically
4. Set environment variables in Render dashboard

### Frontend to Vercel
1. Push to GitHub
2. Connect repository to Vercel
3. Vercel will use `vercel.json` automatically
4. Set `REACT_APP_API_URL` in Vercel environment variables

### Frontend to Netlify
```bash
./deploy-frontend.sh
```

## 📝 Important Notes

1. **ePOS SDK**: The ePOS SDK file (`epos-2.27.0.js`) is in `frontend/public/` and will be included in the build automatically.

2. **Printer Functionality**: The printer service will work in deployed environments if:
   - Printer is on the same network as the user's device
   - Printer IP is configured in the app
   - ePOS-Print service is enabled on the printer

3. **No Printer Helper Backend**: The printer helper .NET backend in `printer/` folder is NOT needed for deployment. The frontend uses ePOS SDK directly.

4. **Git Ignore**: The `printer/` folder is in `.gitignore`, so it won't be committed or deployed.

## ✅ Verification Checklist

Before deploying, verify:
- [ ] `.gitignore` includes `printer/`
- [ ] `frontend/public/epos-2.27.0.js` exists
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Environment variables are set
- [ ] Database connection string is configured
- [ ] CORS is configured for frontend URL

## 🎯 Deployment Commands

### Build Backend
```bash
cd Api
dotnet publish -c Release -o ./publish
```

### Build Frontend
```bash
cd frontend
npm install
npm run build
```

The build outputs are ready for deployment!

