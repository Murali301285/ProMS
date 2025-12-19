const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM [Master].[TblMenuMaster] WHERE MenuId = 27");
        console.log(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('SQL Error:', err);
        process.exit(1);
    }
}

run();
