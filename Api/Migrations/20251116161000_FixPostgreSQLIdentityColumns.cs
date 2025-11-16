using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class FixPostgreSQLIdentityColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix identity columns for PostgreSQL
            // This migration uses raw SQL to convert existing integer columns to identity columns
            // Only execute on PostgreSQL - SQLite will skip this (SQLite doesn't support this SQL syntax)
            
            // Check if we're using PostgreSQL by trying to execute a PostgreSQL-specific query
            // If it fails, we're not on PostgreSQL and should skip this migration
            var isPostgreSQL = false;
            try
            {
                migrationBuilder.Sql("SELECT 1 FROM pg_database LIMIT 1");
                isPostgreSQL = true;
            }
            catch
            {
                // Not PostgreSQL, skip this migration
                return;
            }

            if (!isPostgreSQL)
            {
                return;
            }

            // List of all tables with Id columns that need to be identity columns
            var tables = new[]
            {
                "AuditLogs", "BillOfMaterials", "Categories", "Customers", "OrderTrackings",
                "ProductAssemblies", "ProductInventories", "ProductMovements", "ProductMovementSummaries",
                "ProductRequestItems", "ProductRequests", "Products", "PurchaseItems", "PurchaseOrders",
                "Roles", "SalesItems", "SalesOrders", "ShoppingCarts", "Users", "Warehouses"
            };

            foreach (var table in tables)
            {
                // Convert Id column to identity column
                // First, create a sequence if it doesn't exist
                migrationBuilder.Sql($@"
                    DO $$
                    BEGIN
                        -- Create sequence if it doesn't exist
                        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '{table}_Id_seq') THEN
                            CREATE SEQUENCE ""{table}_Id_seq"";
                        END IF;
                        
                        -- Set the sequence to start from the current max Id + 1
                        PERFORM setval('""{table}_Id_seq""', COALESCE((SELECT MAX(""Id"") FROM ""{table}""), 0) + 1, false);
                        
                        -- Alter the column to use the sequence as default
                        ALTER TABLE ""{table}"" 
                        ALTER COLUMN ""Id"" 
                        SET DEFAULT nextval('""{table}_Id_seq""');
                        
                        -- Make the sequence owned by the column
                        ALTER SEQUENCE ""{table}_Id_seq"" OWNED BY ""{table}"".""Id"";
                    END $$;
                ");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove identity sequences (rollback)
            var isPostgreSQL = false;
            try
            {
                migrationBuilder.Sql("SELECT 1 FROM pg_database LIMIT 1");
                isPostgreSQL = true;
            }
            catch
            {
                return;
            }

            if (!isPostgreSQL)
            {
                return;
            }

            var tables = new[]
            {
                "AuditLogs", "BillOfMaterials", "Categories", "Customers", "OrderTrackings",
                "ProductAssemblies", "ProductInventories", "ProductMovements", "ProductMovementSummaries",
                "ProductRequestItems", "ProductRequests", "Products", "PurchaseItems", "PurchaseOrders",
                "Roles", "SalesItems", "SalesOrders", "ShoppingCarts", "Users", "Warehouses"
            };

            foreach (var table in tables)
            {
                migrationBuilder.Sql($@"
                    DO $$
                    BEGIN
                        -- Remove default from column
                        ALTER TABLE ""{table}"" ALTER COLUMN ""Id"" DROP DEFAULT;
                        
                        -- Drop sequence if it exists
                        DROP SEQUENCE IF EXISTS ""{table}_Id_seq"";
                    END $$;
                ");
            }
        }
    }
}

