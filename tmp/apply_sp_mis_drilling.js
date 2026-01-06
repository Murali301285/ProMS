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

async function applySP() {
    try {
        const filePath = path.join(__dirname, 'create_sp_mis_drilling.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Reading SQL file: ${filePath}`);

        await sql.connect(config);
        const request = new sql.Request();

        // Split by GO if necessary, but CREATE PROCEDURE usually needs to be in its own batch or handled correctly.
        // tedious/mssql driver can handle Create Procedure if it's the only statement.
        await request.query(sqlContent);

        await sql.close();
        console.log("Stored Procedure Created Successfully.");

    } catch (err) {
        console.error("Error creating SP:", err);
        process.exit(1);
    }
}

applySP();
