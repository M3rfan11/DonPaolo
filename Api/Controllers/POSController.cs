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
            
            // Get store ID for filtering
            int? storeId = null;
            var currentUser = await _context.Users.FindAsync(currentUserId);
            
            if (currentUserRoles.Contains("Cashier"))
            {
                if (currentUser?.AssignedStoreId == null)
                {
                    _logger.LogWarning("Cashier user {UserId} is not assigned to any store, returning empty product list", currentUserId);
                    return Ok(new List<POSProductResponse>());
                }
                storeId = currentUser.AssignedStoreId;
            }
            else if (currentUserRoles.Contains("SuperAdmin"))
            {
                // SuperAdmin uses their assigned store (same as cashier)
                if (currentUser?.AssignedStoreId != null)
                {
                    storeId = currentUser.AssignedStoreId;
                }
            }
            else
            {
                return StatusCode(403, new { Message = "You don't have permission to access POS products" });
            }

            // Get all active products (no inventory check - inventory not used)
            var productsQuery = _context.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive);

            var products = await productsQuery
                .Select(p => new POSProductResponse
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Price = p.Price,
                    AvailableQuantity = 999, // No inventory tracking - show as available
                    Unit = p.Unit ?? "unit",
                    CategoryName = p.Category.Name,
                    SKU = p.SKU ?? "",
                    IsAssemblyOffer = false
                })
                .OrderBy(p => p.ProductName)
                .ToListAsync();

            // No assembly offers - simplified system
            return Ok(products);
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

                // Create sales order items (no inventory - simplified system)
                var salesOrderItems = new List<SalesItem>();
                foreach (var item in request.Items)
                {
                    // Verify product exists and is active
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null || !product.IsActive)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { Message = $"Product {item.ProductId} not found or inactive" });
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

    /// <summary>
    /// Open cash drawer (sends ESC/POS command)
    /// </summary>
    [HttpPost("open-drawer")]
    [Authorize(Roles = "SuperAdmin,Cashier")]
    public async Task<ActionResult> OpenCashDrawer()
    {
        try
        {
            // ESC/POS command to open cash drawer
            // ESC p 0 25 250 means:
            // ESC p - Print and feed
            // 0 - Drawer pin 2
            // 25 - Pulse time (25 * 2ms = 50ms)
            // 250 - Pulse time (250 * 2ms = 500ms)
            var escPosCommand = new byte[] { 0x1B, 0x70, 0x00, 0x19, 0xFA };

            // In a real implementation, you would send this to a printer
            // For now, we'll log it and return success
            // You can integrate with a printer service like:
            // - Windows: Use RawPrinterHelper
            // - Linux: Use lp or direct USB/Serial communication
            // - Network printer: Send raw bytes via TCP/IP
            
            _logger.LogInformation("Cash drawer open command sent");

            // TODO: Implement actual printer communication
            // Example for Windows:
            // RawPrinterHelper.SendBytesToPrinter(printerName, escPosCommand);
            
            // Example for network printer:
            // using var client = new TcpClient(printerIp, printerPort);
            // using var stream = client.GetStream();
            // await stream.WriteAsync(escPosCommand, 0, escPosCommand.Length);

            return Ok(new { Message = "Cash drawer opened successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening cash drawer");
            return StatusCode(500, new { Message = "An error occurred while opening the cash drawer" });
        }
    }
}
