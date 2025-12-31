
const sql = require('mssql');
const fs = require('fs');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function runScript() {
    try {
        const scriptName = process.argv[2];
        if (!scriptName) {
            console.error("Please provide a SQL file name.");
            process.exit(1);
        }
        const query = fs.readFileSync(scriptName, 'utf8');
        await sql.connect(config);
        await sql.query(query);
        console.log("Schema update executed successfully.");
        await sql.close();
    } catch (err) {
        console.error("Error executing script:", err);
    }
}

runScript();
