
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const sqlFilePath = "C:\\Users\\mural\\.gemini\\antigravity\\brain\\d7a6fe38-d63e-4356-a1af-5496e29551cb\\fix_rehandling_reading_fks.sql";

async function run() {
    try {
        console.log("Connecting to DB...");
        await sql.connect(config);

        console.log("Reading SQL file:", sqlFilePath);
        const query = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("Executing Migration...");
        const res = await sql.query(query);
        console.log("Migration Output:", res); // Output usually empty for DDL/updates in trans
        console.log("Done.");

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        await sql.close();
    }
}

run();
