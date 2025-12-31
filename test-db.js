const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// 1. Manually Parse .env file (to avoid 'dotenv' dependency)
// ...// Hardcoded for Quick Verification (User's Local Config)
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: '127.0.0.1', // Trying Direct IP to rule out DNS/Instance issues
    // If this works, your SQL instance is listening on 1433 but Hostname resolution failed.
    // If this FAILS, your SQL instance is NOT listening on TCP 1433.
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

console.log("-----------------------------------------");
console.log("Testing Connection to: ProMS2_test");
console.log("-----------------------------------------");

async function testConnection() {
    try {
        if (!config.password) {
            throw new Error("DB_PASSWORD is missing in .env");
        }

        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("✅ SUCCESS! Connected to SQL Server.");

        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log("Database Version:");
        console.log(result.recordset[0].version);

        pool.close();
    } catch (err) {
        console.error("❌ CONNECTION FAILED!");
        console.error("Error Code:", err.code);
        console.error("Message:", err.message);
        if (err.originalError) {
            console.error("Original Error:", err.originalError.message);
        }
    }
}

testConnection();
