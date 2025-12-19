
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

        // Check if table exists
        const tableCheck = await sql.query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher'
        `);

        if (tableCheck.recordset.length === 0) {
            console.log("TABLE_NOT_FOUND");
            process.exit(0);
        }

        // List columns
        const result = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher'
        `);

        console.log("COLUMNS:", JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await sql.close();
    }
}

checkSchema();
