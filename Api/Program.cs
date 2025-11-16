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
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is missing. " +
        "Please set the ConnectionStrings__DefaultConnection environment variable.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (builder.Environment.IsProduction())
    {
        options.UseNpgsql(connectionString);
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
            context.Database.Migrate();
            
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
        logger.LogError("1. PostgreSQL database is created in Render");
        logger.LogError("2. ConnectionStrings__DefaultConnection environment variable is set");
        logger.LogError("3. Connection string format is correct");
        // Don't throw - allow app to start so user can fix the issue
    }
}

app.Run();
