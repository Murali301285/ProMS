const { executeQuery } = require('./lib/db');

async function checkSchema() {
    try {
        console.log("Checking Schema for TblCompany...");
        const result = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblCompany'
        `);
        console.table(result);
    } catch (err) {
        console.error(err);
    }
}

checkSchema();
