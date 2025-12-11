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
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function checkMaterialStrict() {
    console.log("--- STRICT ID CHECK ---");
    try {
        await sql.connect(config);

        // 1. Check if ID 10 exists AT ALL (even if deleted)
        const query = `SELECT * FROM [Master].[TblMaterial] WHERE SlNo = 10`;
        const result = await sql.query(query);
        console.log("Record with ID 10:", result.recordset[0] || "DOES NOT EXIST");

        // 2. Check what's actually in QtyTripMapping for these rows
        const queryMapping = `SELECT TOP 5 SlNo, EquipmentGroupId, MaterialId FROM [Master].[TblQtyTripMapping]`;
        const resultMapping = await sql.query(queryMapping);
        console.log("QtyTripMapping Sample:", resultMapping.recordset);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.close();
    }
    console.log("--- END ---");
}

checkMaterialStrict();
