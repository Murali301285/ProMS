const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkData() {
    try {
        await sql.connect(config);

        console.log("--- Activity Master ---");
        const activities = await sql.query(`SELECT SlNo, ActivityName FROM [Master].TblActivity`);
        console.table(activities.recordset);

        console.log("\n--- Sample Equipment Reading ---");
        // Check if we have readings for Activity 1 (or matching Loading)
        const reading = await sql.query(`
            SELECT TOP 5 SlNo, ActivityId, EquipmentId, PatchId, SectorId, Date 
            FROM [Trans].TblEquipmentReading 
            ORDER BY Date DESC
        `);
        console.table(reading.recordset);

        console.log("\n--- Sample Loading Data ---");
        const loading = await sql.query(`
            SELECT TOP 5 SlNo, LoadingDate, LoadingMachineEquipmentId 
            FROM [Trans].TblLoading 
            ORDER BY LoadingDate DESC
        `);
        console.table(loading.recordset);

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkData();
