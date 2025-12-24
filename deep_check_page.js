
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

async function deepCheck() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        const res = await pool.request().query(`
            SELECT name, system_type_id, user_type_id, max_length, is_computed 
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('[Master].[TblPage]')
        `);
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
deepCheck();
