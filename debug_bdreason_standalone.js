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

async function debugData() {
    try {
        console.log("Connecting to DB (ProdMS_live)...");
        const pool = await sql.connect(config);

        console.log("Querying [Master].[TblBDReason]...");
        const result = await pool.request().query(`
            SELECT SlNo, BDReasonName, IsActive, IsDelete 
            FROM [Master].[TblBDReason]
        `);

        console.table(result.recordset);
        process.exit(0);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

debugData();
