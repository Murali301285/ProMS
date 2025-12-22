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

async function applyTable() {
    try {
        const filePath = path.join(__dirname, 'ProMS_TblDrillingAgency.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Reading SQL file: ${filePath}`);

        await sql.connect(config);
        const request = new sql.Request();

        await request.query(sqlContent);

        await sql.close();
        console.log("Table Update Executed.");

    } catch (err) {
        console.error("Error applying Table:", err);
        process.exit(1);
    }
}

applyTable();
