USE [ProdMS_live]
GO

/****** Object:  Table [Master].[TblStoppageReason]    Script Date: 08-12-2025 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblStoppageReason]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblStoppageReason](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [ReasonName] [nvarchar](250) NULL,
        [Category] [nvarchar](100) NULL, -- e.g., Mechanical, Electrical
        [Remarks] [nvarchar](max) NULL,
        [CreatedBy] [int] NULL,
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [int] NULL,
        [UpdatedDate] [datetime] NULL,
        [IsDelete] [bit] NOT NULL DEFAULT 0,
        [Active] [bit] NOT NULL DEFAULT 1,
     CONSTRAINT [PK_TblStoppageReason] PRIMARY KEY CLUSTERED 
    (
        [SlNo] ASC
    )
    ) ON [PRIMARY];
    
    ALTER TABLE [Master].[TblStoppageReason]  WITH CHECK ADD  CONSTRAINT [FK_TblStoppageReason_TblUser] FOREIGN KEY([CreatedBy])
    REFERENCES [Master].[TblUser] ([SlNo]);
    
    ALTER TABLE [Master].[TblStoppageReason]  WITH CHECK ADD  CONSTRAINT [FK_TblStoppageReason_TblUser1] FOREIGN KEY([UpdatedBy])
    REFERENCES [Master].[TblUser] ([SlNo]);
    
    PRINT 'Table [Master].[TblStoppageReason] Created Successfully';
END
ELSE
BEGIN
    PRINT 'Table [Master].[TblStoppageReason] Already Exists';
END
GO
