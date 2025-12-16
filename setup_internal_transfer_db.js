const sql = require('mssql');
// Hardcoded config to be sure
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function setupDB() {
    try {
        console.log("Connecting to DB:", config.server, config.database);
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");

        console.log("Creating [Trans].[TblInternalTransfer]...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Trans].[TblInternalTransfer]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [Trans].[TblInternalTransfer](
                    [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [TransferDate] [date] NOT NULL,
                    [ShiftId] [int] NOT NULL,
                    [ManPowerInShift] [int] NULL,
                    [RelayId] [int] NULL,
                    [SourceId] [int] NOT NULL,
                    [DestinationId] [int] NOT NULL,
                    [MaterialId] [int] NOT NULL,
                    [HaulerEquipmentId] [int] NULL,
                    [LoadingMachineEquipmentId] [int] NULL,
                    [NoofTrip] [int] NULL,
                    [QtyTrip] [decimal](18, 2) NULL,
                    [UnitId] [int] DEFAULT 1,
                    [TotalQty] [decimal](18, 2) NULL,
                    [Remarks] [nvarchar](max) NULL,
                    [CreatedBy] [int] NULL,
                    [CreatedDate] [datetime] DEFAULT GETDATE(),
                    [UpdatedBy] [int] NULL,
                    [UpdatedDate] [datetime] NULL,
                    [IsDelete] [bit] DEFAULT 0
                );
                PRINT 'Table [Trans].[TblInternalTransfer] Created.';
            END
            ELSE
            BEGIN
                PRINT 'Table [Trans].[TblInternalTransfer] already exists.';
            END
        `);

        console.log("Creating [Trans].[TblInternalTransferIncharge]...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Trans].[TblInternalTransferIncharge]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [Trans].[TblInternalTransferIncharge](
                    [SlNo] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    [TransferId] [int] NOT NULL,
                    [OperatorId] [int] NOT NULL
                );
                PRINT 'Table [Trans].[TblInternalTransferIncharge] Created.';
            END
            ELSE
            BEGIN
                PRINT 'Table [Trans].[TblInternalTransferIncharge] already exists.';
            END
        `);

        pool.close();
        console.log("Done.");
    } catch (err) {
        console.error("Error executing setup:", err);
    }
}

setupDB();
