
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

async function checkOperatorSchema() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking TblOperator Columns ---");
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblOperator'
        `);
        console.table(res.recordset);

        // Also check Child Table column type
        console.log("\n--- Checking TblEquipmentReadingOperator Columns ---");
        const res2 = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblEquipmentReadingOperator'
        `);
        console.table(res2.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperatorSchema();
