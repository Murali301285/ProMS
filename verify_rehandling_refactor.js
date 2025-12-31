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

        console.log('--- Checking Latest Material Rehandling API Join (Simulated) ---');
        // This simulates the query in /material-rehandling/latest/route.js
        const res = await sql.query(`
            SELECT TOP 1 
                T.RehandlingDate as Date, 
                T.CreatedBy,
                ISNULL(U.EmpName, 'Unknown') as CreatedByName
            FROM [Trans].[TblMaterialRehandling] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            WHERE T.isDelete = 0
            ORDER BY T.CreatedDate DESC
        `);
        console.table(res.recordset);

        console.log('--- Checking List Material Rehandling API Join (Simulated) ---');
        // This simulates the query in /material-rehandling/route.js
        const resList = await sql.query(`
            SELECT TOP 1 
                CU.EmpName AS CreatedByName,
                UU.EmpName AS UpdatedByName
            FROM [Trans].[TblMaterialRehandling] T
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            ORDER BY T.RehandlingDate DESC
        `);
        console.table(resList.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

verify();
