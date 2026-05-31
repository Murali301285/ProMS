const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const lookups = [
    { table: 'TblEquipmentGroup', nameField: 'Name', valueField: 'SlNo' },
    { table: 'TblEquipmentOwnerType', nameField: 'Type', valueField: 'SlNo' },
    { table: 'Vendor', nameField: 'VendorName', valueField: 'SlNo' },
    { table: 'TblActivity', nameField: 'Name', valueField: 'SlNo' },
    { table: 'TblScale', nameField: 'Name', valueField: 'SlNo' },
    { table: 'TblUnit', nameField: 'Name', valueField: 'SlNo' }
];

async function runTest() {
    try {
        await sql.connect(config);
        console.log("Connected to DB!");
        
        for (const l of lookups) {
            const query = `SELECT ${l.valueField} as id, ${l.nameField} as name FROM [Master].[${l.table}] WHERE 1=1 ORDER BY ${l.nameField} ASC`;
            try {
                const res = await sql.query(query);
                console.log(`✅ Success for [Master].[${l.table}]: ${res.recordset.length} rows`);
                if (res.recordset.length > 0) {
                    console.log(`   Sample:`, res.recordset[0]);
                }
            } catch (err) {
                console.error(`❌ Failed for [Master].[${l.table}]:`, err.message);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error("Connection failed:", e);
        process.exit(1);
    }
}

runTest();
