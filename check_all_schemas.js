
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

async function checkAll() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        const tables = ['[Master].[TblModule]', '[Master].[TblMenuAllocation]', '[Master].[TblRoleAuthorization_New]'];

        for (const t of tables) {
            console.log(`--- ${t} ---`);
            const res = await pool.request().query(`SELECT TOP 0 * FROM ${t}`);
            console.log(Object.keys(res.recordset.columns).join(', '));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkAll();
