
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
        const scriptPath = 'C:/Users/mural/.gemini/antigravity/brain/d7a6fe38-d63e-4356-a1af-5496e29551cb/drop_old_drilling_fk.sql';
        if (!fs.existsSync(scriptPath)) {
            console.error("Script file not found:", scriptPath);
            return;
        }
        const script = fs.readFileSync(scriptPath, 'utf8');
        console.log("Running SQL...");

        const pool = await new sql.ConnectionPool(config).connect();
        await pool.request().query(script);
        console.log("SQL Complete.");
        pool.close();
    } catch (err) {
        console.error("SQL Failed:", err);
    }
}

runScript();
