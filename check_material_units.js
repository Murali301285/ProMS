
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live', // Default, might need adjustment
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        console.log("Connecting...");
        let pool = await sql.connect(config);
        console.log("Connected.");

        let result = await pool.request().query('SELECT TOP 1 * FROM [Trans].[TblBlasting]');
        console.log("Materials Found:", result.recordset.length);
        console.log(result.recordset);

        pool.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

check();
