
const { executeQuery } = require('./lib/db');

async function checkColumns() {
    console.log("--- CHECKING COLUMNS ---");
    try {
        const query = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' 
            AND TABLE_NAME = 'TblMaterialRehandling'
            AND COLUMN_NAME IN ('ShiftInchargeId', 'MidScaleInchargeId')
        `;
        const result = await executeQuery(query);
        const columns = result.map(r => r.COLUMN_NAME);
        console.log("Found Columns:", columns);

        if (columns.includes('ShiftInchargeId') && columns.includes('MidScaleInchargeId')) {
            console.log("✅ SUCCESS: Both columns exist.");
        } else {
            console.log("❌ FAILURE: Missing columns.");
        }

    } catch (e) {
        console.error("Check Error:", e);
    }
}

checkColumns();
