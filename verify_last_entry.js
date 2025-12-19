
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

async function verifyLastEntry() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("Executing Last Entry Query...");
        const query = `
            SELECT TOP 1 
                T.Date, 
                U.UserName AS CreatedByName
            FROM [Trans].[TblDrilling] T
            LEFT JOIN [Master].[TblUser] U ON T.CreatedBy = U.SlNo
            ORDER BY T.SlNo DESC
        `;

        const result = await pool.request().query(query);
        console.log("Result:", result.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

verifyLastEntry();
