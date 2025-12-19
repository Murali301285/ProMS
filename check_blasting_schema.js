
const sql = require('mssql');
const { config } = require('./lib/db');

async function checkTable() {
    try {
        await sql.connect(config);
        const tableCheck = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblBlasting'
        `);

        if (tableCheck.recordset.length > 0) {
            console.log("Table Found: true");
            console.table(tableCheck.recordset);
        } else {
            console.log("Table Found: false");
        }
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkTable();
