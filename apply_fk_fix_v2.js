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
        trustServerCertificate: true
    }
};

async function applyFixV2() {
    try {
        const filePath = path.join(__dirname, 'fix_crusher_fk_v2.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Reading SQL file: ${filePath}`);

        await sql.connect(config);
        const request = new sql.Request();

        await request.query(sqlContent);

        await sql.close();
        console.log("FK Fix V2 Executed.");

    } catch (err) {
        console.error("Error applying fix V2:", err);
        process.exit(1);
    }
}

applyFixV2();
