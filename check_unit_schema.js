const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function checkSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to DB.");

        console.log("Checking [Master].[TblUnit] columns...");
        const result1 = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblUnit' AND TABLE_SCHEMA = 'Master'");
        if (result1.recordset.length === 0) {
            console.log("❌ Table [Master].[TblUnit] NOT FOUND!");
        } else {
            console.log("Columns found:", result1.recordset.map(row => row.COLUMN_NAME).join(', '));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkSchema();
