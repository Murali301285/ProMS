
-- =============================================
-- SQL Script to Create Test Database and Copy Schema
-- =============================================

-- 1. Create ProdMS_Test if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ProdMS_Test')
BEGIN
    CREATE DATABASE [ProdMS_Test];
END
GO

USE [ProdMS_Test];
GO

-- 2. Create Schema [Master] if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Master')
BEGIN
    EXEC('CREATE SCHEMA [Master]');
END
GO

-- 3. Create Basic Tables (Just the essentials for Login to work initially)
-- Note: In a real scenario, you'd script out the entire schema. 
-- For now, we replicate TblUser, TblRole, and TblDbConfig so we can log in.

-- TblRole
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblRole]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblRole](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [RoleName] [varchar](50) NULL,
        [IsActive] [bit] NULL,
        [IsDelete] [bit] NULL,
        CONSTRAINT [PK_TblRole] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
    INSERT INTO [Master].[TblRole] (RoleName, IsActive, IsDelete) VALUES ('Admin', 1, 0);
END
GO

-- TblUser
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblUser]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblUser](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [UserName] [varchar](50) NULL,
        [Password] [varchar](200) NULL, -- Encrypted
        [RoleId] [int] NULL,
        [IsActive] [bit] NULL,
        [IsDelete] [bit] NULL,
        CONSTRAINT [PK_TblUser] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
    -- Insert 'admin' / 'Tsmpl#0011' (Encrypted: 4U8924cXYkUADX8dj5rbfg==)
    INSERT INTO [Master].[TblUser] (UserName, Password, RoleId, IsActive, IsDelete) 
    VALUES ('admin', '4U8924cXYkUADX8dj5rbfg==', 1, 1, 0);
END
GO

-- TblDbConfig (Should exist in all DBs if we want to switch *from* any DB)
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
