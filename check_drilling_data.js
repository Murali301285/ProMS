

// Since I can't rely on lib/db working in standalone script easily due to imports
// I will use pure mssql approach again to be safe.

const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live', // User mentioned ProdMS_live before
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function checkData() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- TblUser_New (First 5) ---");
        const users = await pool.request().query(`SELECT TOP 5 SlNo, UserName FROM [Master].[TblUser_New]`);
        console.table(users.recordset);

        console.log("\n--- TblDrilling (First 5 CreatedBy) ---");
        const drilling = await pool.request().query(`
            SELECT TOP 5 t.SlNo, t.Date, t.CreatedBy, t.UpdatedBy, u.UserName as JoinUserName
            FROM [Trans].[TblDrilling] t
            LEFT JOIN [Master].[TblUser_New] u ON t.CreatedBy = u.SlNo
            ORDER BY t.CreatedDate DESC
        `);
        console.table(drilling.recordset);

        pool.close();
    } catch (err) {
        console.error("Check Failed:", err);
    }
}

checkData();
