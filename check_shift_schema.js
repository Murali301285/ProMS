
const { getDbConnection } = require('./lib/db');

async function checkShiftSchema() {
    try {
        const pool = await getDbConnection();
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblShift'
        `);
        console.table(res.recordset);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkShiftSchema();
