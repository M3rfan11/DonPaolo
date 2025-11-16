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
        
        // Check if this is a Supabase connection (use connection pooler for better reliability)
        bool isSupabase = host.Contains("supabase.co");
        
        // For Supabase, use connection pooler (port 6543) if port is 5432, or use provided port
        // Connection pooler is more reliable for external connections
        int finalPort = dbPort;
        if (isSupabase && dbPort == 5432)
        {
            // Try connection pooler first (port 6543), but allow override
            finalPort = 6543;
            Console.WriteLine($"[DB Config] Detected Supabase - using connection pooler (port 6543)");
        }
        
        // Build standard Npgsql connection string
        // Force IPv4 to avoid IPv6 connectivity issues
        // Include connection timeout and command timeout for better reliability
        connectionString = $"Host={host};Port={finalPort};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;Include Error Detail=true;Timeout=30;Command Timeout=30";
        
        // For Supabase, also try to force IPv4 resolution
        if (isSupabase)
        {
            connectionString += ";No Reset On Close=true";
        }
        
        Console.WriteLine($"[DB Config] Converted URI to standard connection string format (port: {finalPort})");
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

// Global exception handler - must be early in pipeline
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

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
                // Check pending migrations before running
                var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
                
                logger.LogInformation("Applied migrations: {AppliedCount}", appliedMigrations.Count());
                logger.LogInformation("Pending migrations: {PendingCount}", pendingMigrations.Count());
                
                if (pendingMigrations.Any())
                {
                    logger.LogInformation("Pending migrations: {Migrations}", string.Join(", ", pendingMigrations));
                }
                
                context.Database.Migrate();
                logger.LogInformation("Migrations applied successfully.");
            }
            catch (Exception migrationEx)
            {
                // Log detailed migration error
                logger.LogError(migrationEx, "Migration failed. Error: {ErrorMessage}", migrationEx.Message);
                
                // Extract inner exception details if available
                if (migrationEx.InnerException != null)
                {
                    logger.LogError("Inner exception: {InnerMessage}", migrationEx.InnerException.Message);
                    
                    // Check for PostgreSQL-specific errors that indicate migration SQL issues
                    var innerMessage = migrationEx.InnerException.Message;
                    if (innerMessage.Contains("syntax error") || innerMessage.Contains("does not exist"))
                    {
                        logger.LogError("POSTGRESQL MIGRATION SQL ERROR:");
                        logger.LogError("The FixPostgreSQLIdentityColumns migration may have SQL syntax issues.");
                        logger.LogError("This migration should only run on PostgreSQL - check if you're using the correct database.");
                    }
                    else if (innerMessage.Contains("null value in column"))
                    {
                        logger.LogError("IDENTITY COLUMN ISSUE DETECTED:");
                        logger.LogError("The Id columns are not configured as identity columns.");
                        logger.LogError("This means the FixPostgreSQLIdentityColumns migration either:");
                        logger.LogError("  1. Hasn't run yet (check pending migrations)");
                        logger.LogError("  2. Failed to execute (check migration logs above)");
                        logger.LogError("  3. The SQL didn't work correctly");
                        logger.LogError("SOLUTION: Check the migration logs above and ensure sequences are created.");
                    }
                }
                
                // For PostgreSQL, we should NOT continue if migrations fail - the schema is broken
                // Only continue for SQLite in development
                var isProduction = app.Environment.IsProduction();
                if (isProduction)
                {
                    logger.LogError("CRITICAL: Migration failed in production. The application may not work correctly.");
                    logger.LogError("Please check the migration logs and fix the issue before continuing.");
                    // Still allow app to start so health checks can work, but log the error
                }
                else
                {
                    logger.LogWarning("Continuing with seed methods despite migration error (development mode)...");
                }
                
                // Try to ensure database is created even if migration fails (for development)
                if (!isProduction)
                {
                    try
                    {
                        await context.Database.EnsureCreatedAsync();
                    }
                    catch (Exception ensureEx)
                    {
                        logger.LogWarning(ensureEx, "EnsureCreated also failed - database might already exist");
                    }
                }
            }
            
            logger.LogInformation("Seeding database...");
            
            try
            {
                await SeedRoles.SeedAsync(context);
                logger.LogInformation("Roles seeded successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to seed roles. Error: {ErrorMessage}", ex.Message);
                if (ex.InnerException != null)
                {
                    logger.LogError("Inner exception: {InnerMessage}", ex.InnerException.Message);
                }
            }
            
            try
            {
                await SeedUsers.SeedAsync(context);
                logger.LogInformation("Users seeded successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to seed users. Error: {ErrorMessage}", ex.Message);
            }
            
            try
            {
                await SeedProducts.SeedAsync(context);
                logger.LogInformation("Products seeded successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to seed products. Error: {ErrorMessage}", ex.Message);
            }
            
            logger.LogInformation("Database setup completed (with possible warnings above).");
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
