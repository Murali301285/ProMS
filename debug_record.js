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

async function checkRecord() {
    try {
        await sql.connect(config);
        const id = 330429;
        console.log(`Checking Record ID: ${id}`);

        // 1. Check Main Table
        const res = await sql.query(`SELECT SlNo, IsDelete, LoadingDate FROM [Trans].[TblLoading] WHERE SlNo = ${id}`);

        if (res.recordset.length === 0) {
            console.log("❌ Record NOT FOUND in [Trans].[TblLoading].");
        } else {
            console.log("✅ Record FOUND:", res.recordset[0]);
            if (res.recordset[0].IsDelete) {
                console.warn("⚠️ Record is marked as DELETED (IsDelete=1)!");
            }
        }

        // 2. Check Incharges
        const resInc = await sql.query(`SELECT * FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = ${id}`);
        console.log(`Shift Incharges Found: ${resInc.recordset.length}`);
        console.log(resInc.recordset);

    } catch (e) {
        console.error("Query Failed:", e);
    } finally {
        await sql.close();
    }
}

checkRecord();
