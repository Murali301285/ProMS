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

async function run() {
    try {
        await sql.connect(config);
        const res = await sql.query("SELECT TOP 1 * FROM [Master].[TblBDReason]");
        if (res.recordset.length > 0) {
            console.log("Columns:", Object.keys(res.recordset[0]));
        } else {
            console.log("Table empty, checking schema...");
            const schema = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblBDReason'");
            console.log(schema.recordset.map(r => r.COLUMN_NAME));
        }
    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

run();
