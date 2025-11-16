using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Basic health check endpoint
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            service = "donpaolo-api"
        });
    }

    /// <summary>
    /// Detailed health check including database connectivity
    /// </summary>
    [HttpGet("detailed")]
    public async Task<IActionResult> GetDetailed()
    {
        var health = new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            service = "donpaolo-api",
            checks = new
            {
                database = await CheckDatabaseAsync()
            }
        };

        var isHealthy = health.checks.database.status == "healthy";
        return isHealthy ? Ok(health) : StatusCode(503, health);
    }

    /// <summary>
    /// Database diagnostics endpoint - shows connection status and migration info
    /// </summary>
    [HttpGet("database")]
    public async Task<IActionResult> GetDatabaseStatus()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
            var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync();
            
            // Try a simple query
            var rolesCount = 0;
            var usersCount = 0;
            string? queryError = null;
            
            try
            {
                rolesCount = await _context.Roles.CountAsync();
                usersCount = await _context.Users.CountAsync();
            }
            catch (Exception ex)
            {
                queryError = ex.Message;
            }

            var status = new
            {
                connected = canConnect,
                connectionString = _context.Database.GetConnectionString()?.Substring(0, Math.Min(50, _context.Database.GetConnectionString()?.Length ?? 0)) + "...",
                pendingMigrations = pendingMigrations.ToArray(),
                appliedMigrations = appliedMigrations.ToArray(),
                testQuery = new
                {
                    success = queryError == null,
                    rolesCount,
                    usersCount,
                    error = queryError
                },
                suggestions = GetSuggestions(canConnect, pendingMigrations.Any(), queryError != null)
            };

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking database status");
            return StatusCode(500, new
            {
                error = "Failed to check database status",
                message = ex.Message,
                suggestions = new[]
                {
                    "Check database connection string",
                    "Verify database server is running",
                    "Check application logs for details"
                }
            });
        }
    }

    private async Task<object> CheckDatabaseAsync()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            if (!canConnect)
            {
                return new
                {
                    status = "unhealthy",
                    message = "Cannot connect to database",
                    suggestions = new[]
                    {
                        "Check connection string configuration",
                        "Verify database server is running",
                        "Check network connectivity"
                    }
                };
            }

            // Try a simple query
            await _context.Database.ExecuteSqlRawAsync("SELECT 1");
            
            return new
            {
                status = "healthy",
                message = "Database connection successful"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return new
            {
                status = "unhealthy",
                message = ex.Message,
                suggestions = new[]
                {
                    "Check database connection string",
                    "Verify database server is accessible",
                    "Review application logs for details"
                }
            };
        }
    }

    private string[] GetSuggestions(bool canConnect, bool hasPendingMigrations, bool queryFailed)
    {
        var suggestions = new List<string>();

        if (!canConnect)
        {
            suggestions.Add("1. Verify ConnectionStrings__DefaultConnection environment variable is set");
            suggestions.Add("2. Check PostgreSQL database is running in Render");
            suggestions.Add("3. Verify the Internal Database URL is correct");
        }

        if (hasPendingMigrations)
        {
            suggestions.Add("4. Run pending migrations: The application should auto-migrate on startup");
            suggestions.Add("5. Check migration logs for errors");
        }

        if (queryFailed)
        {
            suggestions.Add("6. Database schema may be incomplete - check migration status");
            suggestions.Add("7. Verify all migrations have been applied successfully");
        }

        if (!suggestions.Any())
        {
            suggestions.Add("Database appears to be healthy");
        }

        return suggestions.ToArray();
    }
}
