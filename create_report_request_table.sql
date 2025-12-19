IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblReportRequest')
BEGIN
    CREATE TABLE [Trans].[TblReportRequest] (
        [SlNo] INT IDENTITY(1,1) PRIMARY KEY,
        [ReportType] NVARCHAR(100) NOT NULL,
        [Criteria] NVARCHAR(MAX) NOT NULL, -- JSON string of filters (From/To)
        [Status] NVARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
        [ArtifactPath] NVARCHAR(500), -- Path to saved JSON/Excel file
        [RequestedBy] INT, -- UserId
        [RequestedDate] DATETIME DEFAULT GETDATE(),
        [CompletedDate] DATETIME,
        [ErrorMessage] NVARCHAR(MAX),
        [IsDelete] BIT DEFAULT 0
    );
END
GO
