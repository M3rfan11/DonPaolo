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
public class CustomerOrderController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ILogger<CustomerOrderController> _logger;

    public CustomerOrderController(ApplicationDbContext context, IAuditService auditService, ILogger<CustomerOrderController> logger)
    {
        _context = context;
        _auditService = auditService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
        return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
    }

    private async Task<bool> IsCustomer()
    {
        var userId = GetCurrentUserId();
        var userRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Name)
            .ToListAsync();
        return userRoles.Contains("Customer") || userRoles.Contains("StoreManager");
    }

    private string GenerateOrderNumber()
    {
        var today = DateTime.UtcNow;
        var prefix = $"CUST{today:yyyyMMdd}";
        var count = _context.SalesOrders.Count(so => so.OrderNumber.StartsWith(prefix)) + 1;
        return $"{prefix}{count:D4}";
    }

    #region Shopping Cart Endpoints

    /// <summary>
    /// Get customer's shopping cart
    /// </summary>
    [HttpGet("cart")]
    public async Task<ActionResult<CartSummaryResponse>> GetCart()
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var onlineWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");
            if (onlineWarehouse == null)
            {
                return NotFound("Online warehouse not found");
            }

            var cartItems = await _context.ShoppingCarts
                .Include(sc => sc.Product)
                .ThenInclude(p => p.Category)
                .Include(sc => sc.Product)
                .ThenInclude(p => p.ProductInventories.Where(pi => pi.WarehouseId == onlineWarehouse.Id))
                .Where(sc => sc.UserId == userId)
                .Select(sc => new CartItemResponse
                {
                    Id = sc.Id,
                    ProductId = sc.ProductId,
                    ProductName = sc.Product.Name,
                    ProductSKU = sc.Product.SKU,
                    ProductDescription = sc.Product.Description,
                    Quantity = sc.Quantity,
                    UnitPrice = sc.UnitPrice,
                    TotalPrice = sc.Quantity * sc.UnitPrice,
                    Unit = sc.Unit,
                    CategoryName = sc.Product.Category.Name,
                    AvailableQuantity = sc.Product.ProductInventories
                        .Where(pi => pi.WarehouseId == onlineWarehouse.Id)
                        .Sum(pi => pi.Quantity),
                    CreatedAt = sc.CreatedAt,
                    UpdatedAt = sc.UpdatedAt
                })
                .ToListAsync();

            var subTotal = cartItems.Sum(item => item.TotalPrice);
            var tax = subTotal * 0.1m; // 10% tax
            var total = subTotal + tax;

            var response = new CartSummaryResponse
            {
                Items = cartItems,
                SubTotal = subTotal,
                Tax = tax,
                Total = total,
                ItemCount = cartItems.Count
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving shopping cart");
            return StatusCode(500, new { message = "An error occurred while retrieving the shopping cart" });
        }
    }

    /// <summary>
    /// Add item to shopping cart
    /// </summary>
    [HttpPost("cart/add")]
    public async Task<ActionResult<CartItemResponse>> AddToCart([FromBody] AddToCartRequest request)
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var onlineWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");
            if (onlineWarehouse == null)
            {
                return NotFound("Online warehouse not found");
            }

            // Check if product exists and is available
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductInventories.Where(pi => pi.WarehouseId == onlineWarehouse.Id))
                .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive);

            if (product == null)
            {
                return NotFound("Product not found or not available");
            }

            var availableQuantity = product.ProductInventories
                .Where(pi => pi.WarehouseId == onlineWarehouse.Id)
                .Sum(pi => pi.Quantity);

            if (availableQuantity < request.Quantity)
            {
                return BadRequest($"Insufficient stock. Available: {availableQuantity}");
            }

            // Check if item already exists in cart
            var existingCartItem = await _context.ShoppingCarts
                .FirstOrDefaultAsync(sc => sc.UserId == userId && sc.ProductId == request.ProductId);

            if (existingCartItem != null)
            {
                // Update quantity
                existingCartItem.Quantity += request.Quantity;
                existingCartItem.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Add new item
                var cartItem = new ShoppingCart
                {
                    UserId = userId,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    UnitPrice = product.Price,
                    Unit = product.Unit
                };
                _context.ShoppingCarts.Add(cartItem);
            }

            await _context.SaveChangesAsync();

            // Return updated cart item
            var cartItemResponse = await _context.ShoppingCarts
                .Include(sc => sc.Product)
                .ThenInclude(p => p.Category)
                .Where(sc => sc.UserId == userId && sc.ProductId == request.ProductId)
                .Select(sc => new CartItemResponse
                {
                    Id = sc.Id,
                    ProductId = sc.ProductId,
                    ProductName = sc.Product.Name,
                    ProductSKU = sc.Product.SKU,
                    ProductDescription = sc.Product.Description,
                    Quantity = sc.Quantity,
                    UnitPrice = sc.UnitPrice,
                    TotalPrice = sc.Quantity * sc.UnitPrice,
                    Unit = sc.Unit,
                    CategoryName = sc.Product.Category.Name,
                    AvailableQuantity = availableQuantity,
                    CreatedAt = sc.CreatedAt,
                    UpdatedAt = sc.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return Ok(cartItemResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding item to cart");
            return StatusCode(500, new { message = "An error occurred while adding item to cart" });
        }
    }

    /// <summary>
    /// Update cart item quantity
    /// </summary>
    [HttpPut("cart/{cartItemId}")]
    public async Task<ActionResult<CartItemResponse>> UpdateCartItem(int cartItemId, [FromBody] UpdateCartItemRequest request)
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var cartItem = await _context.ShoppingCarts
                .Include(sc => sc.Product)
                .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(sc => sc.Id == cartItemId && sc.UserId == userId);

            if (cartItem == null)
            {
                return NotFound("Cart item not found");
            }

            var onlineWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");
            if (onlineWarehouse == null)
            {
                return NotFound("Online warehouse not found");
            }

            var availableQuantity = await _context.ProductInventories
                .Where(pi => pi.ProductId == cartItem.ProductId && pi.WarehouseId == onlineWarehouse.Id)
                .SumAsync(pi => pi.Quantity);

            if (availableQuantity < request.Quantity)
            {
                return BadRequest($"Insufficient stock. Available: {availableQuantity}");
            }

            cartItem.Quantity = request.Quantity;
            cartItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new CartItemResponse
            {
                Id = cartItem.Id,
                ProductId = cartItem.ProductId,
                ProductName = cartItem.Product.Name,
                ProductSKU = cartItem.Product.SKU,
                ProductDescription = cartItem.Product.Description,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.UnitPrice,
                TotalPrice = cartItem.Quantity * cartItem.UnitPrice,
                Unit = cartItem.Unit,
                CategoryName = cartItem.Product.Category.Name,
                AvailableQuantity = availableQuantity,
                CreatedAt = cartItem.CreatedAt,
                UpdatedAt = cartItem.UpdatedAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cart item");
            return StatusCode(500, new { message = "An error occurred while updating cart item" });
        }
    }

    /// <summary>
    /// Remove item from cart
    /// </summary>
    [HttpDelete("cart/{cartItemId}")]
    public async Task<IActionResult> RemoveFromCart(int cartItemId)
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var cartItem = await _context.ShoppingCarts
                .FirstOrDefaultAsync(sc => sc.Id == cartItemId && sc.UserId == userId);

            if (cartItem == null)
            {
                return NotFound("Cart item not found");
            }

            _context.ShoppingCarts.Remove(cartItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Item removed from cart successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing item from cart");
            return StatusCode(500, new { message = "An error occurred while removing item from cart" });
        }
    }

    /// <summary>
    /// Clear entire cart
    /// </summary>
    [HttpDelete("cart/clear")]
    public async Task<IActionResult> ClearCart()
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var cartItems = await _context.ShoppingCarts
                .Where(sc => sc.UserId == userId)
                .ToListAsync();

            _context.ShoppingCarts.RemoveRange(cartItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cart cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart");
            return StatusCode(500, new { message = "An error occurred while clearing cart" });
        }
    }

    #endregion

    #region Customer Order Endpoints

    /// <summary>
    /// Create order from cart or direct items
    /// </summary>
    [HttpPost("order")]
    public async Task<ActionResult<CustomerOrderResponse>> CreateOrder([FromBody] CreateCustomerOrderRequest request)
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var onlineWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");
            if (onlineWarehouse == null)
            {
                return NotFound("Online warehouse not found");
            }

            List<CreateOnlineOrderItemRequest> orderItems;

            if (request.UseCartItems)
            {
                // Get items from cart
                var cartItems = await _context.ShoppingCarts
                    .Include(sc => sc.Product)
                    .Where(sc => sc.UserId == userId)
                    .ToListAsync();

                if (!cartItems.Any())
                {
                    return BadRequest("Cart is empty");
                }

                orderItems = cartItems.Select(sc => new CreateOnlineOrderItemRequest
                {
                    ProductId = sc.ProductId,
                    Quantity = sc.Quantity,
                    UnitPrice = sc.UnitPrice,
                    Unit = sc.Unit
                }).ToList();
            }
            else
            {
                if (request.Items == null || !request.Items.Any())
                {
                    return BadRequest("No items provided");
                }
                orderItems = request.Items;
            }

            // Validate inventory availability
            foreach (var item in orderItems)
            {
                var availableQuantity = await _context.ProductInventories
                    .Where(pi => pi.ProductId == item.ProductId && pi.WarehouseId == onlineWarehouse.Id)
                    .SumAsync(pi => pi.Quantity);

                if (availableQuantity < item.Quantity)
                {
                    return BadRequest($"Insufficient stock for product ID {item.ProductId}. Available: {availableQuantity}");
                }
            }

            // Create order
            var orderNumber = GenerateOrderNumber();
            var totalAmount = orderItems.Sum(item => item.Quantity * item.UnitPrice);

            var order = new SalesOrder
            {
                OrderNumber = orderNumber,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerPhone = request.CustomerPhone,
                CustomerAddress = request.CustomerAddress,
                OrderDate = DateTime.UtcNow,
                DeliveryDate = request.DeliveryDate,
                TotalAmount = totalAmount,
                Status = "Pending",
                PaymentStatus = "Pending",
                Notes = request.Notes,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.SalesOrders.Add(order);
            await _context.SaveChangesAsync();

            // Create order items
            var salesItems = orderItems.Select(item => new SalesItem
            {
                SalesOrderId = order.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.Quantity * item.UnitPrice,
                Unit = item.Unit,
                WarehouseId = onlineWarehouse.Id,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.SalesItems.AddRange(salesItems);

            // Create initial tracking entry
            var tracking = new OrderTracking
            {
                OrderId = order.Id,
                Status = "Pending",
                Notes = "Order created",
                Timestamp = DateTime.UtcNow,
                UpdatedByUserId = userId
            };
            _context.OrderTrackings.Add(tracking);

            // Clear cart if order was created from cart
            if (request.UseCartItems)
            {
                var cartItems = await _context.ShoppingCarts
                    .Where(sc => sc.UserId == userId)
                    .ToListAsync();
                _context.ShoppingCarts.RemoveRange(cartItems);
            }

            await _context.SaveChangesAsync();

            // Audit log
            await _auditService.LogAsync("CustomerOrder", order.Id.ToString(), "CREATE", 
                $"Customer order created: {orderNumber}", JsonSerializer.Serialize(new { OrderId = order.Id, OrderNumber = orderNumber }), userId);

            // Return order response
            var response = await GetOrderResponse(order.Id);
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer order");
            return StatusCode(500, new { message = "An error occurred while creating the order" });
        }
    }

    /// <summary>
    /// Get customer's orders
    /// </summary>
    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<CustomerOrderResponse>>> GetCustomerOrders()
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var orders = await _context.SalesOrders
                .Include(so => so.SalesItems)
                .ThenInclude(si => si.Product)
                .Where(so => so.CreatedByUserId == userId)
                .OrderByDescending(so => so.OrderDate)
                .ToListAsync();

            var responses = new List<CustomerOrderResponse>();
            foreach (var order in orders)
            {
                var response = await GetOrderResponse(order.Id);
                responses.Add(response);
            }

            return Ok(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer orders");
            return StatusCode(500, new { message = "An error occurred while retrieving orders" });
        }
    }

    /// <summary>
    /// Get specific order by ID
    /// </summary>
    [HttpGet("order/{id}")]
    public async Task<ActionResult<CustomerOrderResponse>> GetOrder(int id)
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }

            var userId = GetCurrentUserId();
            var order = await _context.SalesOrders
                .FirstOrDefaultAsync(so => so.Id == id && so.CreatedByUserId == userId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            var response = await GetOrderResponse(id);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order {OrderId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the order" });
        }
    }

    #endregion

    #region Product Catalog for Customers

    /// <summary>
    /// Get available products for customers
    /// </summary>
    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<CustomerProductResponse>>> GetProducts([FromQuery] int? categoryId = null, [FromQuery] string? search = null)
    {
        try
        {
            if (!await IsCustomer())
            {
                return Forbid("Access denied. Customer role required.");
            }
            var onlineWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");
            if (onlineWarehouse == null)
            {
                return NotFound("Online warehouse not found");
            }

            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductInventories.Where(pi => pi.WarehouseId == onlineWarehouse.Id))
                .Where(p => p.IsActive);

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.Contains(search) || p.Description.Contains(search));
            }

            var products = await query
                .Select(p => new CustomerProductResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    SKU = p.SKU,
                    Brand = p.Brand,
                    Unit = p.Unit,
                    CategoryName = p.Category.Name,
                    AvailableQuantity = p.ProductInventories
                        .Where(pi => pi.WarehouseId == onlineWarehouse.Id)
                        .Sum(pi => pi.Quantity),
                    IsAvailable = p.ProductInventories
                        .Where(pi => pi.WarehouseId == onlineWarehouse.Id)
                        .Sum(pi => pi.Quantity) > 0,
                    ImageUrl = p.ImageUrl
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new { message = "An error occurred while retrieving products" });
        }
    }

    /// <summary>
    /// Get product categories for customers
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<CustomerCategoryResponse>>> GetCategories()
    {
        try
        {
            var onlineWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Name == "Online Store");
            if (onlineWarehouse == null)
            {
                return NotFound("Online warehouse not found");
            }

            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .Select(c => new CustomerCategoryResponse
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ProductCount = c.Products
                        .Where(p => p.IsActive && p.ProductInventories
                            .Any(pi => pi.WarehouseId == onlineWarehouse.Id && pi.Quantity > 0))
                        .Count()
                })
                .Where(c => c.ProductCount > 0)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories");
            return StatusCode(500, new { message = "An error occurred while retrieving categories" });
        }
    }

    #endregion

    #region Helper Methods

    private async Task<CustomerOrderResponse> GetOrderResponse(int orderId)
    {
        var order = await _context.SalesOrders
            .Include(so => so.SalesItems)
            .ThenInclude(si => si.Product)
            .FirstOrDefaultAsync(so => so.Id == orderId);

        var trackingHistory = await _context.OrderTrackings
            .Include(ot => ot.UpdatedByUser)
            .Where(ot => ot.OrderId == orderId)
            .OrderBy(ot => ot.Timestamp)
            .Select(ot => new OrderTrackingResponse
            {
                Id = ot.Id,
                Status = ot.Status,
                Notes = ot.Notes,
                Location = ot.Location,
                Timestamp = ot.Timestamp,
                UpdatedByUserName = ot.UpdatedByUser != null ? ot.UpdatedByUser.FullName : "System"
            })
            .ToListAsync();

        var items = order.SalesItems.Select(si => new OnlineOrderItemResponse
        {
            Id = si.Id,
            ProductId = si.ProductId,
            ProductName = si.Product.Name,
            ProductSKU = si.Product.SKU,
            Quantity = si.Quantity,
            UnitPrice = si.UnitPrice,
            TotalPrice = si.TotalPrice,
            Unit = si.Unit
        }).ToList();

        return new CustomerOrderResponse
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = order.CustomerName ?? string.Empty,
            CustomerEmail = order.CustomerEmail,
            CustomerPhone = order.CustomerPhone,
            CustomerAddress = order.CustomerAddress ?? string.Empty,
            OrderDate = order.OrderDate,
            DeliveryDate = order.DeliveryDate,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            PaymentStatus = order.PaymentStatus,
            Notes = order.Notes,
            Items = items,
            TrackingHistory = trackingHistory
        };
    }

    #endregion
}
