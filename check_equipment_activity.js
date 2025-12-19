
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

async function checkEquipment() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking TblEquipment Columns ---");
        const res1 = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment'
            AND COLUMN_NAME = 'ActivityId'
        `);
        if (res1.recordset.length > 0) {
            console.log("ActivityId Column Exists.");
            // Check if we have data with ActivityId = 7
            const res2 = await pool.request().query(`
                SELECT COUNT(*) as Count FROM [Master].[TblEquipment] WHERE ActivityId = 7
            `);
            console.log(`Equipments with ActivityId=7: ${res2.recordset[0].Count}`);
        } else {
            console.log("ActivityId Column DOES NOT Exist!");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkEquipment();
