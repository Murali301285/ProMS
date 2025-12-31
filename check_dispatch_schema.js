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
        console.log("Checking [Trans].[TblDispatchEntry]...");
        const cols = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblDispatchEntry' 
            AND TABLE_SCHEMA = 'Trans'
            AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy')
        `);
        console.table(cols.recordset);

        const data = await sql.query(`SELECT TOP 1 CreatedBy FROM [Trans].[TblDispatchEntry]`);
        console.table(data.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
