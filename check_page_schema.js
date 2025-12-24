
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
    }
};

async function checkSchema() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        const res = await pool.request().query("SELECT TOP 1 * FROM [Master].[TblPage]");
        console.log("Columns:", Object.keys(res.recordset[0] || {}));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
