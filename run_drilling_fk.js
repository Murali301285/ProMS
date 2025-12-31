
const { executeQuery } = require('./lib/audit'); // Using audit lib for simpler execution if available, or just fs read

const fs = require('fs');
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function runScript() {
    try {
        const script = fs.readFileSync('C:/Users/mural/.gemini/antigravity/brain/d7a6fe38-d63e-4356-a1af-5496e29551cb/fix_drilling_fk.sql', 'utf8');
        console.log("Running Migration...");

        const pool = await new sql.ConnectionPool(config).connect();
        await pool.request().query(script);
        console.log("Migration Complete.");
        pool.close();
    } catch (err) {
        console.error("Migration Failed:", err);
    }
}

runScript();
