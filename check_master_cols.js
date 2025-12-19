
const sql = require('mssql');
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkColumns() {
    try {
        await sql.connect(config);

        console.log("--- TblBDReason Columns ---");
        const bdCols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblBDReason'
        `);
        console.log(bdCols.recordset.map(r => r.COLUMN_NAME));

        console.log("\n--- TblShift Columns ---");
        const shiftCols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblShift'
        `);
        console.log(shiftCols.recordset.map(r => r.COLUMN_NAME));

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkColumns();
