const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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
        const filePath = process.argv[2];
        if (!filePath) {
            console.error("Please provide a SQL file path.");
            process.exit(1);
        }

        const absolutePath = path.resolve(filePath);
        console.log(`Executing SQL from: ${absolutePath}`);

        const pool = await sql.connect(config);
        const script = fs.readFileSync(absolutePath, 'utf8');
        const statements = script.split('GO');

        for (const stmt of statements) {
            if (stmt.trim()) {
                await pool.request().query(stmt);
                console.log('Executed block');
            }
        }
        console.log('All statements executed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('SQL Error:', err);
        process.exit(1);
    }
}

run();
