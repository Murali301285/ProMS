
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

async function listAllColumns() {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher'
        `);
        console.log(result.recordset.map(r => r.COLUMN_NAME));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

listAllColumns();
