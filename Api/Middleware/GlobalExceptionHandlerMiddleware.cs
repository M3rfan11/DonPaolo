using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred. Path: {Path}, Method: {Method}",
                context.Request.Path, context.Request.Method);

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var response = context.Response;

        var errorResponse = new ErrorResponse
        {
            Success = false,
            Timestamp = DateTime.UtcNow,
            Path = context.Request.Path,
            Method = context.Request.Method
        };

        switch (exception)
        {
            case DbUpdateException dbEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Database operation failed";
                errorResponse.Error = GetDatabaseErrorDetails(dbEx);
                errorResponse.Suggestions = GetDatabaseErrorSuggestions(dbEx);
                break;

            case UnauthorizedAccessException:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Unauthorized access";
                errorResponse.Suggestions = new[]
                {
                    "Check if you are logged in",
                    "Verify your authentication token is valid",
                    "Ensure you have the required permissions"
                };
                break;

            case ArgumentException argEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Invalid request";
                errorResponse.Error = argEx.Message;
                break;

            case KeyNotFoundException:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "Resource not found";
                errorResponse.Suggestions = new[]
                {
                    "Verify the resource ID is correct",
                    "Check if the resource exists",
                    "Ensure you have access to this resource"
                };
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.StatusCode = response.StatusCode;
                errorResponse.Message = "An unexpected error occurred";
                
                if (_environment.IsDevelopment())
                {
                    errorResponse.Error = exception.ToString();
                    errorResponse.StackTrace = exception.StackTrace;
                }
                else
                {
                    errorResponse.Error = "Please contact support if this issue persists";
                    errorResponse.Suggestions = new[]
                    {
                        "Try again in a few moments",
                        "Check the service status",
                        "Contact support with the error ID if the problem continues"
                    };
                }
                break;
        }

        // Add error ID for tracking
        errorResponse.ErrorId = Guid.NewGuid().ToString();
        _logger.LogError("Error ID: {ErrorId}, Exception: {Exception}", errorResponse.ErrorId, exception);

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = _environment.IsDevelopment()
        });

        await response.WriteAsync(jsonResponse);
    }

    private string GetDatabaseErrorDetails(DbUpdateException ex)
    {
        var innerException = ex.InnerException;
        
        if (innerException?.Message != null)
        {
            // Extract meaningful error message
            var message = innerException.Message;
            
            // Check for common PostgreSQL errors
            if (message.Contains("null value in column"))
            {
                var match = System.Text.RegularExpressions.Regex.Match(
                    message, 
                    @"null value in column ""(\w+)"" of relation ""(\w+)""");
                if (match.Success)
                {
                    return $"The {match.Groups[1].Value} field is required in the {match.Groups[2].Value} table";
                }
            }
            
            if (message.Contains("violates not-null constraint"))
            {
                return "A required field is missing. Please check all required fields are provided.";
            }
            
            if (message.Contains("duplicate key value"))
            {
                return "This record already exists. Please use a unique value.";
            }
            
            if (message.Contains("foreign key constraint"))
            {
                return "Cannot perform this operation because related records exist.";
            }
            
            return message;
        }
        
        return ex.Message;
    }

    private string[] GetDatabaseErrorSuggestions(DbUpdateException ex)
    {
        var suggestions = new List<string>();
        var message = ex.InnerException?.Message ?? ex.Message;
        
        if (message.Contains("null value in column") || message.Contains("not-null constraint"))
        {
            suggestions.Add("Ensure all required fields are provided");
            suggestions.Add("Check that auto-increment fields are not manually set");
            suggestions.Add("Verify database migrations have been applied correctly");
        }
        
        if (message.Contains("duplicate key"))
        {
            suggestions.Add("Use a different unique identifier");
            suggestions.Add("Check if the record already exists");
        }
        
        if (message.Contains("foreign key"))
        {
            suggestions.Add("Ensure referenced records exist");
            suggestions.Add("Remove dependent records first if deleting");
        }
        
        if (message.Contains("connection") || message.Contains("timeout"))
        {
            suggestions.Add("Check database connection string is correct");
            suggestions.Add("Verify database server is running");
            suggestions.Add("Check network connectivity");
        }
        
        if (!suggestions.Any())
        {
            suggestions.Add("Review the error message for details");
            suggestions.Add("Check application logs for more information");
            suggestions.Add("Verify database schema is up to date");
        }
        
        return suggestions.ToArray();
    }
}

public class ErrorResponse
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Error { get; set; }
    public string? StackTrace { get; set; }
    public string? ErrorId { get; set; }
    public string? Path { get; set; }
    public string? Method { get; set; }
    public DateTime Timestamp { get; set; }
    public string[]? Suggestions { get; set; }
}

