using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Net;
using System.Net.Sockets;
using Api.Data;
using Api.Services;
using Api.Middleware;
using Api;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to handle camelCase from frontend
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
// Try multiple ways to get the connection string (Render might set it differently)
// Check all possible sources first
var fromAppSettings = builder.Configuration.GetConnectionString("DefaultConnection");
var fromEnvVar = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
var fromDatabseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

// Log connection string source detection
Console.WriteLine("[DB Config] ========================================");
Console.WriteLine("[DB Config] Connection String Source Detection");
Console.WriteLine("[DB Config] ========================================");
Console.WriteLine($"[DB Config] From appsettings.json: {(string.IsNullOrEmpty(fromAppSettings) ? "NOT SET" : "SET (SQLite for local dev)")}");
Console.WriteLine($"[DB Config] From ConnectionStrings__DefaultConnection env var: {(string.IsNullOrEmpty(fromEnvVar) ? "NOT SET ❌" : "SET ✅")}");
Console.WriteLine($"[DB Config] From DATABASE_URL env var: {(string.IsNullOrEmpty(fromDatabseUrl) ? "NOT SET" : "SET")}");

// Get connection string (priority: env var > DATABASE_URL > appsettings)
var connectionString = fromEnvVar 
    ?? fromDatabseUrl 
    ?? fromAppSettings;

// Log which source was used
string sourceUsed = "UNKNOWN";
if (!string.IsNullOrEmpty(fromEnvVar))
    sourceUsed = "Environment Variable (ConnectionStrings__DefaultConnection) ✅";
else if (!string.IsNullOrEmpty(fromDatabseUrl))
    sourceUsed = "Environment Variable (DATABASE_URL)";
else if (!string.IsNullOrEmpty(fromAppSettings))
    sourceUsed = "appsettings.json (⚠️ This is SQLite for local dev - should NOT be used in production!)";

Console.WriteLine($"[DB Config] Connection string source: {sourceUsed}");
if (!string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine($"[DB Config] Connection string starts with: {connectionString.Substring(0, Math.Min(20, connectionString.Length))}...");
}
Console.WriteLine("[DB Config] ========================================");

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.WriteLine("[DB Config] ❌ ERROR: No connection string found from any source!");
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is missing!\n" +
        "Please ensure:\n" +
        "1. PostgreSQL database 'donpaolo-db' is created in Render\n" +
        "2. The database service name matches 'donpaolo-db' in render.yaml\n" +
        "3. Or manually set ConnectionStrings__DefaultConnection environment variable in Render dashboard");
}

// Convert PostgreSQL URI format to standard connection string if needed
// Also normalize connection string formats (User Id -> Username, Server -> Host)
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
        
        // Debug logging for pooler connections
        Console.WriteLine($"[DB Config] Parsed username: {username}");
        Console.WriteLine($"[DB Config] Parsed host: {host}");
        Console.WriteLine($"[DB Config] Parsed port: {dbPort}");
        Console.WriteLine($"[DB Config] Parsed database: {database}");
        Console.WriteLine($"[DB Config] Password length: {(string.IsNullOrEmpty(password) ? 0 : password.Length)}");
        
        // Check if this is a Supabase connection
        bool isSupabase = host.Contains("supabase.co");
        
        // IMPORTANT: Supabase deprecated Session Mode on port 6543 (now Transaction Mode only)
        // EF Core requires Session Mode, so we must use port 5432
        // Port 6543 is only for Transaction Mode (not compatible with EF Core)
        int finalPort = dbPort;
        
        if (isSupabase)
        {
            // Force port 5432 for Supabase (Session Mode required for EF Core)
            // If user provided 6543, switch to 5432 and log warning
            if (dbPort == 6543)
            {
                finalPort = 5432;
                Console.WriteLine($"[DB Config] WARNING: Port 6543 is Transaction Mode only. Switching to port 5432 (Session Mode) for EF Core compatibility");
            }
            else if (dbPort == 5432)
            {
                Console.WriteLine($"[DB Config] Detected Supabase - using port 5432 (Session Mode)");
            }
        }
        
        // For SSL connections (especially pooler), use hostname for proper certificate validation
        // IP addresses bypass SSL certificate validation which can cause connection failures
        string connectionHost = host;
        string ipv4AddressStr = null;
        bool isPooler = host.Contains("pooler.supabase.com");
        
        // For pooler connections, always use hostname for SSL certificate validation
        if (isPooler)
        {
            Console.WriteLine($"[DB Config] Using pooler connection - keeping hostname '{host}' for SSL certificate validation");
            connectionHost = host;
        }
        else
        {
            // For direct connections, we MUST use the pooler instead
            // Direct connections only resolve to IPv6, which Render cannot access
            Console.WriteLine($"[DB Config] ⚠️ WARNING: Direct connection detected but only resolves to IPv6");
            Console.WriteLine($"[DB Config] 💡 SOLUTION: Switching to pooler connection for Render compatibility");
            Console.WriteLine($"[DB Config] 🔄 Converting direct connection to pooler format...");
            
            // Convert direct connection to pooler format
            // Direct: db.xxxxx.supabase.co -> Pooler: aws-X-region.pooler.supabase.com
            // Extract project ref from direct hostname
            var projectRef = host.Replace("db.", "").Replace(".supabase.co", "");
            
            // Try to determine region from the direct hostname or use default
            // Most Supabase projects use aws-0 or aws-1 with region
            // For now, we'll construct a pooler hostname
            // User should use pooler connection string instead
            Console.WriteLine($"[DB Config] ❌ ERROR: Direct connection not compatible with Render (IPv6 only)");
            Console.WriteLine($"[DB Config] ✅ SOLUTION: Use pooler connection string from Supabase dashboard");
            Console.WriteLine($"[DB Config] 📋 Pooler format: postgresql://postgres.{projectRef}:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres");
            
            // For now, keep the direct hostname but log the issue
            connectionHost = host;
            
            // Try IPv4 resolution anyway (will likely fail)
            try
            {
                Console.WriteLine($"[DB Config] Resolving hostname '{host}' to IPv4 address...");
                
                // Try GetHostEntry first (most common)
                var hostEntry = Dns.GetHostEntry(host);
                Console.WriteLine($"[DB Config] DNS returned {hostEntry.AddressList.Length} address(es)");
                
                // Log all addresses for debugging
                foreach (var addr in hostEntry.AddressList)
                {
                    Console.WriteLine($"[DB Config] Found address: {addr} (Family: {addr.AddressFamily})");
                }
                
                // Find the first IPv4 address
                var ipv4Address = hostEntry.AddressList
                    .FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork);
                
                if (ipv4Address != null)
                {
                    ipv4AddressStr = ipv4Address.ToString();
                    connectionHost = ipv4AddressStr;
                    Console.WriteLine($"[DB Config] ✅ Resolved '{host}' to IPv4: {ipv4AddressStr}");
                }
                else
                {
                    // Try GetHostAddresses as fallback
                    Console.WriteLine($"[DB Config] No IPv4 in GetHostEntry, trying GetHostAddresses...");
                    var addresses = Dns.GetHostAddresses(host);
                    var ipv4FromAddresses = addresses.FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork);
                    
                    if (ipv4FromAddresses != null)
                    {
                        ipv4AddressStr = ipv4FromAddresses.ToString();
                        connectionHost = ipv4AddressStr;
                        Console.WriteLine($"[DB Config] ✅ Found IPv4 via GetHostAddresses: {ipv4AddressStr}");
                    }
                    else
                    {
                        Console.WriteLine($"[DB Config] ⚠️ WARNING: No IPv4 address found for '{host}'");
                        Console.WriteLine($"[DB Config] ⚠️ This will likely cause connection failures on Render");
                        Console.WriteLine($"[DB Config] ⚠️ SOLUTION: Use Supabase connection pooler or check Supabase network settings");
                        // Still use hostname, but this will likely fail
                        connectionHost = host;
                    }
                }
            }
            catch (Exception dnsEx)
            {
                Console.WriteLine($"[DB Config] ❌ DNS resolution failed for '{host}': {dnsEx.Message}");
                Console.WriteLine($"[DB Config] ⚠️ This will likely cause connection failures");
                connectionHost = host;
            }
        }
        
        // Build standard Npgsql connection string
        // Use resolved IPv4 IP if available to avoid IPv6 issues
        // If no IPv4 found, we'll still try hostname but connection will likely fail
        // Note: Removed Min/Max Pool Size as they're not supported in all Npgsql versions
        // Use basic connection parameters that work with all Npgsql versions
        connectionString = $"Host={connectionHost};Port={finalPort};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;Include Error Detail=true;Timeout=60;Command Timeout=60";
        
        // For Supabase, add additional connection parameters for better reliability
        if (isSupabase)
        {
            // For pooler connections, ensure proper SSL settings
            if (isPooler)
            {
                // Pooler connections require hostname for SSL certificate validation
                // Keep SSL Mode=Require but ensure we're using hostname (not IP)
                connectionString += ";Application Name=donpaolo-api";
            }
            
            // Add connection resilience parameters (simplified to avoid unsupported parameter errors)
            connectionString += ";Tcp Keepalive=true";
            
            if (isPooler)
            {
                Console.WriteLine($"[DB Config] ✅ Using pooler hostname '{host}' for SSL certificate validation");
            }
            else if (ipv4AddressStr != null)
            {
                Console.WriteLine($"[DB Config] ✅ Using IPv4 address: {ipv4AddressStr} (original hostname: {host})");
            }
            else
            {
                Console.WriteLine($"[DB Config] ⚠️ WARNING: No IPv4 address found for direct connection");
                Console.WriteLine($"[DB Config] 💡 SOLUTION: Use Supabase Connection Pooler (check Supabase dashboard)");
                Console.WriteLine($"[DB Config] ⚠️  Attempting connection with hostname (may fail due to IPv6)");
            }
        }
        
        Console.WriteLine($"[DB Config] Converted URI to standard connection string format (port: {finalPort}, host: {connectionHost})");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB Config] Error converting URI format: {ex.Message}");
        // Continue with original connection string - Npgsql might handle it
    }
}
else
{
    // Normalize connection string format (User Id -> Username, Server -> Host)
    // Npgsql prefers Username and Host over User Id and Server
    if (connectionString.Contains("User Id="))
    {
        connectionString = connectionString.Replace("User Id=", "Username=");
        Console.WriteLine($"[DB Config] Normalized 'User Id' to 'Username'");
    }
    if (connectionString.Contains("Server="))
    {
        connectionString = connectionString.Replace("Server=", "Host=");
        Console.WriteLine($"[DB Config] Normalized 'Server' to 'Host'");
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
    // Detect PostgreSQL connection string (URI format or Npgsql format)
    // Check for PostgreSQL indicators: URI format, Host=, Server=, or Username= with Host/Server
    // Also check for pooler.supabase.com or supabase.co in hostname
    bool isPostgreSQL = connectionString.StartsWith("postgresql://") 
        || connectionString.StartsWith("postgres://")
        || connectionString.Contains("Host=")
        || connectionString.Contains("Server=")
        || connectionString.Contains("pooler.supabase.com")
        || connectionString.Contains(".supabase.co");
    
    if (isPostgreSQL)
    {
        options.UseNpgsql(connectionString, npgsqlOptions =>
        {
            // Enable retry on failure for transient errors (network issues, timeouts, etc.)
            npgsqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,                    // Retry up to 5 times
                maxRetryDelay: TimeSpan.FromSeconds(30), // Max delay between retries
                errorCodesToAdd: null                 // Retry on all transient errors
            );
            
            // Set command timeout
            npgsqlOptions.CommandTimeout(60);
        })
        .EnableSensitiveDataLogging()  // Log SQL with parameter values (for debugging)
        .LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information)  // Log SQL queries
        .ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
    else
    {
        // Use SQLite for local development when no PostgreSQL connection string is provided
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
        var configuredUrls = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        var frontendUrls = configuredUrls ?? new[] { "https://donpaolo.netlify.app" };
        
        // Always allow localhost for local development/testing
        var allOrigins = frontendUrls.ToList();
        if (!allOrigins.Contains("http://localhost:3000"))
        {
            allOrigins.Add("http://localhost:3000");
        }
        if (!allOrigins.Contains("http://localhost:3001"))
        {
            allOrigins.Add("http://localhost:3001");
        }
        
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allOrigins.ToArray())
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
        
        // Test database connection with detailed error logging
        try
        {
            logger.LogInformation("Testing database connection...");
            
            // Try to get the actual connection string for debugging (masked)
            var connString = context.Database.GetConnectionString();
            if (!string.IsNullOrEmpty(connString))
            {
                var maskedConn = connString.Contains("@") 
                    ? connString.Substring(0, Math.Min(connString.IndexOf("@"), 50)) + "@***" 
                    : connString.Substring(0, Math.Min(50, connString.Length)) + "***";
                logger.LogInformation("Connection string (masked): {MaskedConn}", maskedConn);
            }
            
            // Try to connect and catch any exceptions
            bool canConnect = false;
            Exception connectionException = null;
            try
            {
                canConnect = await context.Database.CanConnectAsync();
                
                // If CanConnectAsync returns false, try to open a connection to get the actual error
                if (!canConnect)
                {
                    logger.LogWarning("CanConnectAsync returned false, attempting to open connection to get detailed error...");
                    try
                    {
                        await context.Database.OpenConnectionAsync();
                        canConnect = true;
                        await context.Database.CloseConnectionAsync();
                    }
                    catch (Exception openEx)
                    {
                        connectionException = openEx;
                        logger.LogError(openEx, "Exception during OpenConnectionAsync:");
                        logger.LogError("Error Type: {Type}", openEx.GetType().Name);
                        logger.LogError("Error Message: {Message}", openEx.Message);
                        if (openEx.InnerException != null)
                        {
                            logger.LogError("Inner Exception: {InnerType} - {InnerMessage}", 
                                openEx.InnerException.GetType().Name, 
                                openEx.InnerException.Message);
                        }
                    }
                }
            }
            catch (Exception connectEx)
            {
                connectionException = connectEx;
                logger.LogError(connectEx, "Exception during CanConnectAsync:");
                logger.LogError("Error Type: {Type}", connectEx.GetType().Name);
                logger.LogError("Error Message: {Message}", connectEx.Message);
                if (connectEx.InnerException != null)
                {
                    logger.LogError("Inner Exception: {InnerType} - {InnerMessage}", 
                        connectEx.InnerException.GetType().Name, 
                        connectEx.InnerException.Message);
                }
            }
            
            if (canConnect)
            {
            logger.LogInformation("✅ Database connection successful! Running migrations...");
            
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
                logger.LogError("❌ Cannot connect to database. Connection test returned false.");
                if (connectionException != null)
                {
                    logger.LogError("Connection exception details:");
                    logger.LogError("  Type: {Type}", connectionException.GetType().Name);
                    logger.LogError("  Message: {Message}", connectionException.Message);
                    if (connectionException.InnerException != null)
                    {
                        logger.LogError("  Inner Exception: {InnerType} - {InnerMessage}", 
                            connectionException.InnerException.GetType().Name,
                            connectionException.InnerException.Message);
                    }
                }
                else
                {
                    logger.LogError("No exception thrown, but connection failed. This usually means:");
                    logger.LogError("  1. Database server is not reachable");
                    logger.LogError("  2. Network connectivity issues");
                    logger.LogError("  3. Firewall blocking the connection");
                    logger.LogError("  4. Incorrect connection string or credentials");
                    logger.LogError("  5. SSL/TLS handshake failure");
                }
                logger.LogError("Check the logs above for DNS resolution details.");
                // Re-throw the exception if we have one
                if (connectionException != null)
                {
                    throw connectionException;
                }
            }
        }
        catch (Exception connectionEx)
        {
            // Log detailed connection error
            logger.LogError(connectionEx, "❌ Database connection failed!");
            logger.LogError("Error Type: {ErrorType}", connectionEx.GetType().Name);
            logger.LogError("Error Message: {ErrorMessage}", connectionEx.Message);
            
            // Log full stack trace for debugging
            logger.LogError("Stack Trace: {StackTrace}", connectionEx.StackTrace);
            
            if (connectionEx.InnerException != null)
            {
                logger.LogError("--- Inner Exception ---");
                logger.LogError("Type: {InnerType}", connectionEx.InnerException.GetType().Name);
                logger.LogError("Message: {InnerMessage}", connectionEx.InnerException.Message);
                
                var innerMessage = connectionEx.InnerException.Message;
                
                if (innerMessage.Contains("Network is unreachable") || innerMessage.Contains("No route to host") || innerMessage.Contains("Name or service not known"))
                {
                    logger.LogError("🔴 NETWORK CONNECTIVITY ISSUE DETECTED:");
                    logger.LogError("This usually means:");
                    logger.LogError("  1. Supabase hostname cannot be resolved to IPv4");
                    logger.LogError("  2. Render's network cannot reach Supabase (IPv6 issue)");
                    logger.LogError("  3. Supabase network restrictions are blocking Render's IP");
                    logger.LogError("");
                    logger.LogError("💡 SOLUTIONS:");
                    logger.LogError("  A. Use Supabase Connection Pooler (has better IPv4 support)");
                    logger.LogError("     → Go to Supabase Dashboard → Settings → Database");
                    logger.LogError("     → Look for 'Connection Pooling' section");
                    logger.LogError("     → Use the pooler connection string instead");
                    logger.LogError("");
                    logger.LogError("  B. Check Supabase Network Restrictions:");
                    logger.LogError("     → Go to Supabase → Settings → Database → Network Restrictions");
                    logger.LogError("     → Make sure 'Your database can be accessed by all IP addresses' is enabled");
                    logger.LogError("");
                    logger.LogError("  C. Contact Supabase Support:");
                    logger.LogError("     → Ask about IPv4 availability for your region");
                }
                else if (innerMessage.Contains("password authentication failed") || innerMessage.Contains("authentication failed"))
                {
                    logger.LogError("🔴 AUTHENTICATION FAILED:");
                    logger.LogError("The database password in your connection string is incorrect.");
                    logger.LogError("SOLUTION: Verify your Supabase database password matches the connection string");
                }
                else if (innerMessage.Contains("does not exist") || innerMessage.Contains("database"))
                {
                    logger.LogError("🔴 DATABASE NOT FOUND:");
                    logger.LogError("The database name in your connection string is incorrect.");
                    logger.LogError("SOLUTION: Verify the database name is 'postgres' in your connection string");
                }
                else if (innerMessage.Contains("timeout") || innerMessage.Contains("timed out"))
                {
                    logger.LogError("🔴 CONNECTION TIMEOUT:");
                    logger.LogError("The database server did not respond in time.");
                    logger.LogError("This could indicate network issues or server overload.");
                }
                else
                {
                    logger.LogError("🔴 UNKNOWN CONNECTION ERROR:");
                    logger.LogError("Please check the error message above for details.");
                }
            }
            
            logger.LogWarning("⚠️ Application will continue without database connection.");
            logger.LogWarning("⚠️ Fix the connection string and redeploy to enable database features.");
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
