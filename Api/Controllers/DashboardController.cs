using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.DTOs;
using Api.Services;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IRevenueTrackingService _revenueTrackingService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(ApplicationDbContext context, IAuditService auditService, IRevenueTrackingService revenueTrackingService, ILogger<DashboardController> logger)
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

    /// <summary>
    /// Get dashboard statistics with real-time revenue tracking
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsResponse>> GetStats()
    {
        try
        {
            // Use revenue tracking service for real-time totals
            var totalRevenue = await _revenueTrackingService.GetTotalRevenueAsync();
            var totalCosts = await _revenueTrackingService.GetTotalCostsAsync();

            var stats = new DashboardStatsResponse
            {
                TotalProducts = await _context.Products.CountAsync(p => p.IsActive),
                TotalWarehouses = await _context.Warehouses.CountAsync(),
                TotalUsers = await _context.Users.CountAsync(u => u.IsActive),
                TotalInventory = await _context.ProductInventories.SumAsync(pi => pi.Quantity + pi.POSQuantity),
                PendingPurchases = await _context.PurchaseOrders.CountAsync(po => po.Status == "Pending"),
                PendingSales = await _context.SalesOrders.CountAsync(so => so.Status == "Pending"),
                LowStockItems = await _context.ProductInventories
                    .CountAsync(pi => (pi.Quantity + pi.POSQuantity) <= pi.MinimumStockLevel),
                TotalRevenue = totalRevenue, // Real-time revenue from tracking service
                TotalCosts = totalCosts, // Real-time costs from tracking service
                PendingRequests = await _context.ProductRequests.CountAsync(pr => pr.Status == "Pending"),
                CompletedAssemblies = await _context.ProductAssemblies.CountAsync(pa => pa.Status == "Completed"),
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard statistics");
            return StatusCode(500, new { message = "An error occurred while retrieving dashboard statistics" });
        }
    }

    /// <summary>
    /// Get recent activity
    /// </summary>
    [HttpGet("recent-activity")]
    public async Task<ActionResult<IEnumerable<RecentActivityResponse>>> GetRecentActivity()
    {
        try
        {
            var activities = new List<RecentActivityResponse>();

            // Recent purchases
            var recentPurchases = await _context.PurchaseOrders
                .Include(po => po.CreatedByUser)
                .OrderByDescending(po => po.CreatedAt)
                .Take(5)
                .Select(po => new RecentActivityResponse
                {
                    Id = po.Id,
                    Type = "Purchase",
                    Title = $"Purchase Order #{po.OrderNumber}",
                    Description = $"Order from {po.SupplierName} - ${po.TotalAmount:F2}",
                    Status = po.Status,
                    CreatedAt = po.CreatedAt,
                    UserName = po.CreatedByUser.FullName
                })
                .ToListAsync();

            // Recent sales
            var recentSales = await _context.SalesOrders
                .Include(so => so.CreatedByUser)
                .OrderByDescending(so => so.CreatedAt)
                .Take(5)
                .Select(so => new RecentActivityResponse
                {
                    Id = so.Id,
                    Type = "Sale",
                    Title = $"Sales Order #{so.OrderNumber}",
                    Description = $"Order for {so.CustomerName} - ${so.TotalAmount:F2}",
                    Status = so.Status,
                    CreatedAt = so.CreatedAt,
                    UserName = so.CreatedByUser.FullName
                })
                .ToListAsync();

            // Recent product requests
            var recentRequests = await _context.ProductRequests
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.Warehouse)
                .OrderByDescending(pr => pr.RequestDate)
                .Take(5)
                .Select(pr => new RecentActivityResponse
                {
                    Id = pr.Id,
                    Type = "Product Request",
                    Title = $"Product Request #{pr.Id}",
                    Description = $"Request for {pr.Warehouse.Name}",
                    Status = pr.Status,
                    CreatedAt = pr.RequestDate,
                    UserName = pr.RequestedByUser.FullName
                })
                .ToListAsync();

            activities.AddRange(recentPurchases);
            activities.AddRange(recentSales);
            activities.AddRange(recentRequests);

            return Ok(activities.OrderByDescending(a => a.CreatedAt).Take(10));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent activity");
            return StatusCode(500, new { message = "An error occurred while retrieving recent activity" });
        }
    }

    /// <summary>
    /// Refresh revenue and cost totals (Admin only)
    /// </summary>
    [HttpPost("refresh-totals")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> RefreshTotals()
    {
        try
        {
            await _revenueTrackingService.RefreshAllTotalsAsync();
            return Ok(new { message = "Revenue and cost totals refreshed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing totals");
            return StatusCode(500, new { message = "An error occurred while refreshing totals" });
        }
    }
}