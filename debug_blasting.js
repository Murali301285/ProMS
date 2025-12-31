const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        console.log("Connecting...");
        let pool = await sql.connect(config);
        console.log("Connected.");

        console.log("--- TEST 1: Check ElectricalEntry Columns & User Types ---");
        const typeQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblElectricalEntry' 
            AND COLUMN_NAME IN ('SlNo', 'CreatedBy', 'UpdatedBy', 'PlantId', 'EquipmentId', 'Type')
        `;
        const res1 = await pool.request().query(typeQuery);
        console.log("Column Types:", res1.recordset);

        console.log("\n--- TEST 2: Check Recent Data (CreatedBy values) ---");
        const recentQuery = `
            SELECT TOP 5
                SlNo, Date, CreatedBy, CreatedDate, UpdatedBy
            FROM [Trans].[TblElectricalEntry]
            ORDER BY SlNo DESC
        `;
        const res2 = await pool.request().query(recentQuery);
        console.log("Recent Rows:", res2.recordset);

        console.log("\n--- TEST 3: Check for Non-Numeric User IDs ---");
        const checkUserQuery = `
            SELECT SlNo, CreatedBy, UpdatedBy 
            FROM [Trans].[TblElectricalEntry] 
            WHERE (CreatedBy IS NOT NULL AND ISNUMERIC(CreatedBy) = 0)
               OR (UpdatedBy IS NOT NULL AND ISNUMERIC(UpdatedBy) = 0)
        `;
        const res3 = await pool.request().query(checkUserQuery);
        console.log("Non-Numeric User Rows:", res3.recordset.length);
        if (res3.recordset.length > 0) console.log(res3.recordset);

        pool.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

check();
