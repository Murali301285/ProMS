IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Master')
BEGIN
    EXEC('CREATE SCHEMA [Master]')
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblParty' AND schema_id = SCHEMA_ID('Master'))
BEGIN
    CREATE TABLE [Master].[tblParty] (
        [SlNo] INT IDENTITY(1,1) PRIMARY KEY,
        [PartyName] VARCHAR(100) NOT NULL,
        [Remarks] VARCHAR(250) NULL,
        [isActive] BIT NOT NULL DEFAULT 1,
        [isDelete] BIT NOT NULL DEFAULT 0,
        [CreatedBy] VARCHAR(100) NOT NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedBy] VARCHAR(100) NULL,
        [UpdatedDate] DATETIME NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TblBDSEntry' AND schema_id = SCHEMA_ID('Trans'))
BEGIN
    CREATE TABLE [Trans].[TblBDSEntry] (
        [SlNo] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Date] DATETIME NOT NULL,
        [PartyId] INT NOT NULL FOREIGN KEY REFERENCES [Master].[tblParty](SlNo),
        [VehicleNo] VARCHAR(50) NOT NULL,
        [Weighment] DECIMAL(18,3) NOT NULL,
        [CounterReading] DECIMAL(18,3) NOT NULL,
        [LoadingSheet] DECIMAL(18,3) NOT NULL,
        [StandardDeduction] DECIMAL(18,3) NOT NULL,
        [AcceptedQuantity] DECIMAL(18,3) NOT NULL,
        [ChallanNo] VARCHAR(50) NULL,
        [Remarks] VARCHAR(250) NULL,
        [CreatedBy] VARCHAR(100) NOT NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedBy] VARCHAR(100) NULL,
        [UpdatedDate] DATETIME NULL,
        [isDelete] BIT NOT NULL DEFAULT 0
    );
END
GO
