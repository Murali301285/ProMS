
-- =============================================
-- 1. Database Configuration Table (For Switching DBs)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblDbConfig]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblDbConfig](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [DbName] [nvarchar](100) NOT NULL UNIQUE, 
        [DisplayName] [nvarchar](200) NOT NULL,   
        [Environment] [nvarchar](50) NOT NULL,    
        [Remarks] [nvarchar](max) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [UpdatedDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblDbConfig] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
    
    -- Insert Default Data
    INSERT INTO [Master].[TblDbConfig] 
    (DbName, DisplayName, Environment, Remarks, CreatedBy, UpdatedBy, UpdatedDate)
    VALUES 
    ('ProdMS_live', 'Live Production Data (Current)', 'Live', 'Default Live Database', 'System', 'System', GETDATE()),
    ('ProdMS_Test', 'Testing Environment', 'Test', 'Sandbox for testing', 'System', 'System', GETDATE()),
    ('ProdMS_2024', 'FY 2024-2025 (Old)', 'Old', 'Archived Data', 'System', 'System', GETDATE());
END
GO

-- =============================================
-- 2. Menu Allocation System Tables
-- =============================================

-- A. Modules (Top Level: Master, Transactions, Reports, etc.)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblModule]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblModule](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [ModuleName] [nvarchar](100) NOT NULL,
        [Icon] [nvarchar](50) NULL, 
        [SortOrder] [int] DEFAULT 0,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [UpdatedDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblModule] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );

    INSERT INTO [Master].[TblModule] (ModuleName, Icon, SortOrder, CreatedBy, UpdatedBy, UpdatedDate) VALUES 
    ('Dashboard', 'Home', 1, 'System', 'System', GETDATE()),
    ('Master', 'Database', 2, 'System', 'System', GETDATE()),
    ('Authorization', 'ShieldCheck', 3, 'System', 'System', GETDATE()),
    ('Transactions', 'Truck', 4, 'System', 'System', GETDATE()),
    ('Reports', 'FileText', 5, 'System', 'System', GETDATE());
END
GO

-- B. Sub Groups (User Defined Groupings inside Modules)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblSubGroup]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblSubGroup](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [SubGroupName] [nvarchar](100) NOT NULL,
        [ModuleId] [int] REFERENCES [Master].[TblModule](SlNo),
        [SortOrder] [int] DEFAULT 0,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [UpdatedDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblSubGroup] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
    
    INSERT INTO [Master].[TblSubGroup] (SubGroupName, ModuleId, SortOrder, CreatedBy, UpdatedBy, UpdatedDate) 
    SELECT 'Entry', SlNo, 1, 'System', 'System', GETDATE() 
    FROM [Master].[TblModule] WHERE ModuleName = 'Master';
END
GO

-- C. Pages (Actual Application Pages)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblPage]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblPage](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [PageName] [nvarchar](100) NOT NULL, 
        [PagePath] [nvarchar](200) NOT NULL, 
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [UpdatedDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblPage] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );

    INSERT INTO [Master].[TblPage] (PageName, PagePath, CreatedBy, UpdatedBy, UpdatedDate) VALUES 
    ('Company', '/dashboard/master/company', 'System', 'System', GETDATE()),
    ('Equipment', '/dashboard/master/equipment', 'System', 'System', GETDATE()),
    ('Material', '/dashboard/master/material', 'System', 'System', GETDATE()),
    ('Location', '/dashboard/master/location', 'System', 'System', GETDATE());
END
GO

-- D. Menu Allocation (Mapping: Module -> SubGroup? -> Page)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblMenuAllocation]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblMenuAllocation](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [ModuleId] [int] NOT NULL REFERENCES [Master].[TblModule](SlNo),
        [SubGroupId] [int] NULL REFERENCES [Master].[TblSubGroup](SlNo), 
        [PageId] [int] NOT NULL REFERENCES [Master].[TblPage](SlNo),
        [SortOrder] [int] DEFAULT 0,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [varchar](50) NOT NULL DEFAULT 'System',
        [UpdatedDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblMenuAllocation] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
    
    INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, CreatedBy, UpdatedBy, UpdatedDate)
    SELECT m.SlNo, sg.SlNo, p.SlNo, 1, 'System', 'System', GETDATE()
    FROM [Master].[TblModule] m
    JOIN [Master].[TblSubGroup] sg ON m.SlNo = sg.ModuleId AND sg.SubGroupName = 'Entry'
    JOIN [Master].[TblPage] p ON p.PageName = 'Company'
    WHERE m.ModuleName = 'Master';

    INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, CreatedBy, UpdatedBy, UpdatedDate)
    SELECT m.SlNo, NULL, p.SlNo, 2, 'System', 'System', GETDATE()
    FROM [Master].[TblPage] p
    JOIN [Master].[TblModule] m ON m.ModuleName = 'Master'
    WHERE p.PageName = 'Equipment';
END
GO
