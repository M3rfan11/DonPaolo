using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.DTOs;
using Api.Models;
using Api.Services;
using System.Security.Claims;
using System.Text.Json;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class POSController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IRevenueTrackingService _revenueTrackingService;
    private readonly ILogger<POSController> _logger;

    public POSController(ApplicationDbContext context, IAuditService auditService, IRevenueTrackingService revenueTrackingService, ILogger<POSController> logger)
    {
        _context = context;
        _auditService = auditService;
        _revenueTrackingService = revenueTrackingService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
        return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
    }

    private async Task<List<string>> GetCurrentUserRoles(int userId)
    {
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.Name)
            .ToListAsync();
    }

    /// <summary>
    /// Get available products for POS (store-scoped) including assembly offers
    /// </summary>
    [HttpGet("products")]
    [Authorize(Roles = "SuperAdmin,Cashier")]
    public async Task<ActionResult<IEnumerable<POSProductResponse>>> GetPOSProducts()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRoles = await GetCurrentUserRoles(currentUserId);
            
            IQueryable<ProductInventory> inventoryQuery = _context.ProductInventories
                .Include(pi => pi.Product)
                .Include(pi => pi.Warehouse)
                .Where(pi => pi.POSQuantity > 0); // Only products with POS stock

            int? storeId = null;

            // Apply store-scoped filtering
            if (currentUserRoles.Contains("SuperAdmin"))
            {
                // SuperAdmin can see all products
            }
            else if (currentUserRoles.Contains("Cashier"))
            {
                // Cashier can only see their store's products
                var currentUser = await _context.Users.FindAsync(currentUserId);
                if (currentUser?.AssignedStoreId == null)
                {
                    _logger.LogWarning("Cashier user {UserId} is not assigned to any store, returning empty product list", currentUserId);
                    return Ok(new List<POSProductResponse>());
                }
                
                storeId = currentUser.AssignedStoreId;
                inventoryQuery = inventoryQuery.Where(pi => pi.WarehouseId == storeId);
            }
            else
            {
                return StatusCode(403, new { Message = "You don't have permission to access POS products" });
            }

            // Get regular products
            var products = await inventoryQuery
                .Select(pi => new POSProductResponse
                {
                    ProductId = pi.ProductId,
                    ProductName = pi.Product.Name,
                    Price = pi.Product.Price,
                    AvailableQuantity = pi.POSQuantity,
                    Unit = pi.Unit,
                    CategoryName = pi.Product.Category.Name,
                    SKU = pi.Product.SKU,
                    IsAssemblyOffer = false
                })
                .OrderBy(p => p.ProductName)
                .ToListAsync();

            // Get assembly offers for the same store
            IQueryable<ProductAssembly> assemblyQuery = _context.ProductAssemblies
                .Include(pa => pa.BillOfMaterials)
                .Where(pa => pa.IsActive && pa.Status == "Completed");

            if (storeId.HasValue)
            {
                assemblyQuery = assemblyQuery.Where(pa => pa.StoreId == storeId);
            }

            var assemblyOffers = await assemblyQuery
                .Select(pa => new POSProductResponse
                {
                    ProductId = pa.Id + 10000, // Use high ID to avoid conflicts with regular products
                    ProductName = pa.Name,
                    Price = pa.SalePrice ?? 0,
                    AvailableQuantity = 1, // Assembly offers are always quantity 1
                    Unit = pa.Unit ?? "offer",
                    CategoryName = "Assembly Offers",
                    SKU = $"ASSEMBLY-{pa.Id}",
                    IsAssemblyOffer = true,
                    AssemblyId = pa.Id
                })
                .OrderBy(p => p.ProductName)
                .ToListAsync();

            // Combine regular products and assembly offers
            var allProducts = products.Concat(assemblyOffers).OrderBy(p => p.ProductName).ToList();

            return Ok(allProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving POS products");
            return StatusCode(500, new { Message = "An error occurred while retrieving products" });
        }
    }

    /// <summary>
    /// Process a POS sale transaction
    /// </summary>
    [HttpPost("sale")]
    [Authorize(Roles = "SuperAdmin,Cashier")]
    public async Task<ActionResult<POSSaleResponse>> ProcessSale([FromBody] POSSaleRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRoles = await GetCurrentUserRoles(currentUserId);
            
            // Get current user's store
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser?.AssignedStoreId == null)
            {
                return StatusCode(403, new { Message = "You are not assigned to any store" });
            }

            var storeId = currentUser.AssignedStoreId.Value;

            // Validate request
            if (request.Items == null || !request.Items.Any())
            {
                return BadRequest(new { Message = "Sale must contain at least one item" });
            }

            // Generate sale number
            var saleNumber = await GenerateSaleNumber();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Handle customer lookup/registration
                Customer? customer = null;
                if (!string.IsNullOrEmpty(request.CustomerPhone))
                {
                    // Try to find existing customer in Customers table
                    customer = await _context.Customers
                        .FirstOrDefaultAsync(c => c.PhoneNumber == request.CustomerPhone && c.IsActive);

                    // If not found in Customers table, check if they exist in sales orders
                    if (customer == null)
                    {
                        var existingSale = await _context.SalesOrders
                            .Where(s => s.CustomerPhone == request.CustomerPhone)
                            .OrderByDescending(s => s.CreatedAt)
                            .FirstOrDefaultAsync();

                        if (existingSale != null)
                        {
                            // Customer exists in sales orders, register them in Customers table
                            customer = new Customer
                            {
                                FullName = existingSale.CustomerName ?? request.CustomerName ?? "Unknown Customer",
                                PhoneNumber = request.CustomerPhone,
                                Email = existingSale.CustomerEmail ?? request.CustomerEmail,
                                Address = existingSale.CustomerAddress ?? request.CustomerAddress,
                                CreatedAt = existingSale.CreatedAt,
                                IsActive = true
                            };

                            _context.Customers.Add(customer);
                            await _context.SaveChangesAsync();

                            await _auditService.LogAsync("Customer", customer.Id.ToString(), "Created", 
                                null, System.Text.Json.JsonSerializer.Serialize(customer), currentUserId);
                        }
                        else if (!string.IsNullOrEmpty(request.CustomerName))
                        {
                            // Completely new customer, register them
                            customer = new Customer
                            {
                                FullName = request.CustomerName,
                                PhoneNumber = request.CustomerPhone,
                                Email = request.CustomerEmail,
                                CreatedAt = DateTime.UtcNow,
                                IsActive = true
                            };

                            _context.Customers.Add(customer);
                            await _context.SaveChangesAsync();

                            await _auditService.LogAsync("Customer", customer.Id.ToString(), "Created", 
                                null, System.Text.Json.JsonSerializer.Serialize(customer), currentUserId);
                        }
                    }
                }

                // Create sales order
                var salesOrder = new SalesOrder
                {
                    OrderNumber = saleNumber,
                    CustomerName = request.CustomerName ?? "Walk-in Customer",
                    CustomerEmail = request.CustomerEmail,
                    CustomerPhone = request.CustomerPhone,
                    TotalAmount = request.FinalAmount,
                    Status = "Completed",
                    PaymentStatus = "Paid",
                    Notes = request.Notes,
                    CreatedByUserId = currentUserId,
                    ConfirmedByUserId = currentUserId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    OrderDate = DateTime.UtcNow
                };

                _context.SalesOrders.Add(salesOrder);
                await _context.SaveChangesAsync();

                // Create sales order items and update inventory
                var salesOrderItems = new List<SalesItem>();
                foreach (var item in request.Items)
                {
                    // Check if this is an assembly offer (ProductId > 10000 indicates assembly offer)
                    if (item.ProductId > 10000)
                    {
                        // This is an assembly offer - get the assembly ID
                        var assemblyId = item.ProductId - 10000;
                        var assembly = await _context.ProductAssemblies
                            .Include(pa => pa.BillOfMaterials)
                            .FirstOrDefaultAsync(pa => pa.Id == assemblyId);

                        if (assembly == null)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { Message = $"Assembly offer {assemblyId} not found" });
                        }

                        // Check if assembly is available (has sufficient materials)
                        foreach (var bom in assembly.BillOfMaterials)
                        {
                            var inventory = await _context.ProductInventories
                                .FirstOrDefaultAsync(pi => pi.ProductId == bom.RawProductId && pi.WarehouseId == storeId);

                            // CRITICAL FIX: Calculate total required quantity (per unit × assembly quantity × sale quantity)
                            var totalRequiredQuantity = bom.RequiredQuantity * assembly.Quantity * item.Quantity;

                            if (inventory == null || inventory.Quantity < totalRequiredQuantity)
                            {
                                // Get product name for error message
                                var product = await _context.Products.FindAsync(bom.RawProductId);
                                var productName = product?.Name ?? $"Product {bom.RawProductId}";
                                
                                await transaction.RollbackAsync();
                                return BadRequest(new { Message = $"Insufficient materials for assembly offer '{assembly.Name}'. Product '{productName}' not available. Required: {totalRequiredQuantity}, Available: {inventory?.Quantity ?? 0}" });
                            }
                        }

                        // Create sales order item for assembly offer
                        var assemblySalesItem = new SalesItem
                        {
                            SalesOrderId = salesOrder.Id,
                            ProductId = item.ProductId,
                            WarehouseId = storeId,
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice,
                            TotalPrice = item.TotalPrice,
                            CreatedAt = DateTime.UtcNow
                        };

                        salesOrderItems.Add(assemblySalesItem);

                        // Deduct materials from inventory
                        foreach (var bom in assembly.BillOfMaterials)
                        {
                            var inventory = await _context.ProductInventories
                                .FirstOrDefaultAsync(pi => pi.ProductId == bom.RawProductId && pi.WarehouseId == storeId);

                            if (inventory != null)
                            {
                                // CRITICAL FIX: Calculate total required quantity (per unit × assembly quantity × sale quantity)
                                var totalRequiredQuantity = bom.RequiredQuantity * assembly.Quantity * item.Quantity;
                                inventory.Quantity -= totalRequiredQuantity;
                                inventory.UpdatedAt = DateTime.UtcNow;
                            }
                        }

                        // Update sales order notes to indicate assembly sale
                        salesOrder.Notes = string.IsNullOrEmpty(salesOrder.Notes) 
                            ? $"Assembly Sale: {assembly.Name}" 
                            : $"{salesOrder.Notes}; Assembly Sale: {assembly.Name}";
                    }
                    else
                    {
                        // Regular product processing
                        var inventory = await _context.ProductInventories
                            .FirstOrDefaultAsync(pi => pi.ProductId == item.ProductId && pi.WarehouseId == storeId);

                        if (inventory == null)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { Message = $"Product {item.ProductId} not found in store inventory" });
                        }

                        if (inventory.POSQuantity < item.Quantity)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { Message = $"Insufficient POS stock for product {item.ProductName}. Available: {inventory.POSQuantity}" });
                        }

                        // Create sales order item
                        var salesOrderItem = new SalesItem
                        {
                            SalesOrderId = salesOrder.Id,
                            ProductId = item.ProductId,
                            WarehouseId = storeId,
                            Quantity = item.Quantity,
                            UnitPrice = item.UnitPrice,
                            TotalPrice = item.TotalPrice,
                            CreatedAt = DateTime.UtcNow
                        };

                        salesOrderItems.Add(salesOrderItem);

                        // Update POS inventory
                        inventory.POSQuantity -= item.Quantity;
                        inventory.UpdatedAt = DateTime.UtcNow;
                    }
                }

                _context.SalesItems.AddRange(salesOrderItems);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Audit log
                var auditData = new {
                    Id = salesOrder.Id,
                    OrderNumber = salesOrder.OrderNumber,
                    CustomerName = salesOrder.CustomerName,
                    TotalAmount = salesOrder.TotalAmount,
                    Status = salesOrder.Status,
                    PaymentStatus = salesOrder.PaymentStatus,
                    CreatedByUserId = salesOrder.CreatedByUserId
                };
                await _auditService.LogAsync("SalesOrder", salesOrder.Id.ToString(), "CREATE", 
                    null, JsonSerializer.Serialize(auditData), currentUserId);

                // Update revenue tracking
                await _revenueTrackingService.UpdateRevenueAfterSaleAsync(salesOrder.Id, salesOrder.TotalAmount);

                // Create response
                var response = new POSSaleResponse
                {
                    SaleNumber = salesOrder.OrderNumber,
                    SaleId = salesOrder.Id,
                    CustomerName = salesOrder.CustomerName,
                    TotalAmount = request.TotalAmount,
                    DiscountAmount = request.DiscountAmount ?? 0,
                    TaxAmount = request.TaxAmount ?? 0,
                    FinalAmount = request.FinalAmount,
                    PaymentMethod = request.PaymentMethod,
                    Items = salesOrderItems.Select(item => new POSItemResponse
                    {
                        ProductId = item.ProductId,
                        ProductName = _context.Products.Find(item.ProductId)?.Name ?? "Unknown Product",
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalPrice = item.TotalPrice
                    }).ToList(),
                    SaleDate = salesOrder.CreatedAt,
                    CashierName = currentUser.FullName,
                    StoreName = _context.Warehouses.Find(storeId)?.Name ?? "Unknown Store"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                try
                {
                    await transaction.RollbackAsync();
                }
                catch (Exception rollbackEx)
                {
                    _logger.LogError(rollbackEx, "Error during transaction rollback");
                }
                throw ex;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing POS sale");
            return StatusCode(500, new { Message = "An error occurred while processing the sale" });
        }
    }

    /// <summary>
    /// Get sales history for the current store
    /// </summary>
    [HttpGet("sales-history")]
    [Authorize(Roles = "SuperAdmin,StoreManager,Cashier")]
    public async Task<ActionResult<IEnumerable<POSSaleHistoryResponse>>> GetSalesHistory()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRoles = await GetCurrentUserRoles(currentUserId);
            
            IQueryable<SalesOrder> salesQuery = _context.SalesOrders
                .Include(so => so.CreatedByUser)
                .Include(so => so.SalesItems)
                .ThenInclude(soi => soi.Product);

            // Apply store-scoped filtering
            if (currentUserRoles.Contains("SuperAdmin"))
            {
                // SuperAdmin can see all sales
            }
            else if (currentUserRoles.Contains("StoreManager") || currentUserRoles.Contains("Cashier"))
            {
                // Store Managers and Cashiers can only see their store's sales
                var currentUser = await _context.Users.FindAsync(currentUserId);
                if (currentUser?.AssignedStoreId == null)
                {
                    _logger.LogWarning("User {UserId} is not assigned to any store, returning empty sales history", currentUserId);
                    return Ok(new List<POSSaleHistoryResponse>());
                }
                
                // Filter sales by store through sales items
                salesQuery = salesQuery.Where(so => so.SalesItems.Any(si => si.WarehouseId == currentUser.AssignedStoreId));
            }
            else
            {
                return StatusCode(403, new { Message = "You don't have permission to view sales history" });
            }

            var sales = await salesQuery
                .OrderByDescending(so => so.CreatedAt)
                .Take(50) // Last 50 sales
                .Select(so => new POSSaleHistoryResponse
                {
                    SaleId = so.Id,
                    SaleNumber = so.OrderNumber,
                    CustomerName = so.CustomerName,
                    TotalAmount = so.TotalAmount,
                    FinalAmount = so.TotalAmount,
                    PaymentMethod = "Cash", // Default since PaymentMethod doesn't exist in model
                    SaleDate = so.CreatedAt,
                    CashierName = so.CreatedByUser.FullName,
                    ItemCount = so.SalesItems.Count
                })
                .ToListAsync();

            return Ok(sales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales history");
            return StatusCode(500, new { Message = "An error occurred while retrieving sales history" });
        }
    }

    private async Task<string> GenerateSaleNumber()
    {
        var today = DateTime.UtcNow.Date;
        var prefix = $"POS{today:yyyyMMdd}";
        var count = _context.SalesOrders.Count(so => so.OrderNumber.StartsWith(prefix)) + 1;
        return $"{prefix}{count:D4}";
    }

    private string GetClientIP()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }

    private string GetUserAgent()
    {
        return HttpContext.Request.Headers["User-Agent"].ToString();
    }
}
