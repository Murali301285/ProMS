IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblDrillingAgency]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblDrillingAgency](
        [SlNo] [int] IDENTITY(1,1) NOT NULL,
        [AgencyName] [varchar](100) NOT NULL,
        [Remarks] [varchar](500) NULL,
        [IsActive] [bit] DEFAULT 1,
        [IsDelete] [bit] DEFAULT 0,
        [CreatedBy] [int] NULL,
        [CreatedDate] [datetime] DEFAULT GETDATE(),
        [UpdatedBy] [int] NULL,
        [UpdatedDate] [datetime] NULL,
        CONSTRAINT [PK_TblDrillingAgency] PRIMARY KEY CLUSTERED 
        (
            [SlNo] ASC
        )
    )

    -- Add Unique Constraint
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[UQ_DrillingAgency_Name]') AND type = 'UQ')
    BEGIN
        ALTER TABLE [Master].[TblDrillingAgency] ADD CONSTRAINT [UQ_DrillingAgency_Name] UNIQUE ([AgencyName])
    END
    
    PRINT 'Table TblDrillingAgency Created Successfully'
END
ELSE
BEGIN
    PRINT 'Table TblDrillingAgency Already Exists'
END
