const { getDbConnection, sql } = require('./lib/db');

async function checkDispatchData() {
    try {
        const pool = await getDbConnection();

        // Check for non-numeric values
        const result = await pool.request().query(`
            SELECT DISTINCT CreatedBy 
            FROM [Trans].[TblDispatchEntry] 
            WHERE ISNUMERIC(CreatedBy) = 0
            UNION
            SELECT DISTINCT UpdatedBy 
            FROM [Trans].[TblDispatchEntry] 
            WHERE ISNUMERIC(UpdatedBy) = 0 AND UpdatedBy IS NOT NULL
        `);

        console.log("Non-numeric values found:", result.recordset);

        // Check Schema
        const schema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TblDispatchEntry' AND TABLE_SCHEMA = 'Trans'
            AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy')
        `);
        console.table(schema.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkDispatchData();
