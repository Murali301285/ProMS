
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkOperatorSchema() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblOperator'
        `);
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkOperatorSchema();
