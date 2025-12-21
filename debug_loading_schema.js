const { getDbConnection, sql } = require('./lib/db');

async function checkSchema() {
    try {
        const pool = await getDbConnection();

        console.log("--- TblLoading Columns ---");
        const res1 = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblLoading' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log(res1.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log("\n--- Activity Map ---");
        const res2 = await pool.request().query(`SELECT * FROM Master.TblActivity`);
        console.table(res2.recordset);

    } catch (err) {
        console.error(err);
    }
}

checkSchema();
