USE [ProdMS_Test];
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Master')
BEGIN
    EXEC('CREATE SCHEMA [Master]');
END
GO

-- Helper to create standard master table
-- We will write out each table explicitly to avoid dynamic SQL complexity in a script meant for manual run

-- 1. TblCompany (Already Exists usually, but ensuring)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblCompany]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblCompany](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [CompanyName] [nvarchar](100) NOT NULL,
        [GstNo] [nvarchar](50) NULL,
        [Address] [nvarchar](max) NULL,
        [CompanyLogo] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 2. TblActivity
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblActivity]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblActivity](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ActivityName] [nvarchar](100) NOT NULL,
        [ActivityCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 3. TblDepthSlab
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblDepthSlab]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblDepthSlab](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [SlabName] [nvarchar](100) NOT NULL,
        [MinDepth] [decimal](18,2) NULL,
        [MaxDepth] [decimal](18,2) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 4. TblDestination
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblDestination]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblDestination](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [DestinationName] [nvarchar](100) NOT NULL,
        [DestinationCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 5. TblDestinationMaterialMapping (Mapping Table)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblDestinationMaterialMapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblDestinationMaterialMapping](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [DestinationId] [int] NULL, -- FK to TblDestination
        [MaterialId] [int] NULL,    -- FK to TblMaterial
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 6. TblEntryType
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblEntryType]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblEntryType](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [EntryTypeName] [nvarchar](100) NOT NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 7. TblEquipmentGroup
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblEquipmentGroup]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblEquipmentGroup](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [GroupName] [nvarchar](100) NOT NULL,
        [GroupCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 8. TblEquipment
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblEquipment]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblEquipment](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [EquipmentName] [nvarchar](100) NOT NULL,
        [EqCode] [nvarchar](50) NULL,
        [GroupId] [int] NULL, -- FK to TblEquipmentGroup
        [Type] [nvarchar](50) NULL,
        [Capacity] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 9. TblLocation
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblLocation]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblLocation](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [LocationName] [nvarchar](100) NOT NULL,
        [LocCode] [nvarchar](50) NULL,
        [Type] [nvarchar](50) NULL,
        [Description] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 10. TblMaterial
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblMaterial]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblMaterial](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MaterialName] [nvarchar](100) NOT NULL,
        [MatCode] [nvarchar](50) NULL,
        [Type] [nvarchar](50) NULL,
        [Unit] [nvarchar](20) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 11. TblMethod
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblMethod]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblMethod](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MethodName] [nvarchar](100) NOT NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 12. TblOperator
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblOperator]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblOperator](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [OperatorName] [nvarchar](100) NOT NULL,
        [EmpCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 13. TblPatch
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblPatch]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblPatch](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [PatchName] [nvarchar](100) NOT NULL,
        [Description] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 14. TblPlant
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblPlant]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblPlant](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [PlantName] [nvarchar](100) NOT NULL,
        [PlantCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 15. TblQtyTripMapping
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblQtyTripMapping]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblQtyTripMapping](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MappingName] [nvarchar](100) NOT NULL, -- Logical name for the rule
        [Qty] [decimal](18,2) NULL,
        [TripType] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 16. TblRelay
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblRelay]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblRelay](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [RelayName] [nvarchar](100) NOT NULL,
        [StartTime] [time] NULL,
        [EndTime] [time] NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 17. TblScale
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblScale]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblScale](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ScaleName] [nvarchar](100) NOT NULL,
        [IpAddress] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 18. TblSector
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblSector]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblSector](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [SectorName] [nvarchar](100) NOT NULL,
        [SectorCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 19. TblShift
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblShift]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblShift](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ShiftName] [nvarchar](100) NOT NULL,
        [StartTime] [time] NULL,
        [EndTime] [time] NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 20. TblShiftIncharge
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblShiftIncharge]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblShiftIncharge](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [InchargeName] [nvarchar](100) NOT NULL,
        [EmpCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 21. TblSMESupplier
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblSMESupplier]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblSMESupplier](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [SupplierName] [nvarchar](100) NOT NULL,
        [GstNo] [nvarchar](50) NULL,
        [Address] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 22. TblSource
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblSource]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblSource](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [SourceName] [nvarchar](100) NOT NULL,
        [SourceCode] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 23. TblStoppageReason (Requested specifically)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblStoppageReason]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblStoppageReason](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Reason] [nvarchar](200) NOT NULL,
        [Category] [nvarchar](50) NULL, -- e.g. Mechanical, Operational
        [Code] [nvarchar](50) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 24. TblStrata
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblStrata]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblStrata](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [StrataName] [nvarchar](100) NOT NULL,
        [Description] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- 25. TblUnit
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblUnit]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblUnit](
        [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [UnitName] [nvarchar](50) NOT NULL, -- e.g. Kg, Ton, Ltr
        [Description] [nvarchar](100) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0
    );
END
GO

-- =============================================
-- REGISTER PAGES IN TblPage (So they appear in Menu Allocation)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblPage]') AND type in (N'U'))
BEGIN
    INSERT INTO [Master].[TblPage] (PageName, PagePath, CreatedBy)
    SELECT NewPages.PageName, NewPages.PagePath, 'System'
    FROM (VALUES 
        ('Activity', '/dashboard/master/activity'),
        ('Depth Slab', '/dashboard/master/depth-slab'),
        ('Destination', '/dashboard/master/destination'),
        ('Dest-Material Map', '/dashboard/master/destination-material-mapping'),
        ('Entry Type', '/dashboard/master/entry-type'),
        ('Equipment Group', '/dashboard/master/equipment-group'),
        ('Equipment', '/dashboard/master/equipment'), -- might exist
        ('Location', '/dashboard/master/location'), -- might exist
        ('Material', '/dashboard/master/material'), -- might exist
        ('Method', '/dashboard/master/method'),
        ('Operator', '/dashboard/master/operator'),
        ('Patch', '/dashboard/master/patch'),
        ('Plant', '/dashboard/master/plant'),
        ('Qty/Trip Map', '/dashboard/master/qty-trip-mapping'),
        ('Relay', '/dashboard/master/relay'),
        ('Scale', '/dashboard/master/scale'),
        ('Sector', '/dashboard/master/sector'),
        ('Shift', '/dashboard/master/shift'),
        ('Shift Incharge', '/dashboard/master/shift-incharge'),
        ('SME Supplier', '/dashboard/master/sme-supplier'),
        ('Source', '/dashboard/master/source'),
        ('Stoppage Reason', '/dashboard/master/stoppage-reason'),
        ('Strata', '/dashboard/master/strata'),
        ('Unit', '/dashboard/master/unit')
    ) AS NewPages(PageName, PagePath)
    WHERE NOT EXISTS (SELECT 1 FROM [Master].[TblPage] p WHERE p.PagePath = NewPages.PagePath);
END
GO
