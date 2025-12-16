
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

async function checkShiftSchema() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblShift'
        `);
        console.table(res.recordset);

        // Check data to see format
        const data = await pool.request().query('SELECT TOP 1 * FROM [Master].[TblShift]');
        console.log(data.recordset[0]);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkShiftSchema();
