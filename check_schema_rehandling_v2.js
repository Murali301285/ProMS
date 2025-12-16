const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);
        console.log("Checking Date Column...");
        const result = await sql.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblMaterialRehandling'
            AND COLUMN_NAME LIKE '%Date%'
        `);
        console.log("Date Columns:", result.recordset.map(c => c.COLUMN_NAME));

        console.log("Checking [Trans].[TblMaterialRehandlingShiftIncharge]...");
        const result2 = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblMaterialRehandlingShiftIncharge'
        `);
        console.table(result2.recordset);

        // Check specifically for Remarks
        const remarksCheck = result.recordset.find(c => c.COLUMN_NAME === 'Remarks');
        if (remarksCheck) {
            console.log("✅ Remarks column exists.");
        } else {
            console.log("❌ Remarks column MISSING.");
            // Suggest ADD query
            console.log("SUGGESTED QUERY: ALTER TABLE [Trans].[TblMaterialRehandling] ADD Remarks NVARCHAR(MAX);");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}

checkSchema();
