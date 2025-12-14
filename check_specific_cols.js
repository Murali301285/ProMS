const { sql, getConnection } = require('./lib/db');

async function checkColumns() {
    try {
        const pool = await getConnection();

        const tables = ['TblSource', 'TblDestination', 'TblRelay', 'TblMaterial'];

        for (const table of tables) {
            console.log(`\n--- Checking ${table} ---`);
            try {
                // Using a safe query that returns column names even if empty
                const result = await pool.request().query(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = '${table}'
                `);

                if (result.recordset.length > 0) {
                    console.log(`Columns in [Master].[${table}]:`, result.recordset.map(r => r.COLUMN_NAME).join(', '));
                } else {
                    console.log(`Table [Master].[${table}] not found or has no columns.`);
                }
            } catch (err) {
                console.error(`Error querying ${table}:`, err.message);
            }
        }

    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
