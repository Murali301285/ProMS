const { getDbConnection } = require('./lib/db');

async function checkData() {
    try {
        const pool = await getDbConnection();
        const res = await pool.request().query(`
            SELECT TOP 10 SlNo, Date, OperatorId, CAST(OperatorId AS VARCHAR(MAX)) as OpStr
            FROM Trans.TblEquipmentReading 
            ORDER BY SlNo DESC
        `);
        console.table(res.recordset);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
