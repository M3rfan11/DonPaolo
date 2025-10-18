# Azure SQL Database Setup Guide for Heritage Store Management System

## Overview
This guide will help you migrate your SQLite database to Microsoft Azure SQL Database for production deployment.

## Prerequisites
- Azure subscription
- Azure CLI installed (optional but recommended)
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Your current SQLite database file (`authrbac_dev.db`)

## Step 1: Create Azure SQL Database

### Option A: Using Azure Portal
1. **Sign in to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Create SQL Database**
   - Click "Create a resource"
   - Search for "SQL Database"
   - Click "Create"

3. **Configure Database Settings**
   ```
   Project Details:
   - Subscription: [Your subscription]
   - Resource Group: Create new "heritage-store-rg"

   Database Details:
   - Database name: heritage-store-db
   - Server: Create new server
     - Server name: heritage-store-server-[random]
     - Location: [Choose closest to your users]
     - Authentication method: SQL authentication
     - Server admin login: heritageadmin
     - Password: [Create strong password]
   - Want to use SQL elastic pool: No
   - Compute + storage: Basic (5 DTUs) - for development
   - Backup storage redundancy: Geo-redundant backup storage
   ```

4. **Configure Networking**
   - Networking tab
   - Connectivity method: Public endpoint
   - Allow Azure services: Yes
   - Add current client IP address: Yes

5. **Review and Create**
   - Review all settings
   - Click "Create"

### Option B: Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name heritage-store-rg --location eastus

# Create SQL server
az sql server create \
  --name heritage-store-server \
  --resource-group heritage-store-rg \
  --location eastus \
  --admin-user heritageadmin \
  --admin-password "YourStrongPassword123!"

# Create SQL database
az sql db create \
  --resource-group heritage-store-rg \
  --server heritage-store-server \
  --name heritage-store-db \
  --service-objective Basic

# Configure firewall rule
az sql server firewall-rule create \
  --resource-group heritage-store-rg \
  --server heritage-store-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 2: Update Connection String

### Update appsettings.json
Replace your SQLite connection string with Azure SQL connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:heritage-store-server.database.windows.net,1433;Initial Catalog=heritage-store-db;Persist Security Info=False;User ID=heritageadmin;Password=YourStrongPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
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

### Update appsettings.Development.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=tcp:heritage-store-server.database.windows.net,1433;Initial Catalog=heritage-store-db;Persist Security Info=False;User ID=heritageadmin;Password=YourStrongPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

## Step 3: Install Required NuGet Packages

Add the SQL Server provider to your project:

```bash
cd Api
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet remove package Microsoft.EntityFrameworkCore.Sqlite
```

## Step 4: Update ApplicationDbContext

Update your `ApplicationDbContext.cs` to use SQL Server:

```csharp
using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Your existing DbSets remain the same
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<ProductInventory> ProductInventories { get; set; }
        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<SalesItem> SalesItems { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseItem> PurchaseItems { get; set; }
        public DbSet<ProductRequest> ProductRequests { get; set; }
        public DbSet<ProductRequestItem> ProductRequestItems { get; set; }
        public DbSet<ProductAssembly> ProductAssemblies { get; set; }
        public DbSet<BillOfMaterial> BillOfMaterials { get; set; }
        public DbSet<ProductMovement> ProductMovements { get; set; }
        public DbSet<ProductMovementSummary> ProductMovementSummaries { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<ShoppingCart> ShoppingCarts { get; set; }
        public DbSet<OrderTracking> OrderTrackings { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships and constraints
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            // Configure indexes for better performance
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.SKU)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure decimal precision
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductInventory>()
                .Property(pi => pi.Quantity)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SalesOrder>()
                .Property(so => so.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SalesItem>()
                .Property(si => si.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SalesItem>()
                .Property(si => si.TotalPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseOrder>()
                .Property(po => po.TotalAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseItem>()
                .Property(pi => pi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseItem>()
                .Property(pi => pi.TotalPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductAssembly>()
                .Property(pa => pa.SalePrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BillOfMaterial>()
                .Property(bom => bom.Quantity)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductMovement>()
                .Property(pm => pm.Quantity)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ProductMovementSummary>()
                .Property(pms => pms.TotalQuantity)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ShoppingCart>()
                .Property(sc => sc.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<ShoppingCart>()
                .Property(sc => sc.TotalPrice)
                .HasPrecision(18, 2);
        }
    }
}
```

## Step 5: Update Program.cs

Update your `Program.cs` to use SQL Server:

```csharp
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add your custom services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IOnlineOrderManager, OnlineOrderManager>();
builder.Services.AddScoped<IRevenueTrackingService, RevenueTrackingService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Ensure database is created and seeded
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

app.Run();
```

## Step 6: Create and Run Migrations

Since you're switching from SQLite to SQL Server, you'll need to create new migrations:

```bash
cd Api

# Remove existing migrations (backup first!)
# rm -rf Migrations/

# Create new migration for SQL Server
dotnet ef migrations add InitialAzureSqlMigration

# Apply migrations to Azure SQL Database
dotnet ef database update
```

## Step 7: Seed Data

Create a new seeding script for Azure SQL:

```csharp
// Create SeedDataAzure.cs
using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api
{
    public static class SeedDataAzure
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Check if data already exists
            if (await context.Users.AnyAsync())
            {
                return; // Database has been seeded
            }

            // Seed Roles
            var roles = new[]
            {
                new Role { Name = "SuperAdmin", Description = "System Administrator" },
                new Role { Name = "StoreManager", Description = "Store Manager" },
                new Role { Name = "Cashier", Description = "Cashier" },
                new Role { Name = "Customer", Description = "Customer" },
                new Role { Name = "WarehouseManager", Description = "Warehouse Manager" }
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();

            // Seed Categories
            var categories = new[]
            {
                new Category { Name = "Perfumes", Description = "Fragrance Collection" },
                new Category { Name = "Cosmetics", Description = "Beauty Products" },
                new Category { Name = "Accessories", Description = "Fashion Accessories" }
            };

            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();

            // Seed Warehouses/Stores
            var warehouses = new[]
            {
                new Warehouse 
                { 
                    Name = "Heritage Downtown Store", 
                    Address = "123 Main Street", 
                    City = "New York", 
                    PhoneNumber = "+1-555-0123",
                    IsActive = true
                },
                new Warehouse 
                { 
                    Name = "Heritage Mall Store", 
                    Address = "456 Mall Drive", 
                    City = "Los Angeles", 
                    PhoneNumber = "+1-555-0456",
                    IsActive = true
                }
            };

            context.Warehouses.AddRange(warehouses);
            await context.SaveChangesAsync();

            // Seed Users
            var users = new[]
            {
                new User
                {
                    FullName = "System Administrator",
                    Email = "admin@heritage.com",
                    PasswordHash = HashPassword("admin123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    FullName = "Sarah Store Manager",
                    Email = "sarah.store1@heritage.com",
                    PasswordHash = HashPassword("manager123"),
                    IsActive = true,
                    AssignedStoreId = warehouses[0].Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            await context.SaveChangesAsync();

            // Assign roles to users
            var userRoles = new[]
            {
                new UserRole { UserId = users[0].Id, RoleId = roles[0].Id }, // Admin
                new UserRole { UserId = users[1].Id, RoleId = roles[1].Id }  // Store Manager
            };

            context.UserRoles.AddRange(userRoles);
            await context.SaveChangesAsync();

            // Seed Products
            var products = new[]
            {
                new Product
                {
                    Name = "Heritage Classic",
                    Description = "Timeless fragrance for the modern woman",
                    Price = 89.99m,
                    SKU = "HC001",
                    CategoryId = categories[0].Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Heritage Elegance",
                    Description = "Sophisticated scent for special occasions",
                    Price = 129.99m,
                    SKU = "HE002",
                    CategoryId = categories[0].Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Products.AddRange(products);
            await context.SaveChangesAsync();

            // Seed Product Inventory
            var inventories = new List<ProductInventory>();
            foreach (var product in products)
            {
                foreach (var warehouse in warehouses)
                {
                    inventories.Add(new ProductInventory
                    {
                        ProductId = product.Id,
                        WarehouseId = warehouse.Id,
                        Quantity = 50,
                        POSQuantity = 10,
                        MinimumStockLevel = 10,
                        MaximumStockLevel = 100,
                        Unit = "pieces",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }

            context.ProductInventories.AddRange(inventories);
            await context.SaveChangesAsync();
        }

        private static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
```

## Step 8: Update Program.cs to Include Seeding

```csharp
// Add this to Program.cs after creating the app
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await SeedDataAzure.SeedAsync(context);
}
```

## Step 9: Test the Connection

Run your application and test the connection:

```bash
cd Api
dotnet run
```

## Step 10: Security Best Practices

### 1. Use Azure Key Vault (Recommended)
Store your connection string in Azure Key Vault:

```bash
# Create Key Vault
az keyvault create \
  --name heritage-store-vault \
  --resource-group heritage-store-rg \
  --location eastus

# Add connection string secret
az keyvault secret set \
  --vault-name heritage-store-vault \
  --name "ConnectionStrings--DefaultConnection" \
  --value "Server=tcp:heritage-store-server.database.windows.net,1433;Initial Catalog=heritage-store-db;Persist Security Info=False;User ID=heritageadmin;Password=YourStrongPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

### 2. Update Program.cs for Key Vault
```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://heritage-store-vault.vault.azure.net/"),
    new DefaultAzureCredential());
```

### 3. Configure Managed Identity (For Production)
```bash
# Create managed identity
az identity create \
  --name heritage-store-identity \
  --resource-group heritage-store-rg

# Assign to SQL Server
az sql server ad-admin create \
  --resource-group heritage-store-rg \
  --server heritage-store-server \
  --display-name heritage-store-identity \
  --object-id [MANAGED_IDENTITY_OBJECT_ID]
```

## Step 11: Performance Optimization

### 1. Configure Connection Pooling
```csharp
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), 
        sqlOptions => sqlOptions.CommandTimeout(30)));
```

### 2. Enable Query Splitting
```csharp
options.UseSqlServer(connectionString, 
    sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
```

## Step 12: Monitoring and Maintenance

### 1. Enable Query Store
```sql
-- Connect to your Azure SQL Database and run:
ALTER DATABASE [heritage-store-db] SET QUERY_STORE = ON;
```

### 2. Set up Alerts
- Go to Azure Portal → SQL Database → Monitoring → Alerts
- Set up alerts for:
  - High CPU usage
  - Long-running queries
  - Connection failures

### 3. Regular Maintenance
- Monitor performance metrics
- Review slow queries
- Update statistics regularly
- Consider scaling up during peak times

## Troubleshooting

### Common Issues:

1. **Connection Timeout**
   - Increase connection timeout in connection string
   - Check firewall rules

2. **Authentication Failed**
   - Verify username/password
   - Check if SQL authentication is enabled

3. **Migration Issues**
   - Ensure all packages are updated
   - Check for SQL Server specific data types

4. **Performance Issues**
   - Monitor DTU usage
   - Consider upgrading service tier
   - Add appropriate indexes

## Cost Optimization

1. **Use Basic Tier for Development**
2. **Scale down during non-peak hours**
3. **Use Azure Hybrid Benefit if you have SQL Server licenses**
4. **Monitor and optimize queries**

## Next Steps

1. Deploy your application to Azure App Service
2. Set up CI/CD pipeline
3. Configure monitoring and alerting
4. Implement backup and disaster recovery
5. Set up staging environment

This setup will give you a production-ready Azure SQL Database for your Heritage Store Management System!
