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
        const filePath = path.join(__dirname, 'ProMS2_SPReportCrusherStoppageCumulative.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        console.log(`Reading SQL file: ${filePath}`);

        // Connect
        await sql.connect(config);
        const request = new sql.Request();

        // Check for GO statements (simple split, usually sufficient for SP scripts)
        // If the script creates a procedure, it should be the only batch or carefully handled.
        // The file has CREATE OR ALTER which is one batch.

        // Remove 'GO' from the end if exists/split
        const batches = sqlContent.split(/^GO\s*$/m).filter(b => b.trim().length > 0);

        for (const batch of batches) {
            console.log("Executing batch...");
            await request.query(batch);
            console.log("Batch executed successfully.");
        }

        await sql.close();
        console.log("SP Updated Successfully.");

    } catch (err) {
        console.error("Error applying SP:", err);
        process.exit(1);
    }
}

applySP();
