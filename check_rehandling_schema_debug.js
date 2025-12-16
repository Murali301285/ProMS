const { getDbConnection } = require('./lib/db');

async function checkSchema() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query("SELECT TOP 0 * FROM [Trans].[TblMaterialRehandling]");
        console.log("Cols:", Object.keys(result.recordset.columns));
    } catch (e) {
        console.error("Error:", e);
    }
}
checkSchema();
