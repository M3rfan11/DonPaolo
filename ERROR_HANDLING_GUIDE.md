# Error Handling & Debugging Guide

This guide explains how errors are handled in the application and how to use the debugging tools to troubleshoot issues.

## 🎯 Error Handling Features

### 1. **Global Exception Handler Middleware**
All unhandled exceptions are caught and returned as structured JSON responses with:
- **Error messages** - Clear, user-friendly descriptions
- **Error ID** - Unique identifier for tracking in logs
- **Suggestions** - Actionable steps to resolve the issue
- **Status codes** - Appropriate HTTP status codes

### 2. **Health Check Endpoints**

#### Basic Health Check
```bash
GET /api/health
```
Returns simple health status.

#### Detailed Health Check
```bash
GET /api/health/detailed
```
Returns comprehensive health information including database connectivity.

#### Database Diagnostics
```bash
GET /api/health/database
```
**Most useful for debugging!** Shows:
- Database connection status
- Pending/applied migrations
- Test query results
- Actionable suggestions

### 3. **Structured Error Responses**

All errors return a consistent format:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Database operation failed",
  "error": "The Id field is required in the Roles table",
  "errorId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "/api/roles",
  "method": "POST",
  "timestamp": "2025-11-16T18:00:00Z",
  "suggestions": [
    "Ensure all required fields are provided",
    "Check that auto-increment fields are not manually set",
    "Verify database migrations have been applied correctly"
  ]
}
```

## 🔍 How to Debug Issues

### Step 1: Check Application Logs
View logs in Render dashboard or your logging system. Look for:
- Error messages
- Error IDs (for tracking)
- Stack traces (in development)

### Step 2: Use Health Check Endpoints

#### Check Database Status
```bash
curl https://donpaolo-api.onrender.com/api/health/database
```

This will show:
- ✅ Connection status
- ✅ Migration status
- ✅ Test query results
- ✅ Specific suggestions

#### Example Response:
```json
{
  "connected": true,
  "pendingMigrations": [],
  "appliedMigrations": [
    "20251113141912_InitialMenuMigration",
    "20251116153910_RemoveHasDataFromModel",
    "20251116161000_FixPostgreSQLIdentityColumns"
  ],
  "testQuery": {
    "success": true,
    "rolesCount": 2,
    "usersCount": 5
  },
  "suggestions": [
    "Database appears to be healthy"
  ]
}
```

### Step 3: Check Error Responses

When an API call fails, the response includes:
1. **Error message** - What went wrong
2. **Error ID** - Search logs for this ID
3. **Suggestions** - Steps to fix

### Step 4: Common Error Patterns

#### Database Connection Errors
**Symptoms:**
- `Cannot connect to database`
- `Connection timeout`

**Solutions:**
1. Check `ConnectionStrings__DefaultConnection` environment variable
2. Verify PostgreSQL service is running in Render
3. Check Internal Database URL is correct

#### Migration Errors
**Symptoms:**
- `null value in column "Id"`
- `relation does not exist`

**Solutions:**
1. Check `/api/health/database` for pending migrations
2. Verify all migrations have been applied
3. Check migration logs for specific errors

#### Identity Column Issues
**Symptoms:**
- `null value in column "Id" violates not-null constraint`

**Solutions:**
1. Ensure `FixPostgreSQLIdentityColumns` migration has run
2. Check database sequences exist: `SELECT * FROM pg_sequences;`
3. Verify Id columns have defaults: `\d+ "Roles"` in psql

## 📊 Error Types & Handling

### Database Errors
- **Detected automatically** by exception type
- **Provides specific suggestions** based on error message
- **Logs detailed information** for debugging

### Authentication Errors
- Returns 401 Unauthorized
- Suggests checking login status and token validity

### Validation Errors
- Returns 400 Bad Request
- Shows which fields are invalid

### Not Found Errors
- Returns 404 Not Found
- Suggests checking resource IDs

## 🛠️ Development vs Production

### Development Mode
- **Full stack traces** in error responses
- **Detailed exception messages**
- **Verbose logging**

### Production Mode
- **Sanitized error messages** (no sensitive data)
- **Generic messages** for unexpected errors
- **Error IDs** for tracking

## 📝 Logging Best Practices

### What Gets Logged
- All exceptions with full context
- Error IDs for correlation
- Request paths and methods
- Database operation failures
- Migration status

### Log Levels
- **Error**: Exceptions, failures
- **Warning**: Recoverable issues
- **Information**: Normal operations
- **Debug**: Detailed diagnostic info (development only)

## 🚀 Quick Troubleshooting Checklist

1. ✅ Check `/api/health` - Is service running?
2. ✅ Check `/api/health/database` - Is database connected?
3. ✅ Check logs for Error IDs
4. ✅ Verify environment variables are set
5. ✅ Check migration status
6. ✅ Verify database sequences exist (for identity columns)

## 💡 Tips

- **Always check the suggestions** in error responses - they're tailored to the specific error
- **Use Error IDs** to track issues across logs
- **Health check endpoints** are safe to call frequently (no authentication required)
- **Database diagnostics endpoint** is your best friend for database issues

## 🔗 Related Files

- `Api/Middleware/GlobalExceptionHandlerMiddleware.cs` - Main error handler
- `Api/Controllers/HealthController.cs` - Health check endpoints
- `Api/Program.cs` - Startup error handling and logging

