namespace Api.DTOs;

public class DashboardStatsResponse
{
    public int TotalProducts { get; set; }
    public int TotalWarehouses { get; set; }
    public int TotalUsers { get; set; }
    public decimal TotalInventory { get; set; }
    public int PendingPurchases { get; set; }
    public int PendingSales { get; set; }
    public int LowStockItems { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCosts { get; set; }
    public int PendingRequests { get; set; }
    public int CompletedAssemblies { get; set; }
}

public class RecentActivityResponse
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // Purchase, Sale, Request, Assembly
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string UserName { get; set; } = string.Empty;
}

public class UserDashboardResponse
{
    public List<UserRequestResponse> MyRequests { get; set; } = new List<UserRequestResponse>();
    public List<UserOrderResponse> MyOrders { get; set; } = new List<UserOrderResponse>();
}

public class UserRequestResponse
{
    public int Id { get; set; }
    public DateTime RequestDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
}

public class UserOrderResponse
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
}















