
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa',
    password: 'Chennai@42', // Using password from previous context
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function runSqlFile() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Please provide a SQL file path.");
        process.exit(1);
    }

    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        console.log(`Executing SQL from ${filePath}...`);

        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");

        const result = await pool.request().query(sqlContent);

        console.log("\n--- Results ---");
        if (result.recordset) {
            console.table(result.recordset);
        } else {
            console.log("Command executed successfully (No result set).");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

runSqlFile();
