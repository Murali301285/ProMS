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

        console.log('--- Checking Latest Electrical Entry Join ---');
        // This simulates the query in /latest/route.js
        const res = await sql.query(`
            SELECT TOP 1 
                T.Date, 
                T.CreatedBy,
                ISNULL(U.EmpName, 'Unknown') as CreatedByName, 
                T.CreatedDate
            FROM [Trans].[TblElectricalEntry] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            WHERE T.IsDelete = 0
            ORDER BY T.SlNo DESC
        `);
        console.table(res.recordset);

        console.log('--- Checking List Join ---');
        // This simulates the query in /list/route.js
        const resList = await sql.query(`
            SELECT TOP 3
                T.SlNo,
                T.CreatedBy,
                ISNULL(U1.EmpName, 'Unknown') as CreatedByName,
                T.UpdatedBy,
                ISNULL(U2.EmpName, 'Unknown') as UpdatedByName
            FROM [Trans].[TblElectricalEntry] T
            LEFT JOIN [Master].[TblUser_New] U1 ON T.CreatedBy = U1.SlNo
            LEFT JOIN [Master].[TblUser_New] U2 ON T.UpdatedBy = U2.SlNo
            WHERE T.IsDelete = 0
            ORDER BY T.CreatedDate DESC
        `);
        console.table(resList.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

verify();
