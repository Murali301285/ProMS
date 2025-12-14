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
    }
};

async function run() {
    try {
        console.log("Connecting...");
        const pool = await sql.connect(config);
        console.log("Connected.");

        // Check TblEquipmentGroup
        const groupQuery = "SELECT SlNo, Name, IsActive, IsQtyTripMapping FROM [Master].[TblEquipmentGroup]";
        console.log("Checking Equipment Groups...");
        const groups = await pool.request().query(groupQuery);
        console.log(`Found ${groups.recordset.length} groups.`);
        if (groups.recordset.length > 0) {
            console.log("Sample Group:", groups.recordset[0]);
        } else {
            console.log("WARNING: Zero Equipment Groups found.");
        }

        // Check TblEquipment
        const equipQuery = "SELECT TOP 5 SlNo, EquipmentName, EquipmentGroupId FROM [Master].[TblEquipment]";
        console.log("\nChecking Equipments...");
        const equips = await pool.request().query(equipQuery);
        console.log(`Found ${equips.recordset.length} equipments (Top 5).`);
        if (equips.recordset.length > 0) {
            console.log("Sample Equipment:", equips.recordset[0]);
        }

        await pool.close();
    } catch (err) {
        console.error("SQL Error:", err);
    }
}

run();
