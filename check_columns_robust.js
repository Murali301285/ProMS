const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live', // Switch to ProdMS_live
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function checkColumns() {
    try {
        await sql.connect(config);
        const tables = ['TblQtyTripMapping', 'TblOperator', 'TblEquipment'];

        for (const table of tables) {
            console.log(`\nTABLE: ${table}`);
            const result = await sql.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = '${table}'
            `);
            if (result.recordset.length === 0) {
                console.log("  (Table not found or no columns)");
            } else {
                console.log(result.recordset.map(r => r.COLUMN_NAME).join(', '));
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkColumns();
