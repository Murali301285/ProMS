
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

async function debug() {
    try {
        await sql.connect(config);

        console.log("--- User Info ---");
        const users = await sql.query("SELECT SlNo, UserName FROM [Master].[TblUser_New]");
        console.table(users.recordset);

        const admin = users.recordset.find(u => u.UserName === 'admin');
        const adminId = admin ? admin.SlNo : 'NOT FOUND';
        console.log(`Admin ID: ${adminId}`);

        console.log("\n--- Top 10 Loading Transactions ---");
        const trans = await sql.query(`
            SELECT TOP 10 SlNo, LoadingDate, CreatedBy, UpdatedBy, CreatedDate 
            FROM [Trans].[TblLoading] 
            ORDER BY CreatedDate DESC
        `);
        console.table(trans.recordset);

        if (adminId !== 'NOT FOUND') {
            console.log(`\n--- Checking for Admin (ID ${adminId}) ---`);
            const adminTrans = await sql.query(`
                SELECT COUNT(*) as Count, MAX(LoadingDate) as LastDate
                FROM [Trans].[TblLoading]
                WHERE CreatedBy = ${adminId} OR UpdatedBy = ${adminId}
            `);
            console.log(adminTrans.recordset[0]);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

debug();
