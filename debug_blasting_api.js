const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false, // Use true for Azure
        trustServerCertificate: true, // Change to true for local dev / self-signed certs
    },
};

async function run() {
    try {
        await sql.connect(config);
        console.log('Connected!');

        const query = `
            SELECT 
                B.*,
                Sh.ShiftName,
                SS.Name as SMESupplierName,
                U1.UserName as CreatedByName,
                U2.UserName as UpdatedByName
            FROM [Trans].[TblBlasting] B
            LEFT JOIN [Master].[TblShift] Sh ON B.ShiftId = Sh.SlNo
            LEFT JOIN [Master].[TblSMESupplier] SS ON B.SMESupplierId = SS.SlNo
            LEFT JOIN [Master].[TblUser] U1 ON B.CreatedBy = U1.SlNo
            LEFT JOIN [Master].[TblUser] U2 ON B.UpdatedBy = U2.SlNo
            WHERE B.IsDelete = 0
            ORDER BY B.Date DESC
        `;
        // Hardcode Date Filter to match user issue
        // query = query.replace('ORDER BY', "AND CAST(B.Date AS DATE) = '2025-12-16' ORDER BY"); 

        // Actually, let's just insert it before ORDER BY
        const dateFilter = " AND CAST(B.Date AS DATE) = '2025-12-16' ";
        const queryWithDate = query.replace('ORDER BY', dateFilter + 'ORDER BY');

        console.log("Running Query with Date Filter...");
        const result = await sql.query(queryWithDate);
        console.log('Main Query Success. Rows:', result.recordset.length);

        if (result.recordset.length > 0) {
            const ids = result.recordset.map(r => r.SlNo).join(',');
            console.log("IDs:", ids);

            const accQuery = `
                SELECT 
                    SlNo, BlastingId, SED, TotalBoosterUsed, TotalNonelMeters, TotalTLDMeters
                FROM [Trans].[TblBlastingAccessories]
                WHERE IsDelete = 0 AND BlastingId IN (${ids})
            `;
            const accRes = await sql.query(accQuery);
            console.log('Accessory Query Success. Rows:', accRes.recordset.length);

            const accData = accRes.recordset;
            const mainData = result.recordset;

            // Merge
            const finalData = mainData.map(row => {
                return {
                    ...row,
                    accessories: accData.filter(a => a.BlastingId === row.SlNo)
                };
            });

            const withAcc = finalData.filter(r => r.accessories.length > 0);
            console.log("Rows with accessories:", withAcc.length);
            if (withAcc.length > 0) {
                console.log("First match ID:", withAcc[0].SlNo);
                console.log("Acc count:", withAcc[0].accessories.length);
                console.log("Parent SlNo Type:", typeof withAcc[0].SlNo);
                console.log("Child BlastingId Type:", typeof withAcc[0].accessories[0].BlastingId);
            } else {
                console.log("No matches found after merge!");
                if (mainData.length > 0 && accData.length > 0) {
                    console.log("Sample Parent ID:", mainData[0].SlNo, typeof mainData[0].SlNo);
                    console.log("Sample Child BlastingId:", accData[0].BlastingId, typeof accData[0].BlastingId);
                }
            }
        }

    } catch (err) {
        console.error('SQL Error:', err);
    } finally {
        await sql.close();
    }
}

run();
