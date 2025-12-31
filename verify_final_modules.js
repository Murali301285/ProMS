
const { getDbConnection, sql } = require('./lib/db');

async function verifyAll() {
    try {
        const pool = await getDbConnection();

        console.log("=== Verifying Remaining Modules Refactor ===");

        // 1. Equipment Reading
        console.log("\n--- Equipment Reading ---");
        const eqRes = await pool.request().query(`
            SELECT TOP 1 T.SlNo, ISNULL(U.EmpName, 'Unknown') as CreatedByName 
            FROM [Trans].[TblEquipmentReading] T 
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo 
            ORDER BY T.SlNo DESC
        `);
        console.log("Latest Equipment Reading (DB Check):", eqRes.recordset[0]);

        // 2. Drilling
        console.log("\n--- Drilling ---");
        const drRes = await pool.request().query(`
            SELECT TOP 1 T.SlNo, ISNULL(U.EmpName, 'Unknown') as CreatedByName 
            FROM [Trans].[TblDrilling] T 
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo 
            ORDER BY T.SlNo DESC
        `);
        console.log("Latest Drilling (DB Check):", drRes.recordset[0]);

        // 3. Blasting
        console.log("\n--- Blasting ---");
        const blRes = await pool.request().query(`
            SELECT TOP 1 T.SlNo, ISNULL(U.EmpName, 'Unknown') as CreatedByName 
            FROM [Trans].[TblBlasting] T 
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo 
            ORDER BY T.SlNo DESC
        `);
        console.log("Latest Blasting (DB Check):", blRes.recordset[0]);

        // 4. Crusher
        console.log("\n--- Crusher ---");
        const crRes = await pool.request().query(`
            SELECT TOP 1 T.SlNo, ISNULL(U.EmpName, 'Unknown') as CreatedByName 
            FROM [Trans].[TblCrusher] T 
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo 
            ORDER BY T.SlNo DESC
        `);
        console.log("Latest Crusher (DB Check):", crRes.recordset[0]);

        console.log("\n=== Done ===");
        process.exit(0);

    } catch (err) {
        console.error("Verification Failed:", err);
        process.exit(1);
    }
}

verifyAll();
