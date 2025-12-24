
const { getDbConnection } = require('./lib/db');

(async () => {
    try {
        const pool = await getDbConnection();
        // Check if column exists
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
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
})();
