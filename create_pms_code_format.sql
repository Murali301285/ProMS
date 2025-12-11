IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[PMSCodeFormat]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[PMSCodeFormat](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [TableName] [nvarchar](255) NOT NULL,
        [FieldName] [nvarchar](100) NOT NULL,
        [Prefix] [nvarchar](50) NOT NULL,
        [NoOfDigit] [int] NOT NULL,
        [Remarks] [nvarchar](500) NULL,
        CONSTRAINT [PK_PMSCodeFormat] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    )
END
GO

-- Insert default configuration for Equipment PMSCode
IF NOT EXISTS (SELECT * FROM [Master].[PMSCodeFormat] WHERE TableName = '[Master].[TblEquipment]' AND FieldName = 'PMSCode')
BEGIN
    INSERT INTO [Master].[PMSCodeFormat] (TableName, FieldName, Prefix, NoOfDigit, Remarks)
    VALUES ('[Master].[TblEquipment]', 'PMSCode', '2', 7, '2000000')
END
GO
