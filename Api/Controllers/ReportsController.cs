using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.DTOs;
using Api.Models;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get sales report with daily breakdown
    /// </summary>
    [HttpGet("sales")]
    public async Task<ActionResult<SalesReportResponse>> GetSalesReport(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int? storeId = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var currentUserRoles = await GetCurrentUserRoles(currentUserId);
            
            // Default to last 30 days if not specified
            var startDate = fromDate ?? DateTime.UtcNow.AddDays(-30).Date;
            var endDate = toDate ?? DateTime.UtcNow.Date;
            
            // Apply role-based filtering - Cashier can only see their store
            if (currentUserRoles.Contains("Cashier"))
            {
                var currentUser = await _context.Users.FindAsync(currentUserId);
                if (currentUser?.AssignedStoreId == null)
                {
                    return BadRequest("You are not assigned to any store.");
                }
                storeId = currentUser.AssignedStoreId;
            }

            // Query sales within date range
            var salesQuery = _context.SalesOrders
                .Where(so => so.OrderDate.Date >= startDate && so.OrderDate.Date <= endDate);

            // Apply store filter if specified
            if (storeId.HasValue)
            {
                salesQuery = salesQuery.Where(so => so.SalesItems.Any(si => si.WarehouseId == storeId.Value));
            }

            var sales = await salesQuery.ToListAsync();

            // Calculate daily data
            var dailyData = sales
                .GroupBy(s => s.OrderDate.Date)
                .Select(g => new DailySalesData
                {
                    Date = g.Key,
                    DayOfWeek = g.Key.DayOfWeek.ToString(),
                    TotalSales = g.Sum(s => s.TotalAmount),
                    OrderCount = g.Count(),
                    AverageOrderValue = g.Average(s => s.TotalAmount)
                })
                .OrderBy(d => d.Date)
                .ToList();

            // Calculate overall statistics
            var totalSales = sales.Sum(s => s.TotalAmount);
            var totalOrders = sales.Count;
            var averageOrderValue = sales.Any() ? sales.Average(s => s.TotalAmount) : 0;

            // Get top products
            var allProducts = new List<TopProductData>();
            if (sales.Any())
            {
                var salesItemIds = sales.Select(s => s.Id).ToList();
                var salesItems = await _context.SalesItems
                    .Include(si => si.Product)
                    .Where(si => salesItemIds.Contains(si.SalesOrderId))
                    .ToListAsync();

                allProducts = salesItems
                    .Where(si => si.Product != null)
                    .GroupBy(si => new { si.ProductId, ProductName = si.Product!.Name })
                    .Select(g => new TopProductData
                    {
                        ProductId = g.Key.ProductId,
                        ProductName = g.Key.ProductName,
                        TotalQuantity = g.Sum(si => si.Quantity),
                        TotalRevenue = g.Sum(si => si.TotalPrice)
                    })
                    .OrderByDescending(p => p.TotalRevenue)
                    .Take(10)
                    .ToList();
            }

            return Ok(new SalesReportResponse
            {
                FromDate = startDate,
                ToDate = endDate,
                StoreId = storeId,
                TotalSales = totalSales,
                TotalOrders = totalOrders,
                AverageOrderValue = averageOrderValue,
                DailyData = dailyData,
                TopProducts = allProducts,
                GeneratedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating sales report");
            return StatusCode(500, new { message = "An error occurred while generating the sales report" });
        }
    }


    private int[] GetQuarterMonths(int quarter)
    {
        return quarter switch
        {
            1 => new[] { 1, 2, 3 },
            2 => new[] { 4, 5, 6 },
            3 => new[] { 7, 8, 9 },
            4 => new[] { 10, 11, 12 },
            _ => throw new ArgumentException("Invalid quarter")
        };
    }

    private List<TopProductData> GetTopProducts(List<SalesOrder> sales, int? storeId)
    {
        return sales.SelectMany(s => s.SalesItems)
            .Where(si => si.Product != null && (!storeId.HasValue || si.WarehouseId == storeId.Value))
            .GroupBy(si => new { si.ProductId, ProductName = si.Product!.Name })
            .Select(g => new TopProductData
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalQuantity = g.Sum(si => si.Quantity),
                TotalRevenue = g.Sum(si => si.TotalPrice)
            })
            .OrderByDescending(p => p.TotalRevenue)
            .Take(5)
            .ToList();
    }

    private List<PeakHourData> GetPeakSalesHours(List<SalesOrder> sales)
    {
        return sales.GroupBy(s => s.OrderDate.Hour)
            .Select(g => new PeakHourData
            {
                Hour = g.Key,
                OrderCount = g.Count(),
                TotalSales = g.Sum(s => s.TotalAmount)
            })
            .OrderByDescending(h => h.OrderCount)
            .Take(5)
            .ToList();
    }

    private List<HourlySalesData> GetHourlySalesAnalysis(List<SalesOrder> sales)
    {
        return Enumerable.Range(0, 24)
            .Select(hour => new HourlySalesData
            {
                Hour = hour,
                TotalSales = sales.Where(s => s.OrderDate.Hour == hour).Sum(s => s.TotalAmount),
                OrderCount = sales.Count(s => s.OrderDate.Hour == hour),
                AverageOrderValue = sales.Where(s => s.OrderDate.Hour == hour).Count() > 0 
                    ? sales.Where(s => s.OrderDate.Hour == hour).Average(s => s.TotalAmount) 
                    : 0
            })
            .ToList();
    }

    private List<DailySalesData> GetDailySalesAnalysis(List<SalesOrder> sales)
    {
        return sales.GroupBy(s => s.OrderDate.Date)
            .Select(g => new DailySalesData
            {
                Date = g.Key,
                DayOfWeek = g.Key.DayOfWeek.ToString(),
                TotalSales = g.Sum(s => s.TotalAmount),
                OrderCount = g.Count(),
                AverageOrderValue = g.Average(s => s.TotalAmount)
            })
            .OrderByDescending(d => d.TotalSales)
            .ToList();
    }

    private List<StoreBreakdownData> GetStoreBreakdown(List<SalesOrder> sales, int? storeId)
    {
        if (storeId.HasValue)
        {
            var storeSales = sales.Where(s => s.SalesItems.Any(si => si.WarehouseId == storeId.Value)).ToList();
            return new List<StoreBreakdownData>
            {
                new StoreBreakdownData
                {
                    StoreId = storeId.Value,
                    StoreName = "Current Store",
                    TotalSales = storeSales.Sum(s => s.TotalAmount),
                    OrderCount = storeSales.Count
                }
            };
        }

        // Return breakdown by all stores with null checks
        return sales.SelectMany(s => s.SalesItems)
            .Where(si => si.Warehouse != null)
            .GroupBy(si => new { si.WarehouseId, WarehouseName = si.Warehouse!.Name })
            .Select(g => new StoreBreakdownData
            {
                StoreId = g.Key.WarehouseId,
                StoreName = g.Key.WarehouseName,
                TotalSales = g.Sum(si => si.TotalPrice),
                OrderCount = sales.Count(s => s.SalesItems.Any(si => si.WarehouseId == g.Key.WarehouseId))
            })
            .OrderByDescending(s => s.TotalSales)
            .ToList();
    }


    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId) ? userId : 0;
    }

    private async Task<List<string>> GetCurrentUserRoles(int userId)
    {
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Name)
            .ToListAsync();
    }
}