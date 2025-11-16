using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;

namespace Api
{
    public static class SeedRoles
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Check if roles already exist
            if (await context.Roles.AnyAsync())
            {
                return; // Roles already seeded
            }

            // Create roles - Only SuperAdmin and Cashier
            var roles = new List<Role>
            {
                new Role { Name = "SuperAdmin", Description = "Super Administrator with full system access" },
                new Role { Name = "Cashier", Description = "Cashier with POS access for local sales" }
            };

            context.Roles.AddRange(roles);
            await context.SaveChangesAsync();

            // Assign SuperAdmin role to the first user (if exists)
            var firstUser = await context.Users.FirstOrDefaultAsync();
            if (firstUser != null)
            {
                var superAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "SuperAdmin");
                if (superAdminRole != null)
                {
                    var userRole = new UserRole
                    {
                        UserId = firstUser.Id,
                        RoleId = superAdminRole.Id,
                        AssignedAt = DateTime.UtcNow
                    };

                    context.UserRoles.Add(userRole);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}




