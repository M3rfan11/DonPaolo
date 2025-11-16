# 🚀 Render Deployment Setup Guide for Don Paolo

## Quick Start

### Step 1: Prepare Your Project for PostgreSQL

Your project currently uses SQLite. For Render, you need to switch to PostgreSQL:

```bash
cd Api

# Add PostgreSQL package
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# Remove SQLite (optional - you can keep it for local development)
# dotnet remove package Microsoft.EntityFrameworkCore.Sqlite
```

### Step 2: Update Program.cs

Update the database configuration in `Api/Program.cs`:

**Find this line:**
```csharp
options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"), ...)
```

**Replace with:**
```csharp
// Use PostgreSQL in production, SQLite in development
if (builder.Environment.IsProduction())
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
}
else
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"), sqliteOptions =>
    {
        sqliteOptions.CommandTimeout(30);
    });
}
```

### Step 3: Deploy to Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New" → "Blueprint"**
3. **Connect your GitHub repository**: `M3rfan11/DonPaolo`
4. **Render will automatically detect `render.yaml`**
5. **Click "Apply"** to create the services

### Step 4: Configure Environment Variables

After deployment, go to your Web Service → Environment and set:

1. **Jwt__Key**: Generate a secure key
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the value

2. **Jwt__Audience**: Your frontend URL
   ```
   https://donpaolo.netlify.app
   ```
   (Update with your actual frontend URL)

3. **AllowedOrigins__0**: Your frontend URL
   ```
   https://donpaolo.netlify.app
   ```
   (Update with your actual frontend URL)

### Step 5: Run Database Migrations

After the first deployment:

1. Go to your Web Service → **Shell**
2. Run:
   ```bash
   cd /opt/render/project/src/Api
   dotnet ef database update
   ```

Or add to build command (temporary):
```bash
cd Api && dotnet ef database update && dotnet publish -c Release -o ./publish
```

### Step 6: Verify Deployment

1. **Check your API**: `https://donpaolo-api.onrender.com/api/Health`
2. **Check Swagger**: `https://donpaolo-api.onrender.com/swagger`
3. **Test login endpoint** with Postman or your frontend

## Important Notes

### Free Tier Limitations

- ⚠️ **Services spin down after 15 minutes of inactivity**
- ⚠️ First request after spin-down takes ~30 seconds (cold start)
- ✅ **750 hours/month** free
- ✅ Good for development/testing

### Production Recommendations

For production, upgrade to **Starter Plan** ($7/month):
- ✅ Always-on service (no spin-down)
- ✅ Better performance
- ✅ More reliable for production use

### Database Connection

The `render.yaml` automatically connects your database using:
```yaml
ConnectionStrings__DefaultConnection:
  fromDatabase:
    name: donpaolo-db
    property: connectionString
```

This uses Render's internal database URL automatically.

### Custom Domain

To use a custom domain:
1. Go to your Web Service → Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `Jwt__Issuer` and `AllowedOrigins__0` with your custom domain

## Troubleshooting

### Build Fails

**Error**: "Package not found"
- Make sure `Npgsql.EntityFrameworkCore.PostgreSQL` is added to `Api.csproj`
- Check that `dotnet restore` runs successfully locally

**Error**: "Migration not found"
- Make sure migrations are committed to Git
- Check that migrations are in `Api/Migrations/` folder

### Database Connection Fails

**Error**: "Connection refused"
- Verify database service is running
- Check that `ConnectionStrings__DefaultConnection` is set correctly
- Verify firewall rules (should be automatic with Render)

### CORS Errors

**Error**: "Access-Control-Allow-Origin"
- Make sure `AllowedOrigins__0` is set to your exact frontend URL
- Check that CORS middleware is configured in `Program.cs`
- Verify frontend is using the correct API URL

### Service Won't Start

**Error**: "Port already in use"
- Render automatically sets `$PORT` environment variable
- Make sure `Program.cs` uses `$PORT` or defaults to 10000
- Check that `ASPNETCORE_URLS` is set correctly

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | ✅ | Environment name | `Production` |
| `ASPNETCORE_URLS` | ✅ | Server URLs | `http://0.0.0.0:$PORT` |
| `PORT` | ✅ | Server port | `10000` |
| `ConnectionStrings__DefaultConnection` | ✅ | Database connection | Auto-set from database |
| `Jwt__Key` | ✅ | JWT secret key | Generate with `openssl rand -base64 32` |
| `Jwt__Issuer` | ✅ | JWT issuer | `https://donpaolo-api.onrender.com` |
| `Jwt__Audience` | ✅ | JWT audience | Your frontend URL |
| `AllowedOrigins__0` | ✅ | CORS allowed origin | Your frontend URL |

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Configure environment variables
3. ✅ Run database migrations
4. ✅ Deploy frontend to Netlify/Vercel
5. ✅ Update frontend `REACT_APP_API_URL` to your Render URL
6. ✅ Test the complete system

## Support

- Render Docs: https://render.com/docs
- Render Status: https://status.render.com
- Render Community: https://community.render.com

---

**Your Don Paolo API will be available at: `https://donpaolo-api.onrender.com`** 🎉

