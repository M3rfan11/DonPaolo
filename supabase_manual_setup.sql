-- ============================================
-- Supabase Manual Database Setup Script
-- ============================================
-- This script creates all tables for the Don Paolo application
-- Run this in Supabase SQL Editor if you prefer manual setup
-- Otherwise, migrations will run automatically on deployment
-- ============================================

-- Note: This script uses PostgreSQL syntax
-- All Id columns will be SERIAL (auto-increment) by default in PostgreSQL

-- ============================================
-- Create Tables
-- ============================================

-- Categories Table
CREATE TABLE IF NOT EXISTS "Categories" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "IsActive" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Categories_Name" ON "Categories" ("Name");

-- Customers Table
CREATE TABLE IF NOT EXISTS "Customers" (
    "Id" SERIAL PRIMARY KEY,
    "FullName" VARCHAR(100) NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "Email" VARCHAR(255),
    "Address" VARCHAR(500),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "IsActive" BOOLEAN NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Customers_PhoneNumber" ON "Customers" ("PhoneNumber");

-- Roles Table
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(200),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Roles_Name" ON "Roles" ("Name");

-- Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "FullName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL,
    "UpdatedAt" TIMESTAMP,
    "AssignedStoreId" INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Users_AssignedStoreId" ON "Users" ("AssignedStoreId");

-- UserRoles Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS "UserRoles" (
    "UserId" INTEGER NOT NULL,
    "RoleId" INTEGER NOT NULL,
    "AssignedAt" TIMESTAMP NOT NULL,
    PRIMARY KEY ("UserId", "RoleId")
);

CREATE INDEX IF NOT EXISTS "IX_UserRoles_RoleId" ON "UserRoles" ("RoleId");

-- Products Table
CREATE TABLE IF NOT EXISTS "Products" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Price" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "SKU" VARCHAR(50),
    "Brand" VARCHAR(100),
    "ImageUrl" VARCHAR(500),
    "Weight" DECIMAL(18,2),
    "Dimensions" VARCHAR(50),
    "CategoryId" INTEGER NOT NULL,
    "IsActive" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_Products_CategoryId" ON "Products" ("CategoryId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Products_SKU" ON "Products" ("SKU");

-- Warehouses Table
CREATE TABLE IF NOT EXISTS "Warehouses" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Address" VARCHAR(200),
    "City" VARCHAR(50),
    "PhoneNumber" VARCHAR(20),
    "ManagerName" VARCHAR(100),
    "ManagerUserId" INTEGER,
    "IsActive" BOOLEAN NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_Warehouses_ManagerUserId" ON "Warehouses" ("ManagerUserId");

-- AuditLogs Table
CREATE TABLE IF NOT EXISTS "AuditLogs" (
    "Id" SERIAL PRIMARY KEY,
    "ActorUserId" INTEGER,
    "Entity" VARCHAR(100) NOT NULL,
    "EntityId" VARCHAR(50) NOT NULL,
    "Action" VARCHAR(50) NOT NULL,
    "Before" TEXT,
    "After" TEXT,
    "At" TIMESTAMP NOT NULL,
    "IpAddress" VARCHAR(200),
    "UserAgent" VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS "IX_AuditLogs_ActorUserId" ON "AuditLogs" ("ActorUserId");
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_At" ON "AuditLogs" ("At");
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_Entity_EntityId" ON "AuditLogs" ("Entity", "EntityId");

-- ProductInventories Table
CREATE TABLE IF NOT EXISTS "ProductInventories" (
    "Id" SERIAL PRIMARY KEY,
    "ProductId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "Quantity" DECIMAL(18,2) NOT NULL,
    "POSQuantity" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "MinimumStockLevel" DECIMAL(18,2),
    "MaximumStockLevel" DECIMAL(18,2),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    UNIQUE ("ProductId", "WarehouseId")
);

CREATE INDEX IF NOT EXISTS "IX_ProductInventories_WarehouseId" ON "ProductInventories" ("WarehouseId");

-- ProductMovements Table
CREATE TABLE IF NOT EXISTS "ProductMovements" (
    "Id" SERIAL PRIMARY KEY,
    "ProductId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "MovementType" VARCHAR(20) NOT NULL,
    "Quantity" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "Direction" VARCHAR(20) NOT NULL,
    "Description" VARCHAR(500),
    "ReferenceNumber" VARCHAR(100),
    "ReferenceId" INTEGER,
    "ReferenceType" VARCHAR(20),
    "CreatedByUserId" INTEGER,
    "MovementDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Notes" VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS "IX_ProductMovements_ProductId" ON "ProductMovements" ("ProductId");
CREATE INDEX IF NOT EXISTS "IX_ProductMovements_WarehouseId" ON "ProductMovements" ("WarehouseId");
CREATE INDEX IF NOT EXISTS "IX_ProductMovements_CreatedByUserId" ON "ProductMovements" ("CreatedByUserId");

-- ProductMovementSummaries Table
CREATE TABLE IF NOT EXISTS "ProductMovementSummaries" (
    "Id" SERIAL PRIMARY KEY,
    "ProductId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "SummaryDate" TIMESTAMP NOT NULL,
    "OpeningBalance" DECIMAL(18,2) NOT NULL,
    "TotalIn" DECIMAL(18,2) NOT NULL,
    "TotalOut" DECIMAL(18,2) NOT NULL,
    "ClosingBalance" DECIMAL(18,2) NOT NULL,
    "PurchaseCount" INTEGER NOT NULL,
    "SaleCount" INTEGER NOT NULL,
    "AssemblyCount" INTEGER NOT NULL,
    "TransferCount" INTEGER NOT NULL,
    "AdjustmentCount" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_ProductMovementSummaries_ProductId" ON "ProductMovementSummaries" ("ProductId");
CREATE INDEX IF NOT EXISTS "IX_ProductMovementSummaries_WarehouseId" ON "ProductMovementSummaries" ("WarehouseId");

-- ProductAssemblies Table
CREATE TABLE IF NOT EXISTS "ProductAssemblies" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Quantity" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "Instructions" VARCHAR(500),
    "Status" VARCHAR(20) NOT NULL,
    "Notes" VARCHAR(500),
    "CreatedByUserId" INTEGER NOT NULL,
    "StoreId" INTEGER,
    "IsActive" BOOLEAN NOT NULL,
    "SalePrice" DECIMAL(18,2),
    "CompletedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "StartedAt" TIMESTAMP,
    "CompletedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_ProductAssemblies_CreatedByUserId" ON "ProductAssemblies" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_ProductAssemblies_CompletedByUserId" ON "ProductAssemblies" ("CompletedByUserId");
CREATE INDEX IF NOT EXISTS "IX_ProductAssemblies_StoreId" ON "ProductAssemblies" ("StoreId");

-- BillOfMaterials Table
CREATE TABLE IF NOT EXISTS "BillOfMaterials" (
    "Id" SERIAL PRIMARY KEY,
    "ProductAssemblyId" INTEGER NOT NULL,
    "RawProductId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "RequiredQuantity" DECIMAL(18,2) NOT NULL,
    "AvailableQuantity" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "Notes" VARCHAR(200),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_BillOfMaterials_ProductAssemblyId" ON "BillOfMaterials" ("ProductAssemblyId");
CREATE INDEX IF NOT EXISTS "IX_BillOfMaterials_RawProductId" ON "BillOfMaterials" ("RawProductId");
CREATE INDEX IF NOT EXISTS "IX_BillOfMaterials_WarehouseId" ON "BillOfMaterials" ("WarehouseId");

-- ProductRequests Table
CREATE TABLE IF NOT EXISTS "ProductRequests" (
    "Id" SERIAL PRIMARY KEY,
    "RequestedByUserId" INTEGER NOT NULL,
    "RequestDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(20) NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "Notes" VARCHAR(500),
    "ApprovedByUserId" INTEGER,
    "ApprovedAt" TIMESTAMP,
    "RejectedAt" TIMESTAMP,
    "RejectionReason" VARCHAR(500),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_ProductRequests_RequestedByUserId" ON "ProductRequests" ("RequestedByUserId");
CREATE INDEX IF NOT EXISTS "IX_ProductRequests_ApprovedByUserId" ON "ProductRequests" ("ApprovedByUserId");
CREATE INDEX IF NOT EXISTS "IX_ProductRequests_WarehouseId" ON "ProductRequests" ("WarehouseId");

-- ProductRequestItems Table
CREATE TABLE IF NOT EXISTS "ProductRequestItems" (
    "Id" SERIAL PRIMARY KEY,
    "ProductRequestId" INTEGER NOT NULL,
    "ProductId" INTEGER NOT NULL,
    "QuantityRequested" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "Notes" VARCHAR(200),
    "QuantityApproved" DECIMAL(18,2),
    "QuantityReceived" DECIMAL(18,2),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_ProductRequestItems_ProductRequestId" ON "ProductRequestItems" ("ProductRequestId");
CREATE INDEX IF NOT EXISTS "IX_ProductRequestItems_ProductId" ON "ProductRequestItems" ("ProductId");

-- PurchaseOrders Table
CREATE TABLE IF NOT EXISTS "PurchaseOrders" (
    "Id" SERIAL PRIMARY KEY,
    "OrderNumber" VARCHAR(50) NOT NULL,
    "SupplierName" VARCHAR(100),
    "SupplierAddress" VARCHAR(500),
    "SupplierPhone" VARCHAR(50),
    "SupplierEmail" VARCHAR(100),
    "OrderDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpectedDeliveryDate" TIMESTAMP,
    "ActualDeliveryDate" TIMESTAMP,
    "TotalAmount" DECIMAL(18,2) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "Notes" VARCHAR(500),
    "CreatedByUserId" INTEGER NOT NULL,
    "ApprovedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_PurchaseOrders_OrderNumber" ON "PurchaseOrders" ("OrderNumber");
CREATE INDEX IF NOT EXISTS "IX_PurchaseOrders_CreatedByUserId" ON "PurchaseOrders" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseOrders_ApprovedByUserId" ON "PurchaseOrders" ("ApprovedByUserId");

-- PurchaseItems Table
CREATE TABLE IF NOT EXISTS "PurchaseItems" (
    "Id" SERIAL PRIMARY KEY,
    "PurchaseOrderId" INTEGER NOT NULL,
    "ProductId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "Quantity" DECIMAL(18,2) NOT NULL,
    "UnitPrice" DECIMAL(18,2) NOT NULL,
    "TotalPrice" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "Notes" VARCHAR(200),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_PurchaseItems_PurchaseOrderId" ON "PurchaseItems" ("PurchaseOrderId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseItems_ProductId" ON "PurchaseItems" ("ProductId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseItems_WarehouseId" ON "PurchaseItems" ("WarehouseId");

-- SalesOrders Table
CREATE TABLE IF NOT EXISTS "SalesOrders" (
    "Id" SERIAL PRIMARY KEY,
    "OrderNumber" VARCHAR(50) NOT NULL,
    "CustomerName" VARCHAR(100),
    "CustomerAddress" VARCHAR(500),
    "CustomerPhone" VARCHAR(50),
    "CustomerEmail" VARCHAR(100),
    "OrderDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DeliveryDate" TIMESTAMP,
    "TotalAmount" DECIMAL(18,2) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "PaymentStatus" VARCHAR(20) NOT NULL,
    "Notes" VARCHAR(500),
    "CreatedByUserId" INTEGER NOT NULL,
    "ConfirmedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP,
    "CustomerId" INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_SalesOrders_OrderNumber" ON "SalesOrders" ("OrderNumber");
CREATE INDEX IF NOT EXISTS "IX_SalesOrders_CreatedByUserId" ON "SalesOrders" ("CreatedByUserId");
CREATE INDEX IF NOT EXISTS "IX_SalesOrders_ConfirmedByUserId" ON "SalesOrders" ("ConfirmedByUserId");
CREATE INDEX IF NOT EXISTS "IX_SalesOrders_CustomerId" ON "SalesOrders" ("CustomerId");

-- SalesItems Table
CREATE TABLE IF NOT EXISTS "SalesItems" (
    "Id" SERIAL PRIMARY KEY,
    "SalesOrderId" INTEGER NOT NULL,
    "ProductId" INTEGER NOT NULL,
    "WarehouseId" INTEGER NOT NULL,
    "Quantity" DECIMAL(18,2) NOT NULL,
    "UnitPrice" DECIMAL(18,2) NOT NULL,
    "TotalPrice" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "Notes" VARCHAR(200),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IX_SalesItems_SalesOrderId" ON "SalesItems" ("SalesOrderId");
CREATE INDEX IF NOT EXISTS "IX_SalesItems_ProductId" ON "SalesItems" ("ProductId");
CREATE INDEX IF NOT EXISTS "IX_SalesItems_WarehouseId" ON "SalesItems" ("WarehouseId");

-- ShoppingCarts Table
CREATE TABLE IF NOT EXISTS "ShoppingCarts" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "ProductId" INTEGER NOT NULL,
    "Quantity" DECIMAL(18,2) NOT NULL,
    "UnitPrice" DECIMAL(18,2) NOT NULL,
    "Unit" VARCHAR(50),
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("UserId", "ProductId")
);

CREATE INDEX IF NOT EXISTS "IX_ShoppingCarts_ProductId" ON "ShoppingCarts" ("ProductId");

-- OrderTrackings Table
CREATE TABLE IF NOT EXISTS "OrderTrackings" (
    "Id" SERIAL PRIMARY KEY,
    "OrderId" INTEGER NOT NULL,
    "Status" VARCHAR(50) NOT NULL,
    "Notes" VARCHAR(500),
    "Location" VARCHAR(100),
    "Timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedByUserId" INTEGER
);

CREATE INDEX IF NOT EXISTS "IX_OrderTrackings_OrderId" ON "OrderTrackings" ("OrderId");
CREATE INDEX IF NOT EXISTS "IX_OrderTrackings_UpdatedByUserId" ON "OrderTrackings" ("UpdatedByUserId");

-- ============================================
-- Create Foreign Keys
-- ============================================
-- Note: PostgreSQL doesn't support IF NOT EXISTS with ADD CONSTRAINT
-- So we use DO blocks to check if constraint exists first

-- Users foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Users_Warehouses_AssignedStoreId'
    ) THEN
        ALTER TABLE "Users" 
        ADD CONSTRAINT "FK_Users_Warehouses_AssignedStoreId" 
        FOREIGN KEY ("AssignedStoreId") REFERENCES "Warehouses" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- UserRoles foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_UserRoles_Users_UserId'
    ) THEN
        ALTER TABLE "UserRoles" 
        ADD CONSTRAINT "FK_UserRoles_Users_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_UserRoles_Roles_RoleId'
    ) THEN
        ALTER TABLE "UserRoles" 
        ADD CONSTRAINT "FK_UserRoles_Roles_RoleId" 
        FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

-- Products foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Products_Categories_CategoryId'
    ) THEN
        ALTER TABLE "Products" 
        ADD CONSTRAINT "FK_Products_Categories_CategoryId" 
        FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- Warehouses foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Warehouses_Users_ManagerUserId'
    ) THEN
        ALTER TABLE "Warehouses" 
        ADD CONSTRAINT "FK_Warehouses_Users_ManagerUserId" 
        FOREIGN KEY ("ManagerUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- AuditLogs foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_AuditLogs_Users_ActorUserId'
    ) THEN
        ALTER TABLE "AuditLogs" 
        ADD CONSTRAINT "FK_AuditLogs_Users_ActorUserId" 
        FOREIGN KEY ("ActorUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- ProductInventories foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductInventories_Products_ProductId'
    ) THEN
        ALTER TABLE "ProductInventories" 
        ADD CONSTRAINT "FK_ProductInventories_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductInventories_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "ProductInventories" 
        ADD CONSTRAINT "FK_ProductInventories_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

-- ProductMovements foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductMovements_Products_ProductId'
    ) THEN
        ALTER TABLE "ProductMovements" 
        ADD CONSTRAINT "FK_ProductMovements_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductMovements_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "ProductMovements" 
        ADD CONSTRAINT "FK_ProductMovements_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductMovements_Users_CreatedByUserId'
    ) THEN
        ALTER TABLE "ProductMovements" 
        ADD CONSTRAINT "FK_ProductMovements_Users_CreatedByUserId" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- ProductMovementSummaries foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductMovementSummaries_Products_ProductId'
    ) THEN
        ALTER TABLE "ProductMovementSummaries" 
        ADD CONSTRAINT "FK_ProductMovementSummaries_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductMovementSummaries_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "ProductMovementSummaries" 
        ADD CONSTRAINT "FK_ProductMovementSummaries_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- ProductAssemblies foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductAssemblies_Users_CreatedByUserId'
    ) THEN
        ALTER TABLE "ProductAssemblies" 
        ADD CONSTRAINT "FK_ProductAssemblies_Users_CreatedByUserId" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductAssemblies_Users_CompletedByUserId'
    ) THEN
        ALTER TABLE "ProductAssemblies" 
        ADD CONSTRAINT "FK_ProductAssemblies_Users_CompletedByUserId" 
        FOREIGN KEY ("CompletedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductAssemblies_Warehouses_StoreId'
    ) THEN
        ALTER TABLE "ProductAssemblies" 
        ADD CONSTRAINT "FK_ProductAssemblies_Warehouses_StoreId" 
        FOREIGN KEY ("StoreId") REFERENCES "Warehouses" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- BillOfMaterials foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_BillOfMaterials_ProductAssemblies_ProductAssemblyId'
    ) THEN
        ALTER TABLE "BillOfMaterials" 
        ADD CONSTRAINT "FK_BillOfMaterials_ProductAssemblies_ProductAssemblyId" 
        FOREIGN KEY ("ProductAssemblyId") REFERENCES "ProductAssemblies" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_BillOfMaterials_Products_RawProductId'
    ) THEN
        ALTER TABLE "BillOfMaterials" 
        ADD CONSTRAINT "FK_BillOfMaterials_Products_RawProductId" 
        FOREIGN KEY ("RawProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_BillOfMaterials_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "BillOfMaterials" 
        ADD CONSTRAINT "FK_BillOfMaterials_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- ProductRequests foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductRequests_Users_RequestedByUserId'
    ) THEN
        ALTER TABLE "ProductRequests" 
        ADD CONSTRAINT "FK_ProductRequests_Users_RequestedByUserId" 
        FOREIGN KEY ("RequestedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductRequests_Users_ApprovedByUserId'
    ) THEN
        ALTER TABLE "ProductRequests" 
        ADD CONSTRAINT "FK_ProductRequests_Users_ApprovedByUserId" 
        FOREIGN KEY ("ApprovedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductRequests_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "ProductRequests" 
        ADD CONSTRAINT "FK_ProductRequests_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- ProductRequestItems foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductRequestItems_ProductRequests_ProductRequestId'
    ) THEN
        ALTER TABLE "ProductRequestItems" 
        ADD CONSTRAINT "FK_ProductRequestItems_ProductRequests_ProductRequestId" 
        FOREIGN KEY ("ProductRequestId") REFERENCES "ProductRequests" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ProductRequestItems_Products_ProductId'
    ) THEN
        ALTER TABLE "ProductRequestItems" 
        ADD CONSTRAINT "FK_ProductRequestItems_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- PurchaseOrders foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseOrders_Users_CreatedByUserId'
    ) THEN
        ALTER TABLE "PurchaseOrders" 
        ADD CONSTRAINT "FK_PurchaseOrders_Users_CreatedByUserId" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseOrders_Users_ApprovedByUserId'
    ) THEN
        ALTER TABLE "PurchaseOrders" 
        ADD CONSTRAINT "FK_PurchaseOrders_Users_ApprovedByUserId" 
        FOREIGN KEY ("ApprovedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- PurchaseItems foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseItems_PurchaseOrders_PurchaseOrderId'
    ) THEN
        ALTER TABLE "PurchaseItems" 
        ADD CONSTRAINT "FK_PurchaseItems_PurchaseOrders_PurchaseOrderId" 
        FOREIGN KEY ("PurchaseOrderId") REFERENCES "PurchaseOrders" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseItems_Products_ProductId'
    ) THEN
        ALTER TABLE "PurchaseItems" 
        ADD CONSTRAINT "FK_PurchaseItems_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseItems_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "PurchaseItems" 
        ADD CONSTRAINT "FK_PurchaseItems_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- SalesOrders foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_SalesOrders_Customers_CustomerId'
    ) THEN
        ALTER TABLE "SalesOrders" 
        ADD CONSTRAINT "FK_SalesOrders_Customers_CustomerId" 
        FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_SalesOrders_Users_CreatedByUserId'
    ) THEN
        ALTER TABLE "SalesOrders" 
        ADD CONSTRAINT "FK_SalesOrders_Users_CreatedByUserId" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_SalesOrders_Users_ConfirmedByUserId'
    ) THEN
        ALTER TABLE "SalesOrders" 
        ADD CONSTRAINT "FK_SalesOrders_Users_ConfirmedByUserId" 
        FOREIGN KEY ("ConfirmedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- SalesItems foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_SalesItems_SalesOrders_SalesOrderId'
    ) THEN
        ALTER TABLE "SalesItems" 
        ADD CONSTRAINT "FK_SalesItems_SalesOrders_SalesOrderId" 
        FOREIGN KEY ("SalesOrderId") REFERENCES "SalesOrders" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_SalesItems_Products_ProductId'
    ) THEN
        ALTER TABLE "SalesItems" 
        ADD CONSTRAINT "FK_SalesItems_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_SalesItems_Warehouses_WarehouseId'
    ) THEN
        ALTER TABLE "SalesItems" 
        ADD CONSTRAINT "FK_SalesItems_Warehouses_WarehouseId" 
        FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT;
    END IF;
END $$;

-- ShoppingCarts foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ShoppingCarts_Users_UserId'
    ) THEN
        ALTER TABLE "ShoppingCarts" 
        ADD CONSTRAINT "FK_ShoppingCarts_Users_UserId" 
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_ShoppingCarts_Products_ProductId'
    ) THEN
        ALTER TABLE "ShoppingCarts" 
        ADD CONSTRAINT "FK_ShoppingCarts_Products_ProductId" 
        FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

-- OrderTrackings foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_OrderTrackings_SalesOrders_OrderId'
    ) THEN
        ALTER TABLE "OrderTrackings" 
        ADD CONSTRAINT "FK_OrderTrackings_SalesOrders_OrderId" 
        FOREIGN KEY ("OrderId") REFERENCES "SalesOrders" ("Id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_OrderTrackings_Users_UpdatedByUserId'
    ) THEN
        ALTER TABLE "OrderTrackings" 
        ADD CONSTRAINT "FK_OrderTrackings_Users_UpdatedByUserId" 
        FOREIGN KEY ("UpdatedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- Script Complete
-- ============================================
-- After running this script, your database schema will be ready
-- The application will automatically seed initial data on startup
-- ============================================
