
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkBDSchema() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT TOP 1 * FROM [Master].[TblBDReason]
        `);
        if (result.recordset.length > 0) {
            console.log("Columns:", Object.keys(result.recordset[0]));
        } else {
            // Get columns from schema if table empty
            const cols = await sql.query(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TblBDReason' AND TABLE_SCHEMA='Master'
            `);
            console.log("Columns (Schema):", cols.recordset.map(c => c.COLUMN_NAME));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkBDSchema();
