const { executeQuery } = require('./lib/db');

async function checkSchema() {
    try {
        console.log("Checking [Trans].[TblMaterialRehandling]...");
        const result = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblMaterialRehandling'
        `);
        console.table(result);

        console.log("Checking [Trans].[TblMaterialRehandlingShiftIncharge]...");
        const result2 = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblMaterialRehandlingShiftIncharge'
        `);
        console.table(result2);

    } catch (e) {
        console.error(e);
    }
}

checkSchema();
