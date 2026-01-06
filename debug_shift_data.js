
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function checkShifts() {
    try {
        console.log("Connecting to DB:", config.server, config.database);
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");

        console.log("Querying [Master].[TblShift]...");
        const result = await pool.request().query(`
            SELECT SlNo, ShiftName, IsActive, IsDelete 
            FROM [Master].[TblShift]
        `);
        console.log("Total Shifts Found:", result.recordset.length);
        console.table(result.recordset);

        pool.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkShifts();
