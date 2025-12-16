const { getDbConnection, sql } = require('./lib/db');

async function checkCols() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblLoadingShiftIncharge' 
            AND TABLE_SCHEMA = 'Trans'
        `);
        console.log("Columns:", result.recordset.map(r => r.COLUMN_NAME));
    } catch (e) {
        console.error(e);
    }
}

checkCols();
