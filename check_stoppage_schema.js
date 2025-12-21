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

async function checkSchema() {
    try {
        await sql.connect(config);
        const tableCheck = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusherStoppage'
        `);

        if (tableCheck.recordset.length > 0) {
            console.log("Columns:", tableCheck.recordset);
        } else {
            console.log("Table not found");
        }
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkSchema();
