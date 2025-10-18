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
                    Name = "Women's Perfumes",
                    Description = "Elegant and sophisticated women's fragrances",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Men's Fragrances",
                    Description = "Bold and masculine men's colognes and fragrances",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Unisex Scents",
                    Description = "Versatile fragrances suitable for both men and women",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Luxury Perfumes",
                    Description = "Premium and exclusive high-end fragrances",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Category
                {
                    Name = "Body Sprays",
                    Description = "Light and refreshing body sprays and mists",
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

            var womensCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Women's Perfumes");
            var mensCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Men's Fragrances");
            var unisexCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Unisex Scents");
            var luxuryCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Luxury Perfumes");
            var bodySprayCategory = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Body Sprays");

            var products = new List<Product>
            {
                // Women's Perfumes
                new Product
                {
                    Name = "Chanel No. 5",
                    Description = "Classic women's perfume with floral notes of rose, jasmine, and lily of the valley",
                    Price = 8999.00m,
                    Unit = "bottle",
                    SKU = "CHN-001",
                    Brand = "Chanel",
                    ImageUrl = "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
                    CategoryId = womensCategory?.Id ?? 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Yves Saint Laurent Libre",
                    Description = "Modern women's perfume with lavender and orange blossom",
                    Price = 78.50m,
                    Unit = "bottle",
                    SKU = "YSL-002",
                    Brand = "YSL",
                    CategoryId = womensCategory?.Id ?? 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Marc Jacobs Daisy",
                    Description = "Light and fresh women's perfume with violet leaves and wild strawberry",
                    Price = 72.00m,
                    Unit = "bottle",
                    SKU = "MJ-003",
                    Brand = "Marc Jacobs",
                    CategoryId = womensCategory?.Id ?? 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Lancôme La Vie Est Belle",
                    Description = "Sweet women's perfume with iris and praline notes",
                    Price = 82.00m,
                    Unit = "bottle",
                    SKU = "LAN-004",
                    Brand = "Lancôme",
                    CategoryId = womensCategory?.Id ?? 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Dolce & Gabbana Light Blue",
                    Description = "Fresh women's perfume with Sicilian lemon and jasmine",
                    Price = 88.00m,
                    Unit = "bottle",
                    SKU = "DG-005",
                    Brand = "Dolce & Gabbana",
                    CategoryId = womensCategory?.Id ?? 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Men's Fragrances
                new Product
                {
                    Name = "Dior Sauvage",
                    Description = "Fresh men's fragrance with bergamot, pepper, and ambroxan",
                    Price = 9500.00m,
                    Unit = "bottle",
                    SKU = "DIR-006",
                    Brand = "Dior",
                    ImageUrl = "https://images.unsplash.com/photo-1594736797933-d0c29d4a8b5a?w=400&h=400&fit=crop",
                    CategoryId = mensCategory?.Id ?? 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Versace Eros",
                    Description = "Seductive men's fragrance with mint, green apple, and vanilla",
                    Price = 65.00m,
                    Unit = "bottle",
                    SKU = "VER-007",
                    Brand = "Versace",
                    CategoryId = mensCategory?.Id ?? 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Giorgio Armani Acqua di Gio",
                    Description = "Fresh aquatic men's fragrance with marine and citrus notes",
                    Price = 85.00m,
                    Unit = "bottle",
                    SKU = "GA-008",
                    Brand = "Giorgio Armani",
                    CategoryId = mensCategory?.Id ?? 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Hugo Boss Bottled",
                    Description = "Sophisticated men's fragrance with apple, cinnamon, and sandalwood",
                    Price = 68.00m,
                    Unit = "bottle",
                    SKU = "HB-009",
                    Brand = "Hugo Boss",
                    CategoryId = mensCategory?.Id ?? 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Jean Paul Gaultier Le Male",
                    Description = "Provocative men's fragrance with lavender, vanilla, and tonka bean",
                    Price = 75.00m,
                    Unit = "bottle",
                    SKU = "JPG-010",
                    Brand = "Jean Paul Gaultier",
                    CategoryId = mensCategory?.Id ?? 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Unisex Scents
                new Product
                {
                    Name = "Tom Ford Black Orchid",
                    Description = "Luxury unisex fragrance with dark floral notes and chocolate",
                    Price = 12000.00m,
                    Unit = "bottle",
                    SKU = "TF-011",
                    Brand = "Tom Ford",
                    ImageUrl = "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=400&h=400&fit=crop",
                    CategoryId = unisexCategory?.Id ?? 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Calvin Klein CK One",
                    Description = "Iconic unisex fragrance with citrus, green notes, and musk",
                    Price = 45.00m,
                    Unit = "bottle",
                    SKU = "CK-012",
                    Brand = "Calvin Klein",
                    CategoryId = unisexCategory?.Id ?? 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Luxury Perfumes
                new Product
                {
                    Name = "Viktor & Rolf Flowerbomb",
                    Description = "Explosive women's perfume with jasmine, rose, and orchid",
                    Price = 95.00m,
                    Unit = "bottle",
                    SKU = "VR-013",
                    Brand = "Viktor & Rolf",
                    CategoryId = luxuryCategory?.Id ?? 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Paco Rabanne 1 Million",
                    Description = "Luxury men's fragrance with grapefruit, mint, and rose",
                    Price = 92.00m,
                    Unit = "bottle",
                    SKU = "PR-014",
                    Brand = "Paco Rabanne",
                    CategoryId = luxuryCategory?.Id ?? 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Name = "Burberry Brit",
                    Description = "Classic British men's fragrance with bergamot, ginger, and cedar",
                    Price = 58.00m,
                    Unit = "bottle",
                    SKU = "BB-015",
                    Brand = "Burberry",
                    CategoryId = luxuryCategory?.Id ?? 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Products.AddRange(products);
            await context.SaveChangesAsync();
        }

        private static async Task CreateProductInventoriesAsync(ApplicationDbContext context)
        {
            // Check if product inventories already exist
            if (await context.ProductInventories.AnyAsync())
            {
                return; // Skip seeding if inventories already exist
            }

            var products = await context.Products.ToListAsync();
            var stores = await context.Warehouses.Where(w => w.IsActive).ToListAsync();

            var inventories = new List<ProductInventory>();

            foreach (var store in stores)
            {
                foreach (var product in products)
                {
                    // Create inventory for each perfume in each store
                    var random = new Random();
                    var storeQuantity = random.Next(15, 35); // Store inventory: 15-35 bottles
                    var posQuantity = random.Next(3, 12);    // POS inventory: 3-12 bottles
                    
                    var inventory = new ProductInventory
                    {
                        ProductId = product.Id,
                        WarehouseId = store.Id,
                        Quantity = storeQuantity,
                        POSQuantity = posQuantity,
                        Unit = product.Unit,
                        MinimumStockLevel = 2,  // Minimum 2 bottles before requesting more
                        MaximumStockLevel = 50, // Maximum 50 bottles storage capacity
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    inventories.Add(inventory);
                }
            }

            context.ProductInventories.AddRange(inventories);
            await context.SaveChangesAsync();
        }
    }
}