using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Api.Data;
using Api.Services;
using Api.Middleware;
using Api;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
// Try multiple ways to get the connection string (Render might set it differently)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL"); // Render sometimes uses this

// Log connection string status (without exposing password)
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is missing!\n" +
        "Please ensure:\n" +
        "1. PostgreSQL database 'donpaolo-db' is created in Render\n" +
        "2. The database service name matches 'donpaolo-db' in render.yaml\n" +
        "3. Or manually set ConnectionStrings__DefaultConnection environment variable in Render dashboard");
}

// Convert PostgreSQL URI format to standard connection string if needed
if (connectionString.StartsWith("postgresql://") || connectionString.StartsWith("postgres://"))
{
    try
    {
        // Parse the URI format: postgresql://user:password@host:port/database
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var host = uri.Host;
        var dbPort = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        
        // Build standard Npgsql connection string
        connectionString = $"Host={host};Port={dbPort};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
        
        Console.WriteLine($"[DB Config] Converted URI to standard connection string format");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB Config] Error converting URI format: {ex.Message}");
        // Continue with original connection string - Npgsql might handle it
    }
}

// Log connection string format (mask password for security)
var maskedConnectionString = connectionString.Contains("@") 
    ? connectionString.Substring(0, connectionString.IndexOf("@")) + "@***" 
    : connectionString.Substring(0, Math.Min(20, connectionString.Length)) + "***";
Console.WriteLine($"[DB Config] Connection string format detected: {maskedConnectionString}");
Console.WriteLine($"[DB Config] Connection string length: {connectionString.Length}");
Console.WriteLine($"[DB Config] Starts with postgres: {connectionString.StartsWith("postgres")}");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (builder.Environment.IsProduction())
    {
        options.UseNpgsql(connectionString)
            .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
    else
    {
        options.UseSqlite(connectionString, sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(30);
        })
        .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
});

// Authentication & Authorization
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Custom services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IRevenueTrackingService, RevenueTrackingService>();
builder.Services.AddScoped<IOnlineOrderManager, OnlineOrderManager>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

// CORS
builder.Services.AddCors(options =>
{
    // Development: Allow all origins
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
    else
    {
        // Production: Allow specific frontend origins
        var frontendUrls = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
            ?? new[] { "https://donpaolo.netlify.app" };
        
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(frontendUrls)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    }
});

var app = builder.Build();

// Configure port for Render (uses PORT env var or defaults to 10000)
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
if (!app.Urls.Any())
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(builder.Environment.IsDevelopment() ? "AllowAll" : "AllowFrontend");

// Custom middleware
app.UseMiddleware<AuditMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is migrated and seeded
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        logger.LogInformation("Attempting to connect to database...");
        
        // Test database connection
        if (await context.Database.CanConnectAsync())
        {
            logger.LogInformation("Database connection successful. Running migrations...");
            
            try
            {
                context.Database.Migrate();
                logger.LogInformation("Migrations applied successfully.");
            }
            catch (Exception migrationEx)
            {
                // If migration fails due to data insertion issues (e.g., DateTime casting),
                // log the error but continue - seed methods will handle data insertion
                logger.LogWarning(migrationEx, "Migration encountered an error (likely data insertion). Continuing with seed methods...");
                logger.LogInformation("Attempting to ensure database schema is created...");
                
                // Try to ensure database is created even if migration fails
                try
                {
                    await context.Database.EnsureCreatedAsync();
                }
                catch
                {
                    // Ignore - database might already exist
                }
            }
            
            logger.LogInformation("Seeding database...");
            await SeedRoles.SeedAsync(context);
            await SeedUsers.SeedAsync(context);
            await SeedProducts.SeedAsync(context);
            
            logger.LogInformation("Database setup completed successfully.");
        }
        else
        {
            logger.LogWarning("Cannot connect to database. Please check your connection string.");
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error setting up database. Please ensure:");
        logger.LogError("1. PostgreSQL database 'donpaolo-db' is created in Render");
        logger.LogError("2. Go to your PostgreSQL service → 'Connections' tab");
        logger.LogError("3. Copy the 'Internal Database URL' (starts with postgresql://)");
        logger.LogError("4. Go to your Web Service → 'Environment' tab");
        logger.LogError("5. Add environment variable:");
        logger.LogError("   Key: ConnectionStrings__DefaultConnection");
        logger.LogError("   Value: [paste the Internal Database URL]");
        logger.LogError("6. Save and redeploy");
        // Don't throw - allow app to start so user can fix the issue
    }
}

app.Run();
