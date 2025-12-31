const { executeQuery } = require('./lib/db');

async function checkSchema() {
    console.log("--- SCHEMA CHECK: TblUser_New ---");
    try {
        const query = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' 
            AND TABLE_NAME = 'TblUser_New'
        `;
        const result = await executeQuery(query);
        console.table(result);
    } catch (e) {
        console.error("Schema Check Error:", e);
    }
    console.log("--- END ---");
}

checkSchema();
