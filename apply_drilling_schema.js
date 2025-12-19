
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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
    },
};

async function applySchema() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");

        const sqlFilePath = path.join(__dirname, 'update_drilling_schema.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("Executing SQL...");
        await pool.request().query(sqlContent);
        console.log("SQL Executed Successfully.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

applySchema();
