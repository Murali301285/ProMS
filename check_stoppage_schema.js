
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

async function checkStoppageSchema() {
    try {
        await sql.connect(config);
        console.log("Checking TblCrusherStoppage schema...");
        const result = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusherStoppage'
        `);
        console.table(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkStoppageSchema();
