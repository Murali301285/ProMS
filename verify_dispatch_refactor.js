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

        console.log('--- Checking Latest Dispatch Entry Join (Simulated) ---');
        // This simulates the query in /latest/route.js
        const res = await sql.query(`
            SELECT TOP 1 
                T.Date, 
                T.CreatedBy,
                ISNULL(U.EmpName, 'Unknown') as CreatedByName, 
                T.CreatedDate
            FROM [Trans].[TblDispatchEntry] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            WHERE T.IsDelete = 0
            ORDER BY T.CreatedDate DESC
        `);
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

verify();
