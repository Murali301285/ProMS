
const { getDbConnection } = require('./lib/db');

async function checkSchema() {
    try {
        const pool = await getDbConnection();

        console.log("--- Checking TblEquipmentReading Columns ---");
        const res1 = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblEquipmentReading'
        `);
        console.table(res1.recordset);

        console.log("\n--- Checking Child Tables Existence ---");
        const res2 = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE 'TblEquipmentReading%'
        `);
        console.table(res2.recordset);

        console.log("\n--- Checking Data in TblEquipmentReading (Top 1) ---");
        const res3 = await pool.request().query(`
            SELECT TOP 1 * FROM [Trans].[TblEquipmentReading] ORDER BY SlNo DESC
        `);
        console.log(res3.recordset[0]);

        console.log("\n--- Checking Data in Child Tables (Top 5) ---");
        try {
            const res4 = await pool.request().query(`
                SELECT TOP 5 * FROM [Trans].[TblEquipmentReadingShiftIncharge]
            `);
            console.log("Incharge Child Data:", res4.recordset);
        } catch (e) { console.log("Incharge Child Table Error:", e.message); }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
