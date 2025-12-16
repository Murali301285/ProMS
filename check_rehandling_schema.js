const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live', // Assuming this is the default DB
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function checkSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to DB.");

        console.log("Checking [Trans].[TblMaterialRehandling] columns...");
        const result1 = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblMaterialRehandling' AND TABLE_SCHEMA = 'Trans'");
        if (result1.recordset.length === 0) {
            console.log("❌ Table [Trans].[TblMaterialRehandling] NOT FOUND!");
        } else {
            console.log("Columns found:", result1.recordset.map(row => row.COLUMN_NAME).join(', '));
        }

        console.log("\nChecking [Trans].[TblMaterialRehandlingShiftIncharge] columns...");
        const result2 = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblMaterialRehandlingShiftIncharge' AND TABLE_SCHEMA = 'Trans'");
        if (result2.recordset.length === 0) {
            console.log("❌ Table [Trans].[TblMaterialRehandlingShiftIncharge] NOT FOUND!");
        } else {
            console.log("Columns found:", result2.recordset.map(row => row.COLUMN_NAME).join(', '));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkSchema();
