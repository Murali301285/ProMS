
-- TblAuditLog
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblAuditLog]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblAuditLog](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [Action] [varchar](50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
        [TableName] [varchar](100) NOT NULL,
        [RecordId] [varchar](50) NULL, -- Key of the record affected
        [OldValue] [nvarchar](max) NULL, -- JSON or text representation
        [NewValue] [nvarchar](max) NULL,
        [ActionBy] [varchar](50) NOT NULL,
        [ActionDate] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_TblAuditLog] PRIMARY KEY CLUSTERED ([SlNo] ASC)
    );
END
GO
