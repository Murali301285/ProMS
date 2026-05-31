const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function runCheck() {
    try {
        await sql.connect(config);
        console.log("Connected!");
        
        // 1. Total records count
        const total = await sql.query("SELECT COUNT(*) as count FROM [Trans].[TblLoading]");
        console.log("Total records in [Trans].[TblLoading]:", total.recordset[0].count);

        // 2. Active records count (IsDelete = 0)
        const active = await sql.query("SELECT COUNT(*) as count FROM [Trans].[TblLoading] WHERE IsDelete = 0");
        console.log("Active records (IsDelete = 0):", active.recordset[0].count);

        // 3. Date range check
        const range = await sql.query("SELECT MIN(LoadingDate) as minDate, MAX(LoadingDate) as maxDate FROM [Trans].[TblLoading] WHERE IsDelete = 0");
        console.log("LoadingDate range for active records:", range.recordset[0]);

        // 4. Sample active records
        const sample = await sql.query("SELECT TOP 5 SlNo, LoadingDate, IsDelete FROM [Trans].[TblLoading] WHERE IsDelete = 0 ORDER BY LoadingDate DESC");
        console.log("Sample active records:", sample.recordset);

        process.exit(0);
    } catch (e) {
        console.error("Failed:", e);
        process.exit(1);
    }
}

runCheck();
