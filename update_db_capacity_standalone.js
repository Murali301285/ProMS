
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

(async () => {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");

        const check = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Transaction' 
            AND TABLE_NAME = 'TblWaterTankerEntry' 
            AND COLUMN_NAME = 'Capacity'
        `);

        if (check.recordset.length === 0) {
            console.log("Adding Capacity column...");
            await pool.request().query(`
                ALTER TABLE [Transaction].[TblWaterTankerEntry] 
                ADD Capacity Decimal(18,3) NULL
            `);
            console.log("Capacity column added successfully.");
        } else {
            console.log("Capacity column already exists.");
        }

        await pool.close();
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
})();
