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

            // Create the roles we need - Only SuperAdmin and Cashier
            var roles = new List<Role>
            {
                new Role { Name = "SuperAdmin", Description = "Super Administrator with full system access" },
                new Role { Name = "Cashier", Description = "Cashier with POS access for local sales" }
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();
        }

        private static async Task CreateStoresAsync(ApplicationDbContext context)
        {
            // Check if our test store already exists
            var existingStore = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Main Store");
            if (existingStore != null)
            {
                return; // Test store already exists
            }

            // Create only one store for SuperAdmin and Cashier
            var store = new Warehouse
            {
                Name = "Main Store",
                Address = "123 Main Street",
                City = "New York",
                PhoneNumber = "+1-555-0101",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            context.Warehouses.Add(store);
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
                
                // Cashier
                new User
                {
                    FullName = "Tom Cashier",
                    Email = "cashier@company.com",
                    PasswordHash = HashPassword("cashier123"),
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
            var cashierRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Cashier");

            // Get the main store
            var mainStore = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Main Store");

            // Get users
            var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@company.com");
            var cashier = await context.Users.FirstOrDefaultAsync(u => u.Email == "cashier@company.com");

            // Assign roles
            var userRoles = new List<UserRole>();
            
            if (admin != null && superAdminRole != null)
                userRoles.Add(new UserRole { UserId = admin.Id, RoleId = superAdminRole.Id, AssignedAt = DateTime.UtcNow });
            
            if (cashier != null && cashierRole != null)
                userRoles.Add(new UserRole { UserId = cashier.Id, RoleId = cashierRole.Id, AssignedAt = DateTime.UtcNow });

            context.UserRoles.AddRange(userRoles);
            await context.SaveChangesAsync();

            // Assign both users to the same store
            if (mainStore != null)
            {
                if (admin != null)
                    admin.AssignedStoreId = mainStore.Id;
                
                if (cashier != null)
                    cashier.AssignedStoreId = mainStore.Id;
            }

            await context.SaveChangesAsync();
        }

        private static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
