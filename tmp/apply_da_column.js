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

async function applyColumn() {
    try {
        const filePath = path.join(__dirname, 'add_drilling_agency_column.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Reading SQL file: ${filePath}`);

        await sql.connect(config);
        const request = new sql.Request();

        await request.query(sqlContent);

        await sql.close();
        console.log("Column Alteration Executed.");

    } catch (err) {
        console.error("Error applying column:", err);
        process.exit(1);
    }
}

applyColumn();
