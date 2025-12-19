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

async function checkDependencies() {
    try {
        await sql.connect(config);

        console.log("--- Checking Function GetShiftInchargeName ---");
        const func = await sql.query(`
            SELECT ROUTINE_NAME 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE='FUNCTION' AND ROUTINE_NAME='GetShiftInchargeName'
        `);
        console.log("Function Exists:", func.recordset.length > 0);

        console.log("\n--- Checking Table TblEquipmentReading ---");
        const tbl = await sql.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'TblEquipmentReading'
        `);
        console.log("Table Exists:", tbl.recordset.length > 0);

        console.log("\n--- Checking Table TblSector & TblPatch ---");
        const extras = await sql.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('TblSector', 'TblPatch')
        `);
        console.log("Tables Found:", extras.recordset.map(r => r.TABLE_NAME));

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkDependencies();
