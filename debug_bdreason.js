const { getDbConnection } = require('./lib/db');

async function debugData() {
    try {
        const pool = await getDbConnection();
        console.log("Connected to DB. Querying [Master].[TblBDReason]...");

        const result = await pool.request().query(`
            SELECT SlNo, BDReasonName, IsActive, IsDelete 
            FROM [Master].[TblBDReason]
        `);

        console.table(result.recordset);

    } catch (err) {
        console.error("Error:", err);
    }
}

debugData();
