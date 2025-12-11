
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblSMECategory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblSMECategory](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [Category] [nvarchar](100) NOT NULL,
        [Remarks] [varchar](500) NULL,
        [IsDelete] [bit] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedDate] [datetime] NOT NULL DEFAULT GETDATE(),
        [CreatedBy] [varchar](50) NULL,
        [UpdatedBy] [varchar](50) NULL,
        [UpdatedDate] [datetime] NULL,
        CONSTRAINT [PK_TblSMECategory] PRIMARY KEY CLUSTERED ([SlNo] ASC),
        CONSTRAINT [UQ_TblSMECategory_Category] UNIQUE NONCLUSTERED ([Category] ASC)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblDrillingRemarks]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblDrillingRemarks](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [DrillingRemarks] [nvarchar](100) NOT NULL,
        [Remarks] [varchar](500) NULL,
        [IsDelete] [bit] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedDate] [datetime] NOT NULL DEFAULT GETDATE(),
        [CreatedBy] [varchar](50) NULL,
        [UpdatedBy] [varchar](50) NULL,
        [UpdatedDate] [datetime] NULL,
        CONSTRAINT [PK_TblDrillingRemarks] PRIMARY KEY CLUSTERED ([SlNo] ASC),
        CONSTRAINT [UQ_TblDrillingRemarks_DrillingRemarks] UNIQUE NONCLUSTERED ([DrillingRemarks] ASC)
    );
END
GO
