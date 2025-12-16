const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkUsers() {
    try {
        await sql.connect(config);
        console.log("Checking Master.TblUser IDs...");
        const result = await sql.query(`SELECT TOP 5 SlNo, UserName FROM [Master].[TblUser]`);
        console.log("Valid Users:", JSON.stringify(result.recordset, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}

checkUsers();
