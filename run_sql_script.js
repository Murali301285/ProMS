
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
        const query = fs.readFileSync('alter_crusher_shiftincharge.sql', 'utf8');
        await sql.connect(config);
        await sql.query(query);
        console.log("Schema update executed successfully.");
        await sql.close();
    } catch (err) {
        console.error("Error executing script:", err);
    }
}

runScript();
