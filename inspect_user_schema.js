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
        const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblUser'");
        console.log(JSON.stringify(result.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('SQL Error:', err);
        process.exit(1);
    }
}

run();
