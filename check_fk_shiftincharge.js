
const sql = require('mssql');
const { config } = require('./lib/db');

async function checkConstraints() {
    try {
        await sql.connect(config);

        // 1. Check Column Type
        const colCheck = await sql.query(`
            SELECT DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher' AND COLUMN_NAME = 'ShiftInChargeId'
        `);
        console.log("Current Type:", colCheck.recordset[0]?.DATA_TYPE);

        // 2. Check Constraints
        const constraintCheck = await sql.query(`
            SELECT tc.CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            WHERE tc.TABLE_SCHEMA = 'Trans' 
              AND tc.TABLE_NAME = 'TblCrusher' 
              AND kcu.COLUMN_NAME = 'ShiftInChargeId'
              AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
        `);

        if (constraintCheck.recordset.length > 0) {
            console.log("Foreign Key Found:", constraintCheck.recordset[0].CONSTRAINT_NAME);
        } else {
            console.log("No Foreign Key Found");
        }

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkConstraints();
