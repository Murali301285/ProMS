
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMSDev',
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
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblUser'
        `);

        if (tableCheck.recordset.length > 0) {
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
