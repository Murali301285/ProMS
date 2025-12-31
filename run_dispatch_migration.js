const { getDbConnection, sql } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log("Starting Dispatch Entry Migration...");
    let pool;
    try {
        pool = await getDbConnection();
        const migrationFile = path.join(__dirname, 'migration_dispatch_users.sql');
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');

        console.log("Executing SQL...");
        await pool.request().query(migrationSql);
        console.log("Migration script executed.");

        // Verification
        console.log("Verifying Schema...");
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TblDispatchEntry' AND TABLE_SCHEMA = 'Trans'
            AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy')
        `);
        console.table(result.recordset);

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        process.exit();
    }
}

runMigration();
