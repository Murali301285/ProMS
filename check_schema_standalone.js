const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live', // Defaulting to live
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function checkSchema() {
    console.log("--- STANDALONE SCHEMA CHECK ---");
    try {
        await sql.connect(config);
        console.log("Connected.");

        const query = `
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' 
            AND TABLE_NAME IN ('TblEquipmentGroup', 'TblMaterial', 'table_not_found')
        `;
        const result = await sql.query(query);
        const rows = result.recordset;

        const eqGroupCols = rows.filter(r => r.TABLE_NAME === 'TblEquipmentGroup').map(r => r.COLUMN_NAME);
        const matCols = rows.filter(r => r.TABLE_NAME === 'TblMaterial').map(r => r.COLUMN_NAME);

        console.log("\n[TblEquipmentGroup Columns]:", eqGroupCols.sort());
        console.log("Has IsQtyTripMapping:", eqGroupCols.includes('IsQtyTripMapping'));

        console.log("\n[TblMaterial Columns]:", matCols.sort());
        console.log("Has MaterialName:", matCols.includes('MaterialName'));
        console.log("Has Name:", matCols.includes('Name'));

    } catch (e) {
        console.error("Schema Check Error:", e);
    } finally {
        await sql.close();
    }
    console.log("--- END ---");
}

checkSchema();
