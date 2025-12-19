
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

async function checkStrataSchema() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking TblStrata Columns ---");
        const res1 = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblStrata'
        `);
        console.table(res1.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkStrataSchema();
