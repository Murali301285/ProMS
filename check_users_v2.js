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

async function checkUsers() {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT TOP 5 SlNo, UserName, IsActive FROM Master.TblUser');
        console.log('Users:', result.recordset);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
