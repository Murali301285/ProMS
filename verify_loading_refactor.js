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

async function verify() {
    try {
        await sql.connect(config);

        console.log('--- Checking Last Entry Info Loading From Mines (Simulated) ---');
        // This simulates the query in /transaction/helper/last-entry-info/route.js
        const res = await sql.query(`
            SELECT TOP 1 
                T.LoadingDate, 
                 ISNULL(U.EmpName, 'Unknown') AS CreatedByName
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            ORDER BY T.SlNo DESC
        `);
        console.table(res.recordset);

        console.log('--- Checking List API Loading From Mines (Simulated) ---');
        // This simulates the query in /loading-from-mines/route.js
        const resList = await sql.query(`
            SELECT TOP 1 
                CU.EmpName AS CreatedByName,
                UU.EmpName AS UpdatedByName
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            ORDER BY T.LoadingDate DESC
        `);
        console.table(resList.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

verify();
