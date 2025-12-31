
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function verifyRecentList() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        // Simulating the exact parameters that should be passed
        const userId = 1; // Assuming 'admin' which we saw has SlNo 1
        const date = null; // Testing without date first to match "load all recent"

        console.log(`Testing with UserID: ${userId}`);

        let query = `
            SELECT TOP 10
                t.SlNo,
                t.Date,
                t.CreatedBy,
                u.UserName as CreatedByUser
            FROM [Trans].[TblDrilling] t
            LEFT JOIN [Master].[TblUser_New] u ON t.CreatedBy = u.SlNo
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
            ORDER BY t.CreatedDate DESC
        `;

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(query);

        console.table(result.recordset);

        if (result.recordset.length === 0) {
            console.log("No records found! Checking raw table data without filter...");
            const raw = await pool.request().query(`
                SELECT TOP 5 SlNo, CreatedBy, UpdatedBy FROM [Trans].[TblDrilling] ORDER BY CreatedDate DESC
            `);
            console.table(raw.recordset);
        }

        pool.close();
    } catch (err) {
        console.error("Verification Failed:", err);
    }
}

verifyRecentList();
