using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Api.Models;
using Api.Data;
using Api.Services;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CashierController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public CashierController(ApplicationDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        private async Task<bool> IsSuperAdmin()
        {
            var userId = GetCurrentUserId();
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.Name)
                .ToListAsync();
            
            return userRoles.Contains("SuperAdmin");
        }

        private async Task<bool> IsStoreManager(int? storeId = null)
        {
            var userId = GetCurrentUserId();
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.Name)
                .ToListAsync();
            
            if (!userRoles.Contains("StoreManager")) return false;
            
            if (storeId.HasValue)
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.AssignedStoreId == storeId.Value;
            }
            
            return true;
        }

        private async Task<bool> IsSalesStaff(int? storeId = null)
        {
            var userId = GetCurrentUserId();
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.Name)
                .ToListAsync();
            
            if (!userRoles.Contains("SalesStaff")) return false;
            
            if (storeId.HasValue)
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.AssignedStoreId == storeId.Value;
            }
            
            return true;
        }

        // GET: api/Cashier/{storeId}/products
        [HttpGet("{storeId}/products")]
        public async Task<ActionResult<IEnumerable<object>>> GetStoreProducts(int storeId)
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager(storeId);
            var isSalesStaff = await IsSalesStaff(storeId);

            // Check if user has access to this store's products
            if (!isSuperAdmin && !isStoreManager && !isSalesStaff)
            {
                return StatusCode(403, new { Message = "You don't have permission to access this store's products" });
            }

            var products = await _context.ProductInventories
                .Include(pi => pi.Product)
                .Where(pi => pi.WarehouseId == storeId && pi.Quantity > 0)
                .Select(pi => new
                {
                    pi.Id,
                    ProductId = pi.ProductId,
                    ProductName = pi.Product.Name,
                    ProductDescription = pi.Product.Description,
                    ProductPrice = pi.Product.Price,
                    QuantityInStock = pi.Quantity,
                    IsAvailable = pi.Quantity > 0,
                    CategoryName = pi.Product.Category != null ? pi.Product.Category.Name : "No Category"
                })
                .OrderBy(p => p.ProductName)
                .ToListAsync();

            return Ok(products);
        }

        // POST: api/Cashier/{storeId}/process-sale
        [HttpPost("{storeId}/process-sale")]
        public async Task<ActionResult<object>> ProcessSale(int storeId, [FromBody] ProcessSaleRequest request)
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager(storeId);
            var isSalesStaff = await IsSalesStaff(storeId);

            // Check if user has permission to process sales for this store
            if (!isSuperAdmin && !isStoreManager && !isSalesStaff)
            {
                return StatusCode(403, new { Message = "You don't have permission to process sales for this store" });
            }

            // Validate that all products are available in the store
            var productIds = request.Items.Select(i => i.ProductId).ToList();
            var availableProducts = await _context.ProductInventories
                .Where(pi => pi.WarehouseId == storeId && productIds.Contains(pi.ProductId))
                .Include(pi => pi.Product)
                .ToListAsync();

            var unavailableProducts = new List<string>();
            var saleItems = new List<SalesItemRequest>();

            foreach (var item in request.Items)
            {
                var inventory = availableProducts.FirstOrDefault(ap => ap.ProductId == item.ProductId);
                if (inventory == null)
                {
                    unavailableProducts.Add($"Product ID {item.ProductId} not found in store");
                    continue;
                }

                if (inventory.Quantity < item.Quantity)
                {
                    unavailableProducts.Add($"{inventory.Product.Name}: Only {inventory.Quantity} available, requested {item.Quantity}");
                    continue;
                }

                saleItems.Add(new SalesItemRequest
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = inventory.Product.Price,
                    TotalPrice = inventory.Product.Price * item.Quantity
                });
            }

            if (unavailableProducts.Any())
            {
                return BadRequest(new { 
                    Message = "Some products are not available", 
                    UnavailableProducts = unavailableProducts 
                });
            }

            // Create the sales order
            var salesOrder = new SalesOrder
            {
                OrderNumber = $"SO-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{storeId}",
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                TotalAmount = saleItems.Sum(si => si.TotalPrice),
                OrderDate = DateTime.UtcNow,
                Status = "Confirmed",
                PaymentStatus = request.PaymentMethod == "Cash" ? "Paid" : "Pending",
                Notes = request.Notes,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesOrders.Add(salesOrder);
            await _context.SaveChangesAsync();

            // Create sales items and update inventory
            foreach (var item in saleItems)
            {
                var salesItem = new SalesItem
                {
                    SalesOrderId = salesOrder.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice
                };

                _context.SalesItems.Add(salesItem);

                // Update inventory
                var inventory = availableProducts.First(ap => ap.ProductId == item.ProductId);
                inventory.Quantity -= item.Quantity;
                inventory.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await _auditService.LogAsync("SalesOrder", salesOrder.Id.ToString(), "Created", 
                null, $"Sales order processed for store {storeId}, Total: {salesOrder.TotalAmount}", userId);

            return Ok(new
            {
                SalesOrderId = salesOrder.Id,
                OrderNumber = salesOrder.OrderNumber,
                TotalAmount = salesOrder.TotalAmount,
                OrderDate = salesOrder.OrderDate,
                Items = saleItems,
                Message = "Sale processed successfully"
            });
        }

        // GET: api/Cashier/{storeId}/sales-today
        [HttpGet("{storeId}/sales-today")]
        public async Task<ActionResult<object>> GetTodaySales(int storeId)
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager(storeId);
            var isSalesStaff = await IsSalesStaff(storeId);

            // Check if user has access to this store's sales data
            if (!isSuperAdmin && !isStoreManager && !isSalesStaff)
            {
                return StatusCode(403, new { Message = "You don't have permission to access this store's sales data" });
            }

            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            // Filter sales by store through sales items
            var todaySales = await _context.SalesOrders
                .Include(s => s.SalesItems)
                .ThenInclude(si => si.Product)
                .Where(s => s.OrderDate >= today && s.OrderDate < tomorrow && s.SalesItems.Any(si => si.WarehouseId == storeId))
                .Select(s => new
                {
                    s.Id,
                    s.OrderNumber,
                    s.TotalAmount,
                    s.OrderDate,
                    s.PaymentStatus,
                    s.CustomerName,
                    s.CustomerPhone,
                    s.Notes,
                    ItemsCount = s.SalesItems.Count,
                    CashierName = _context.Users
                        .Where(u => u.Id == s.CreatedByUserId)
                        .Select(u => u.FullName)
                        .FirstOrDefault()
                })
                .OrderByDescending(s => s.OrderDate)
                .ToListAsync();

            var summary = new
            {
                TotalSales = todaySales.Sum(s => s.TotalAmount),
                TotalTransactions = todaySales.Count,
                AverageTransactionAmount = todaySales.Any() ? todaySales.Average(s => s.TotalAmount) : 0,
                Sales = todaySales
            };

            return Ok(summary);
        }

        // GET: api/Cashier/{storeId}/sales-history
        [HttpGet("{storeId}/sales-history")]
        public async Task<ActionResult<IEnumerable<object>>> GetSalesHistory(int storeId, [FromQuery] int days = 7)
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager(storeId);
            var isSalesStaff = await IsSalesStaff(storeId);

            // Check if user has access to this store's sales data
            if (!isSuperAdmin && !isStoreManager && !isSalesStaff)
            {
                return StatusCode(403, new { Message = "You don't have permission to access this store's sales data" });
            }

            var startDate = DateTime.UtcNow.AddDays(-days);

            // Filter sales by store through sales items
            var salesHistory = await _context.SalesOrders
                .Include(s => s.SalesItems)
                .ThenInclude(si => si.Product)
                .Where(s => s.OrderDate >= startDate && s.SalesItems.Any(si => si.WarehouseId == storeId))
                .Select(s => new
                {
                    s.Id,
                    s.OrderNumber,
                    s.TotalAmount,
                    s.OrderDate,
                    s.PaymentStatus,
                    s.CustomerName,
                    s.CustomerPhone,
                    s.Notes,
                    Items = s.SalesItems.Select(si => new
                    {
                        si.ProductId,
                        ProductName = si.Product.Name,
                        si.Quantity,
                        si.UnitPrice,
                        si.TotalPrice
                    }).ToList(),
                    CashierName = _context.Users
                        .Where(u => u.Id == s.CreatedByUserId)
                        .Select(u => u.FullName)
                        .FirstOrDefault()
                })
                .OrderByDescending(s => s.OrderDate)
                .ToListAsync();

            return Ok(salesHistory);
        }
    }

    public class ProcessSaleRequest
    {
        public List<SaleItemRequest> Items { get; set; } = new List<SaleItemRequest>();
        public string PaymentMethod { get; set; } = "Cash";
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? Notes { get; set; }
    }

    public class SaleItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class SalesItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
