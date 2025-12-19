const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);

        // 1. Check TblLoading Columns
        console.log("--- TblLoading Columns ---");
        const loadingCols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblLoading' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log(loadingCols.recordset.map(c => c.COLUMN_NAME).join(', '));

        // 2. Check TblEquipment Columns (for Models)
        console.log("\n--- TblEquipment Columns ---");
        const equipCols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblEquipment' AND TABLE_SCHEMA = 'Master'
        `);
        console.log(equipCols.recordset.map(c => c.COLUMN_NAME).join(', '));

        // 3. Check TblSource/Destination/Patch relationships?
        // Let's check TblPatch if it exists, or if Source has PatchId
        console.log("\n--- TblSource Columns ---");
        const sourceCols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblSource' AND TABLE_SCHEMA = 'Master'
        `);
        console.log(sourceCols.recordset.map(c => c.COLUMN_NAME).join(', '));

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkSchema();
