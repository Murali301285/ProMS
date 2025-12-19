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
    },
};

const createTableQuery = `
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Trans].[TblElectricalEntry]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Trans].[TblElectricalEntry] (
        [SlNo] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Date] DATETIME NOT NULL,
        [ShiftId] INT NOT NULL,
        [RelayId] INT NULL,
        [EquipmentId] INT NOT NULL,
        [OMR] DECIMAL(18,3) NOT NULL,
        [CMR] DECIMAL(18,3) NOT NULL,
        [TotalUnit] DECIMAL(18,3) NOT NULL,
        [UnitId] INT NOT NULL,
        [Remarks] VARCHAR(250) NULL,
        [CreatedBy] VARCHAR(100) NOT NULL,
        [CreatedDate] DATETIME DEFAULT GETDATE(),
        [UpdatedBy] VARCHAR(100) NULL,
        [UpdatedDate] DATETIME NULL,
        [IsDelete] BIT DEFAULT 0,
        CONSTRAINT [FK_ElectricalEntry_Shift] FOREIGN KEY ([ShiftId]) REFERENCES [Master].[TblShift]([SlNo]),
        CONSTRAINT [FK_ElectricalEntry_Relay] FOREIGN KEY ([RelayId]) REFERENCES [Master].[TblRelay]([SlNo]),
        CONSTRAINT [FK_ElectricalEntry_Equipment] FOREIGN KEY ([EquipmentId]) REFERENCES [Master].[TblEquipment]([SlNo]),
        CONSTRAINT [FK_ElectricalEntry_Unit] FOREIGN KEY ([UnitId]) REFERENCES [Master].[TblUnit]([SlNo])
    );
    PRINT 'Table [Trans].[TblElectricalEntry] created.';
END
ELSE
BEGIN
    PRINT 'Table [Trans].[TblElectricalEntry] already exists.';
END
`;

async function setupDB() {
    try {
        console.log("Connecting to DB...");
        const pool = await sql.connect(config);
        console.log("Running Schema Script...");
        await pool.request().query(createTableQuery);
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

setupDB();
