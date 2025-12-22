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

async function applyMenu() {
    try {
        const filePath = path.join(__dirname, 'add_drilling_agency_menu.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Reading SQL file: ${filePath}`);

        await sql.connect(config);
        const request = new sql.Request();

        const batches = sqlContent.split(/^GO\s*$/m).filter(b => b.trim().length > 0);

        for (const batch of batches) {
            console.log("Executing batch...");
            await request.query(batch);
            console.log("Batch executed successfully.");
        }

        await sql.close();
        console.log("Menu Updated Successfully.");

    } catch (err) {
        console.error("Error applying Menu:", err);
        process.exit(1);
    }
}

applyMenu();
