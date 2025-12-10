import sql from 'mssql';

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

async function checkUsers() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected. Checking Master.TblUser...");

        const result = await pool.request().query(`
            SELECT SlNo, UserName FROM [Master].[TblUser]
        `);
        console.table(result.recordset);
        pool.close();
    } catch (err) {
        console.error(err);
    }
}

checkUsers();
