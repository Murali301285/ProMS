-- Create Equipment Owner Type Master
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblEquipmentOwnerType]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblEquipmentOwnerType](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [Type] [nvarchar](100) NOT NULL,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedBy] [int] NULL,
        [CreatedDate] [datetime] NULL DEFAULT GETDATE(),
        [UpdatedBy] [int] NULL,
        [UpdatedDate] [datetime] NULL,
        [IsDelete] [bit] NOT NULL DEFAULT 0,
        CONSTRAINT [PK_TblEquipmentOwnerType] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    )
END
GO

-- Add Columns to Equipment Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' AND COLUMN_NAME = 'PMSCode')
BEGIN
    ALTER TABLE [Master].[TblEquipment] ADD [PMSCode] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' AND COLUMN_NAME = 'VendorCode')
BEGIN
    ALTER TABLE [Master].[TblEquipment] ADD [VendorCode] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' AND COLUMN_NAME = 'OwnerTypeId')
BEGIN
    ALTER TABLE [Master].[TblEquipment] ADD [OwnerTypeId] INT NULL;
    
    -- Add Foreign Key if needed
    ALTER TABLE [Master].[TblEquipment]  WITH CHECK ADD  CONSTRAINT [FK_TblEquipment_OwnerType] FOREIGN KEY([OwnerTypeId])
    REFERENCES [Master].[TblEquipmentOwnerType] ([SlNo])
    
    ALTER TABLE [Master].[TblEquipment] CHECK CONSTRAINT [FK_TblEquipment_OwnerType]
END
GO
