
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function createTable() {
    try {
        await sql.connect(config);

        const query = `
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Trans].[TblCrusherStoppage]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [Trans].[TblCrusherStoppage](
                    [SlNo] [int] IDENTITY(1,1) NOT NULL,
                    [CrusherId] [int] NOT NULL,
                    [FromTime] [time](7) NULL,
                    [ToTime] [time](7) NULL,
                    [StoppageId] [int] NULL,
                    [StoppageHours] [decimal](18, 3) NULL,
                    [Remarks] [nvarchar](max) NULL,
                 CONSTRAINT [PK_TblCrusherStoppage] PRIMARY KEY CLUSTERED 
                (
                    [SlNo] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
                ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
                
                ALTER TABLE [Trans].[TblCrusherStoppage]  WITH CHECK ADD  CONSTRAINT [FK_TblCrusherStoppage_TblCrusher] FOREIGN KEY([CrusherId])
                REFERENCES [Trans].[TblCrusher] ([SlNo])
                
                ALTER TABLE [Trans].[TblCrusherStoppage] CHECK CONSTRAINT [FK_TblCrusherStoppage_TblCrusher]
                
                PRINT 'Table TblCrusherStoppage created successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Table TblCrusherStoppage already exists.';
            END
        `;

        await sql.query(query);
        console.log("Migration executed.");

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await sql.close();
    }
}

createTable();
