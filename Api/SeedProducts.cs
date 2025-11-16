using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Models;

namespace Api
{
    public static class SeedProducts
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Create categories first
            await CreateCategoriesAsync(context);
            
            // Create products
            await CreateProductsAsync(context);
            
            // Create product inventories for each store
            await CreateProductInventoriesAsync(context);
        }

        private static async Task CreateCategoriesAsync(ApplicationDbContext context)
        {
            // Check if categories already exist
            if (await context.Categories.AnyAsync())
            {
                return;
            }

            var categories = new List<Category>
            {
                new Category
                {
                    Name = "Pizza",
                    Description = "Traditional Italian pizzas",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Pasta",
                    Description = "Fresh pasta dishes",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Calzone",
                    Description = "Folded pizza specialties",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Dolci",
                    Description = "Desserts and sweet treats",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Salads",
                    Description = "Fresh salads",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Antipasti",
                    Description = "Appetizers and starters",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        private static async Task CreateProductsAsync(ApplicationDbContext context)
        {
            // Check if products already exist
            if (await context.Products.AnyAsync())
            {
                return; // Skip seeding if products already exist
            }

            var pizzaCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Pizza");
            var pastaCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Pasta");
            var calzoneCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Calzone");
            var dolciCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Dolci");
            var saladsCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Salads");
            var antipastiCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Antipasti");

            var products = new List<Product>
            {
                // Pizza
                new Product { Name = "Salmoni", Price = 470m, Unit = "piece", SKU = "PIZ-001", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Margh", Price = 295m, Unit = "piece", SKU = "PIZ-002", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Bufala", Price = 390m, Unit = "piece", SKU = "PIZ-003", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Bersaula", Price = 440m, Unit = "piece", SKU = "PIZ-004", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Pesto", Price = 350m, Unit = "piece", SKU = "PIZ-005", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Frutti", Price = 480m, Unit = "piece", SKU = "PIZ-006", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Ortlana", Price = 245m, Unit = "piece", SKU = "PIZ-007", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Pepproni", Price = 345m, Unit = "piece", SKU = "PIZ-008", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Quatro", Price = 390m, Unit = "piece", SKU = "PIZ-009", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Tartufu", Price = 410m, Unit = "piece", SKU = "PIZ-010", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Napoli", Price = 430m, Unit = "piece", SKU = "PIZ-011", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Gambritti", Price = 490m, Unit = "piece", SKU = "PIZ-012", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Gorgonzola", Price = 375m, Unit = "piece", SKU = "PIZ-013", CategoryId = pizzaCategory?.Id ?? 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

                // Pasta
                new Product { Name = "Salmoni", Price = 490m, Unit = "plate", SKU = "PAS-001", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Arabiata", Price = 295m, Unit = "plate", SKU = "PAS-002", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Gambritti", Price = 490m, Unit = "plate", SKU = "PAS-003", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Allio Olio", Price = 275m, Unit = "plate", SKU = "PAS-004", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Pesto", Price = 390m, Unit = "plate", SKU = "PAS-005", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Frutti", Price = 480m, Unit = "plate", SKU = "PAS-006", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Gnocchi", Price = 325m, Unit = "plate", SKU = "PAS-007", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Pepproni", Price = 360m, Unit = "plate", SKU = "PAS-008", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Quatro", Price = 395m, Unit = "plate", SKU = "PAS-009", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Tartufu", Price = 495m, Unit = "plate", SKU = "PAS-010", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Ravioli", Price = 285m, Unit = "plate", SKU = "PAS-011", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Flitto", Price = 495m, Unit = "plate", SKU = "PAS-012", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Tachhino", Price = 460m, Unit = "plate", SKU = "PAS-013", CategoryId = pastaCategory?.Id ?? 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

                // Calzone
                new Product { Name = "Riccotta", Price = 310m, Unit = "piece", SKU = "CAL-001", CategoryId = calzoneCategory?.Id ?? 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Farcito", Price = 335m, Unit = "piece", SKU = "CAL-002", CategoryId = calzoneCategory?.Id ?? 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Lecce", Price = 300m, Unit = "piece", SKU = "CAL-003", CategoryId = calzoneCategory?.Id ?? 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

                // Dolci (Desserts)
                new Product { Name = "Tramisu", Price = 220m, Unit = "piece", SKU = "DOL-001", CategoryId = dolciCategory?.Id ?? 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Panna Cotta", Price = 210m, Unit = "piece", SKU = "DOL-002", CategoryId = dolciCategory?.Id ?? 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Nutella", Price = 325m, Unit = "piece", SKU = "DOL-003", CategoryId = dolciCategory?.Id ?? 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Lotus", Price = 335m, Unit = "piece", SKU = "DOL-004", CategoryId = dolciCategory?.Id ?? 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Crème burle", Price = 415m, Unit = "piece", SKU = "DOL-005", CategoryId = dolciCategory?.Id ?? 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Mela Alla Cannella", Price = 360m, Unit = "piece", SKU = "DOL-006", CategoryId = dolciCategory?.Id ?? 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

                // Salads
                new Product { Name = "Salmon Salad", Price = 320m, Unit = "plate", SKU = "SAL-001", CategoryId = saladsCategory?.Id ?? 5, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Tunu salad", Price = 290m, Unit = "plate", SKU = "SAL-002", CategoryId = saladsCategory?.Id ?? 5, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Funghi", Price = 245m, Unit = "plate", SKU = "SAL-003", CategoryId = saladsCategory?.Id ?? 5, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },

                // Antipasti (Appetizers)
                new Product { Name = "Crocette", Price = 220m, Unit = "plate", SKU = "ANT-001", CategoryId = antipastiCategory?.Id ?? 6, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Parmijana", Price = 210m, Unit = "plate", SKU = "ANT-002", CategoryId = antipastiCategory?.Id ?? 6, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Mainara Bruskitta", Price = 165m, Unit = "piece", SKU = "ANT-003", CategoryId = antipastiCategory?.Id ?? 6, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Buffala Fretti", Price = 220m, Unit = "plate", SKU = "ANT-004", CategoryId = antipastiCategory?.Id ?? 6, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new Product { Name = "Fries", Price = 175m, Unit = "plate", SKU = "ANT-005", CategoryId = antipastiCategory?.Id ?? 6, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };

            context.Products.AddRange(products);
            await context.SaveChangesAsync();
        }

        private static async Task CreateProductInventoriesAsync(ApplicationDbContext context)
        {
            // Skip inventory creation - inventory not used in simplified system
            // This method is kept for compatibility but does nothing
            await Task.CompletedTask;
        }
    }
}