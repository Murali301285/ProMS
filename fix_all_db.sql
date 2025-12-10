
-- 1. Create TblAuditLog (Required for Settings CRUD)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblAuditLog]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblAuditLog](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [Action] [varchar](50) NOT NULL,
        [TableName] [varchar](100) NOT NULL,
        [RecordId] [varchar](50) NULL,
        [OldValue] [nvarchar](max) NULL,
        [NewValue] [nvarchar](max) NULL,
        [ActionBy] [varchar](50) NOT NULL,
        [ActionDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblAuditLog] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
END
GO

-- 2. Ensure TblPage Exists
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
