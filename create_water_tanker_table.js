
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function createTable() {
    try {
        console.log('Connecting...');
        const pool = await new sql.ConnectionPool(config).connect();

        console.log('Creating Schema [Transaction] if needed...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Transaction')
            BEGIN
                EXEC('CREATE SCHEMA [Transaction]')
            END
        `);

        console.log('Creating [Transaction].[TblWaterTankerEntry]...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Transaction].[TblWaterTankerEntry]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [Transaction].[TblWaterTankerEntry](
                    [SlNo] [int] IDENTITY(1,1) NOT NULL,
                    [ShiftId] [int] NOT NULL,
                    [DestinationId] [int] NOT NULL, -- FK to Master.tblFillingPoint
                    [HaulerId] [int] NOT NULL, -- FK to Master.tblEquipment
                    [FillingPointId] [int] NOT NULL, -- FK to Master.tblFillingPoint
                    [FillingPumpId] [int] NOT NULL, -- FK to Master.tblFillingPump
                    [NoOfTrip] [int] NOT NULL,
                    [TotalQty] [decimal](18, 3) NOT NULL,
                    [Remarks] [varchar](250) NULL,
                    [EntryDate] [date] NOT NULL,
                    [IsDelete] [bit] NULL DEFAULT ((0)),
                    [CreatedBy] [varchar](100) NOT NULL,
                    [CreatedDate] [datetime] NOT NULL DEFAULT (getdate()),
                    [UpdatedBy] [varchar](100) NULL,
                    [UpdatedDate] [datetime] NULL,
                 CONSTRAINT [PK_TblWaterTankerEntry] PRIMARY KEY CLUSTERED ([SlNo] ASC)
                );
                
                -- Add Foreign Keys (Optional but good practice, skipping strict constraints for now to avoid dependency errors if tables missing, 
                -- but logic implies they exist. Will rely on app logic or add separate script for FKs if needed).
                -- Actually, let's just create the table first.
                
                PRINT 'Table created successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Table already exists.';
            END
        `);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createTable();
