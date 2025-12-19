
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live', // Default DB, might need parameterized
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function addColumn() {
    try {
        console.log('Connecting to database...');
        let pool = await sql.connect(config);

        const query = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblCrusher]') AND name = 'Remarks')
            BEGIN
                ALTER TABLE [Trans].[TblCrusher] ADD Remarks NVARCHAR(MAX) NULL;
                PRINT 'Column Remarks added successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Column Remarks already exists.';
            END
        `;

        await pool.request().query(query);
        console.log('Query executed.');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

addColumn();
