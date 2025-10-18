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
    [Authorize] // All endpoints require authentication
    public class StoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditService _auditService;

        public StoresController(ApplicationDbContext context, IAuditService auditService)
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

        // GET: api/Stores
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,StoreManager")]
        public async Task<ActionResult<IEnumerable<object>>> GetStores()
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager();

            IQueryable<Warehouse> query = _context.Warehouses.Where(w => w.IsActive);

            // Store managers can only see their assigned store
            if (isStoreManager && !isSuperAdmin)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user?.AssignedStoreId != null)
                {
                    query = query.Where(w => w.Id == user.AssignedStoreId);
                }
                else
                {
                    return Ok(new List<object>()); // No store assigned
                }
            }

            var stores = await query
                .Select(w => new
                {
                    w.Id,
                    w.Name,
                    w.Address,
                    w.City,
                    w.PhoneNumber,
                    ManagerName = w.ManagerUser != null ? w.ManagerUser.FullName : "No Manager",
                    AssignedUsersCount = w.AssignedUsers.Count,
                    AssignedUsers = w.AssignedUsers.Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email
                    }).ToList()
                })
                .ToListAsync();

            return Ok(stores);
        }

        // GET: api/Stores/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetStore(int id)
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager(id);

            // Check if user has access to this store
            if (!isSuperAdmin && !isStoreManager)
            {
                return StatusCode(403, new { Message = "You don't have permission to access this store" });
            }

            var store = await _context.Warehouses
                .Include(w => w.ManagerUser)
                .Include(w => w.AssignedUsers)
                .Where(w => w.Id == id && w.IsActive) // Only return active stores
                .Select(w => new
                {
                    w.Id,
                    w.Name,
                    w.Address,
                    w.City,
                    w.PhoneNumber,
                    ManagerName = w.ManagerUser != null ? w.ManagerUser.FullName : "No Manager",
                    ManagerUserId = w.ManagerUserId,
                    AssignedUsersCount = w.AssignedUsers.Count,
                    AssignedUsers = w.AssignedUsers.Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (store == null)
            {
                return NotFound();
            }

            return Ok(store);
        }

        // POST: api/Stores
        [HttpPost]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<ActionResult<Warehouse>> CreateStore([FromBody] CreateStoreRequest request)
        {
            // Only SuperAdmin can create stores
            if (!await IsSuperAdmin())
            {
                return StatusCode(403, new { Message = "Only SuperAdmin can create stores" });
            }

            // If assigning a manager, ensure they're not already managing another store
            if (request.ManagerUserId.HasValue)
            {
                var existingManagerStore = await _context.Warehouses
                    .FirstOrDefaultAsync(w => w.ManagerUserId == request.ManagerUserId.Value && w.IsActive);
                
                if (existingManagerStore != null)
                {
                    return BadRequest(new { Message = $"User is already managing store '{existingManagerStore.Name}'. A manager can only manage one store at a time." });
                }
            }

            var store = new Warehouse
            {
                Name = request.Name,
                Address = request.Address,
                City = request.City,
                PhoneNumber = request.PhoneNumber,
                ManagerUserId = request.ManagerUserId,
                ManagerName = request.ManagerUserId.HasValue ? 
                    (await _context.Users.FindAsync(request.ManagerUserId.Value))?.FullName : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Warehouses.Add(store);
            await _context.SaveChangesAsync();

            // Assign manager to store if specified
            if (request.ManagerUserId.HasValue)
            {
                var manager = await _context.Users.FindAsync(request.ManagerUserId.Value);
                if (manager != null)
                {
                    // Remove manager from any other store assignment
                    manager.AssignedStoreId = store.Id;
                    await _context.SaveChangesAsync();
                }
            }

            await _auditService.LogAsync("Warehouse", store.Id.ToString(), "Created", 
                null, $"Store '{store.Name}' created", GetCurrentUserId());

            return CreatedAtAction(nameof(GetStore), new { id = store.Id }, store);
        }

        // PUT: api/Stores/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStore(int id, [FromBody] UpdateStoreRequest request)
        {
            var userId = GetCurrentUserId();
            var isSuperAdmin = await IsSuperAdmin();
            var isStoreManager = await IsStoreManager(id);

            // Check if user has permission to update this store
            if (!isSuperAdmin && !isStoreManager)
            {
                return StatusCode(403, new { Message = "You don't have permission to update this store" });
            }

            var store = await _context.Warehouses.FindAsync(id);
            if (store == null || !store.IsActive)
            {
                return NotFound();
            }

            // Store managers can only update basic info, not manager assignment
            if (isStoreManager && !isSuperAdmin)
            {
                store.Name = request.Name;
                store.Address = request.Address;
                store.City = request.City;
                store.PhoneNumber = request.PhoneNumber;
                // Don't allow store managers to change manager assignment
            }
            else
            {
                // SuperAdmin can update everything
                store.Name = request.Name;
                store.Address = request.Address;
                store.City = request.City;
                store.PhoneNumber = request.PhoneNumber;
                
                // Handle manager assignment with one-store-per-manager constraint
                if (request.ManagerUserId != store.ManagerUserId)
                {
                    // If assigning a new manager, ensure they're not already managing another store
                    if (request.ManagerUserId.HasValue)
                    {
                        var existingManagerStore = await _context.Warehouses
                            .FirstOrDefaultAsync(w => w.ManagerUserId == request.ManagerUserId.Value && w.IsActive && w.Id != id);
                        
                        if (existingManagerStore != null)
                        {
                            return BadRequest(new { Message = $"User is already managing store '{existingManagerStore.Name}'. A manager can only manage one store at a time." });
                        }
                    }

                    // Remove old manager from store assignment if they exist
                    if (store.ManagerUserId.HasValue)
                    {
                        var oldManager = await _context.Users.FindAsync(store.ManagerUserId.Value);
                        if (oldManager != null)
                        {
                            oldManager.AssignedStoreId = null;
                        }
                    }

                    // Assign new manager
                    store.ManagerUserId = request.ManagerUserId;
                    store.ManagerName = request.ManagerUserId.HasValue ? 
                        (await _context.Users.FindAsync(request.ManagerUserId.Value))?.FullName : null;

                    // Update new manager's store assignment
                    if (request.ManagerUserId.HasValue)
                    {
                        var newManager = await _context.Users.FindAsync(request.ManagerUserId.Value);
                        if (newManager != null)
                        {
                            newManager.AssignedStoreId = store.Id;
                        }
                    }
                }
            }

            store.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("Warehouse", store.Id.ToString(), "Updated", 
                null, $"Store '{store.Name}' updated", userId);

            return NoContent();
        }

        // DELETE: api/Stores/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStore(int id)
        {
            // Only SuperAdmin can delete stores
            if (!await IsSuperAdmin())
            {
                return StatusCode(403, new { Message = "Only SuperAdmin can delete stores" });
            }

            var store = await _context.Warehouses.FindAsync(id);
            if (store == null || !store.IsActive)
            {
                return NotFound();
            }

            // Soft delete - set IsActive to false instead of removing the record
            store.IsActive = false;
            store.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("Warehouse", store.Id.ToString(), "Deleted", 
                null, $"Store '{store.Name}' deleted", GetCurrentUserId());

            return NoContent();
        }

        // GET: api/Stores/available-users
        [HttpGet("available-users")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableUsers()
        {
            var users = await _context.Users
                .Where(u => u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    AssignedStoreId = u.AssignedStoreId,
                    AssignedStoreName = u.AssignedStore != null ? u.AssignedStore.Name : null
                })
                .ToListAsync();

            return Ok(users);
        }

        // POST: api/Stores/5/assign-user
        [HttpPost("{storeId}/assign-user")]
        public async Task<IActionResult> AssignUserToStore(int storeId, [FromBody] AssignUserRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var store = await _context.Warehouses.FindAsync(storeId);
            if (store == null)
            {
                return NotFound("Store not found");
            }

            // Check if user is a StoreManager and if they're already managing another store
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == request.UserId)
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.Name)
                .ToListAsync();

            if (userRoles.Contains("StoreManager"))
            {
                var existingManagerStore = await _context.Warehouses
                    .FirstOrDefaultAsync(w => w.ManagerUserId == request.UserId && w.IsActive && w.Id != storeId);
                
                if (existingManagerStore != null)
                {
                    return BadRequest(new { Message = $"User is already managing store '{existingManagerStore.Name}'. A manager can only manage one store at a time." });
                }
            }

            user.AssignedStoreId = storeId;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // DELETE: api/Stores/5/users/6
        [HttpDelete("{storeId}/users/{userId}")]
        public async Task<IActionResult> RemoveUserFromStore(int storeId, int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            if (user.AssignedStoreId != storeId)
            {
                return BadRequest("User is not assigned to this store");
            }

            user.AssignedStoreId = null;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class CreateStoreRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int? ManagerUserId { get; set; }
    }

    public class UpdateStoreRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int? ManagerUserId { get; set; }
    }

    public class AssignUserRequest
    {
        public int UserId { get; set; }
    }
}
