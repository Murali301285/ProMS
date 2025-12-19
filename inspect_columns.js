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
        const tableName = process.argv[2] || 'TblMenuMaster';
        const schema = process.argv[3] || 'dbo'; // Optional schema support if needed, though MS SQL often handles unique table names. Better to filter if passed.
        // Actually usually TABLE_SCHEMA is useful.
        // Let's just filter by TableName for now.
        const result = await pool.request().query(`SELECT TABLE_SCHEMA, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`);
        console.log(`Columns for ${tableName}:`);
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('SQL Error:', err);
        process.exit(1);
    }
}

run();
