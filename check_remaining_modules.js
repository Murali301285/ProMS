const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function check() {
    try {
        await sql.connect(config);

        const tables = [
            'TblEquipmentReading',
            'TblDrilling',
            'TblBlastingEntry', // verifying name
            'TblCrusherEntry'   // verifying name
        ];

        // 1. Verify Table Names in Schema
        const schemaCheck = await sql.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Drilling%' 
               OR TABLE_NAME LIKE '%Blasting%' 
               OR TABLE_NAME LIKE '%Crusher%'
               OR TABLE_NAME LIKE '%EquipmentReading%'
        `);
        console.log("--- Found Tables ---");
        console.table(schemaCheck.recordset);

        // 2. Check CreatedBy Column Type for relevant tables
        // Assuming standard naming based on previous work, adjusting if search found diffs
        const targetTables = [
            'TblEquipmentReading', 'TblDrilling', 'TblBlastingEntry', 'TblCrusherEntry'
        ]; // Will adjust after running this script if names differ.

        // Let's just dump column types for whatever we found that looks right
        const foundNames = schemaCheck.recordset.map(r => r.TABLE_NAME);

        if (foundNames.length > 0) {
            const cols = await sql.query(`
                SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME IN ('${foundNames.join("','")}')
                AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy')
            `);
            console.log("--- Column Types ---");
            console.table(cols.recordset);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
