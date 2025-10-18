using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace Api
{
    public static class SeedUsers
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // First, update roles to match our implementation
            await UpdateRolesAsync(context);
            
            // Create stores
            await CreateStoresAsync(context);
            
            // Create users
            await CreateUsersAsync(context);
            
            // Assign users to stores
            await AssignUsersToStoresAsync(context);
        }

        private static async Task UpdateRolesAsync(ApplicationDbContext context)
        {
            // Clear existing roles
            var existingRoles = await context.Roles.ToListAsync();
            context.Roles.RemoveRange(existingRoles);
            await context.SaveChangesAsync();

            // Create the roles we need
            var roles = new List<Role>
            {
                new Role { Name = "SuperAdmin", Description = "Super Administrator with full system access" },
                new Role { Name = "StoreManager", Description = "Store Manager with store-specific access" },
                new Role { Name = "Cashier", Description = "Cashier with POS access for local sales" },
                new Role { Name = "Customer", Description = "Customer role for online ordering and order tracking" }
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();
        }

        private static async Task CreateStoresAsync(ApplicationDbContext context)
        {
            // Check if our test stores already exist
            var existingStore = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Store 1");
            if (existingStore != null)
            {
                return; // Test stores already exist
            }

            var stores = new List<Warehouse>
            {
                new Warehouse
                {
                    Name = "Store 1",
                    Address = "123 Main Street",
                    City = "New York",
                    PhoneNumber = "+1-555-0101",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new Warehouse
                {
                    Name = "Store 2",
                    Address = "456 Shopping Center",
                    City = "Los Angeles",
                    PhoneNumber = "+1-555-0102",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                },
                new Warehouse
                {
                    Name = "Online Store",
                    Address = "1000 E-Commerce Center",
                    City = "Online",
                    PhoneNumber = "+1-555-0104",
                    ManagerName = "Online Manager",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                }
            };

            context.Warehouses.AddRange(stores);
            await context.SaveChangesAsync();
        }

        private static async Task CreateUsersAsync(ApplicationDbContext context)
        {
            // Check if our test users already exist
            var existingTestUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@company.com");
            if (existingTestUser != null)
            {
                return; // Test users already exist
            }

            var users = new List<User>
            {
                // SuperAdmin
                new User
                {
                    FullName = "John Admin",
                    Email = "admin@company.com",
                    PasswordHash = HashPassword("admin123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Store Manager for Store 1
                new User
                {
                    FullName = "Sarah Store1 Manager",
                    Email = "sarah.store1@company.com",
                    PasswordHash = HashPassword("manager123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Cashier for Store 1
                new User
                {
                    FullName = "Tom Store1 Cashier",
                    Email = "tom.store1@company.com",
                    PasswordHash = HashPassword("cashier123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Store Manager for Store 2
                new User
                {
                    FullName = "Mike Store2 Manager",
                    Email = "mike.store2@company.com",
                    PasswordHash = HashPassword("manager123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Cashier for Store 2
                new User
                {
                    FullName = "Lisa Store2 Cashier",
                    Email = "lisa.store2@company.com",
                    PasswordHash = HashPassword("cashier123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Online Store Manager
                new User
                {
                    FullName = "Alex Online Manager",
                    Email = "alex.online@company.com",
                    PasswordHash = HashPassword("online123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                
                // Customer
                new User
                {
                    FullName = "Alice Customer",
                    Email = "alice.customer@company.com",
                    PasswordHash = HashPassword("customer123"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            await context.SaveChangesAsync();
        }

        private static async Task AssignUsersToStoresAsync(ApplicationDbContext context)
        {
            // Get roles
            var superAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "SuperAdmin");
            var storeManagerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "StoreManager");
            var cashierRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Cashier");
            var customerRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");

            // Get stores
            var store1 = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Store 1");
            var store2 = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Store 2");
            var onlineStore = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");

            // Get users
            var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@company.com");
            var sarahStore1 = await context.Users.FirstOrDefaultAsync(u => u.Email == "sarah.store1@company.com");
            var tomStore1 = await context.Users.FirstOrDefaultAsync(u => u.Email == "tom.store1@company.com");
            var mikeStore2 = await context.Users.FirstOrDefaultAsync(u => u.Email == "mike.store2@company.com");
            var lisaStore2 = await context.Users.FirstOrDefaultAsync(u => u.Email == "lisa.store2@company.com");
            var alexOnline = await context.Users.FirstOrDefaultAsync(u => u.Email == "alex.online@company.com");
            var aliceCustomer = await context.Users.FirstOrDefaultAsync(u => u.Email == "alice.customer@company.com");

            // Assign roles and stores
            var userRoles = new List<UserRole>();
            
            if (admin != null && superAdminRole != null)
                userRoles.Add(new UserRole { UserId = admin.Id, RoleId = superAdminRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (sarahStore1 != null && storeManagerRole != null)
                userRoles.Add(new UserRole { UserId = sarahStore1.Id, RoleId = storeManagerRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (tomStore1 != null && cashierRole != null)
                userRoles.Add(new UserRole { UserId = tomStore1.Id, RoleId = cashierRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (mikeStore2 != null && storeManagerRole != null)
                userRoles.Add(new UserRole { UserId = mikeStore2.Id, RoleId = storeManagerRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (lisaStore2 != null && cashierRole != null)
                userRoles.Add(new UserRole { UserId = lisaStore2.Id, RoleId = cashierRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (alexOnline != null && storeManagerRole != null)
                userRoles.Add(new UserRole { UserId = alexOnline.Id, RoleId = storeManagerRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (aliceCustomer != null && customerRole != null)
                userRoles.Add(new UserRole { UserId = aliceCustomer.Id, RoleId = customerRole.Id, AssignedAt = DateTime.UtcNow });

            context.UserRoles.AddRange(userRoles);
            await context.SaveChangesAsync();

            // Assign users to specific stores
            if (sarahStore1 != null && store1 != null)
            {
                sarahStore1.AssignedStoreId = store1.Id;
                store1.ManagerUserId = sarahStore1.Id;
                store1.ManagerName = sarahStore1.FullName;
            }
            
            if (tomStore1 != null && store1 != null)
                tomStore1.AssignedStoreId = store1.Id;
            
            if (mikeStore2 != null && store2 != null)
            {
                mikeStore2.AssignedStoreId = store2.Id;
                store2.ManagerUserId = mikeStore2.Id;
                store2.ManagerName = mikeStore2.FullName;
            }
            
            if (lisaStore2 != null && store2 != null)
                lisaStore2.AssignedStoreId = store2.Id;
                
            if (alexOnline != null && onlineStore != null)
            {
                alexOnline.AssignedStoreId = onlineStore.Id;
                onlineStore.ManagerUserId = alexOnline.Id;
                onlineStore.ManagerName = alexOnline.FullName;
            }

            await context.SaveChangesAsync();
        }

        private static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
