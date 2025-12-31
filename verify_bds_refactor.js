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

        console.log('--- Checking Latest BDS Entry Join (Simulated) ---');
        // This simulates the query in /latest/route.js
        const res = await sql.query(`
            SELECT TOP 1 
                t.Date, 
                t.CreatedBy, 
                ISNULL(U.EmpName, 'Unknown') as CreatedByName
            FROM [Trans].[TblBDSEntry] t
            LEFT JOIN [Master].[TblUser_New] U ON t.CreatedBy = U.SlNo
            WHERE t.isDelete = 0
            ORDER BY t.CreatedDate DESC
        `);
        console.table(res.recordset);

        console.log('--- Checking List BDS Entry Join (Simulated) ---');
        // This simulates the query in /list/route.js
        const resList = await sql.query(`
            SELECT TOP 1
                t.SlNo,
                t.CreatedBy,
                ISNULL(UC.EmpName, 'Unknown') as CreatedByName
            FROM [Trans].[TblBDSEntry] t
            LEFT JOIN [Master].[TblUser_New] UC ON t.CreatedBy = UC.SlNo
            ORDER BY t.CreatedDate DESC
        `);
        console.table(resList.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

verify();
