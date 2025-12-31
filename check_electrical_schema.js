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

async function check() {
    try {
        await sql.connect(config);

        console.log('--- Top 5 Electrical Entries ---');
        const entries = await sql.query(`SELECT TOP 5 SlNo, CreatedBy, UpdatedBy FROM [Transaction].[TblElectricalEntry]`);
        console.table(entries.recordset);

        const cols = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblElectricalEntry' 
            AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy')
        `);
        console.table(cols.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
