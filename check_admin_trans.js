
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        await sql.connect(config);

        // 1. Get Admin User ID
        const userRes = await sql.query`SELECT SlNo FROM [Master].[TblUser_New] WHERE UserName = 'admin'`;
        const userId = userRes.recordset[0]?.SlNo;
        console.log("Admin User ID:", userId);

        if (!userId) {
            console.log("User 'admin' not found.");
            return;
        }

        // 2. Check Transactions
        const transRes = await sql.query`SELECT TOP 5 * FROM [Trans].[TblLoading] WHERE CreatedBy = ${userId} OR UpdatedBy = ${userId} ORDER BY CreatedDate DESC`;
        console.log("Found Transactions:", transRes.recordset.length);
        if (transRes.recordset.length > 0) {
            console.log("Top 1 Transaction:", transRes.recordset[0]);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

check();
