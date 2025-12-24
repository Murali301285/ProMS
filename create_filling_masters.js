
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

async function createTables() {
    try {
        console.log('Connecting to database...');
        const pool = await new sql.ConnectionPool(config).connect();

        console.log('Creating tblFillingPoint...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[tblFillingPoint]') AND type in (N'U'))
            BEGIN
            CREATE TABLE [Master].[tblFillingPoint](
                [SlNo] [int] IDENTITY(1,1) NOT NULL,
                [FillingPoint] [varchar](100) NOT NULL,
                [Remarks] [varchar](250) NULL,
                [IsActive] [bit] NULL DEFAULT ((1)),
                [IsDelete] [bit] NULL DEFAULT ((0)),
                [CreatedBy] [varchar](100) NOT NULL DEFAULT ('Admin'),
                [CreatedDate] [datetime] NOT NULL DEFAULT (getdate()),
                [UpdatedBy] [varchar](100) NULL,
                [UpdatedDate] [datetime] NULL,
             CONSTRAINT [PK_tblFillingPoint] PRIMARY KEY CLUSTERED ([SlNo] ASC),
             CONSTRAINT [UQ_FillingPoint] UNIQUE NONCLUSTERED ([FillingPoint] ASC)
            )
            END;
        `);

        console.log('Creating tblFillingPump...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[tblFillingPump]') AND type in (N'U'))
            BEGIN
            CREATE TABLE [Master].[tblFillingPump](
                [SlNo] [int] IDENTITY(1,1) NOT NULL,
                [FillingPump] [varchar](100) NOT NULL,
                [Remarks] [varchar](250) NULL,
                [IsActive] [bit] NULL DEFAULT ((1)),
                [IsDelete] [bit] NULL DEFAULT ((0)),
                [CreatedBy] [varchar](100) NOT NULL DEFAULT ('Admin'),
                [CreatedDate] [datetime] NOT NULL DEFAULT (getdate()),
                [UpdatedBy] [varchar](100) NULL,
                [UpdatedDate] [datetime] NULL,
             CONSTRAINT [PK_tblFillingPump] PRIMARY KEY CLUSTERED ([SlNo] ASC),
             CONSTRAINT [UQ_FillingPump] UNIQUE NONCLUSTERED ([FillingPump] ASC)
            )
            END;
        `);

        console.log('Tables created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Table creation failed:', err);
        process.exit(1);
    }
}

createTables();
