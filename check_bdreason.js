
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

async function checkTable() {
    try {
        await sql.connect(config);
        const tableCheck = await sql.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblBDReason'
        `);

        if (tableCheck.recordset.length > 0) {
            console.log("Table Found: true");
            console.log("Columns:", tableCheck.recordset.map(r => r.COLUMN_NAME));
        } else {
            console.log("Table Found: false");
        }
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkTable();
