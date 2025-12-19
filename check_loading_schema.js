
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

async function checkLoadingSchema() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoading'
        `);
        console.table(res.recordset);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkLoadingSchema();
