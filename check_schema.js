const { executeQuery } = require('./lib/db');

async function checkSchema() {
    console.log("--- SCHEMA CHECK ---");
    try {
        const query = `
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' 
            AND TABLE_NAME IN ('TblEquipmentGroup', 'TblMaterial')
        `;
        const result = await executeQuery(query);
        console.table(result);

        const eqGroupCols = result.filter(r => r.TABLE_NAME === 'TblEquipmentGroup').map(r => r.COLUMN_NAME);
        const matCols = result.filter(r => r.TABLE_NAME === 'TblMaterial').map(r => r.COLUMN_NAME);

        console.log("TblEquipmentGroup Columns:", eqGroupCols);
        console.log("Has IsQtyTripMapping:", eqGroupCols.includes('IsQtyTripMapping'));

        console.log("TblMaterial Columns:", matCols);
        console.log("Has MaterialName:", matCols.includes('MaterialName'));
        console.log("Has Name:", matCols.includes('Name'));

    } catch (e) {
        console.error("Schema Check Error:", e);
    }
    console.log("--- END ---");
}

checkSchema();
