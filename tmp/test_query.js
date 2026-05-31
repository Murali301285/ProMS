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

async function testQueryWithLiterals() {
    try {
        await sql.connect(config);
        console.log("Connected!");
        
        const fromDate = '2026-04-01';
        const toDate = '2026-05-31';

        const request = new sql.Request();
        
        let whereClause = "WHERE T.IsDelete = 0";
        whereClause += " AND CAST(T.LoadingDate AS DATE) >= @fromDate";
        request.input('fromDate', sql.Date, fromDate);
        
        whereClause += " AND CAST(T.LoadingDate AS DATE) <= @toDate";
        request.input('toDate', sql.Date, toDate);

        // Lit OFFSET 0 FETCH 1000000
        const query = `
            SELECT 
                T.SlNo,
                T.LoadingDate,
                T.ShiftId,
                T.RelayId,
                T.SourceId,
                T.DestinationId,
                T.MaterialId,
                T.HaulerEquipmentId,
                T.LoadingMachineEquipmentId,
                T.ShiftInchargeId,
                T.MidScaleInchargeId,
                O_Large.OperatorName AS ShiftInchargeName,
                O_Mid.OperatorName AS MidScaleInchargeName,
                S.ShiftName,
                (
                    ISNULL(O_Large.OperatorName, '') + 
                    CASE WHEN O_Large.OperatorName IS NOT NULL AND O_Mid.OperatorName IS NOT NULL THEN ', ' ELSE '' END + 
                    ISNULL(O_Mid.OperatorName, '')
                ) AS ShiftInCharge,
                T.ManPowerInShift AS ManPower,
                R.Name AS RelayName,
                Src.Name AS SourceName,
                Dest.Name AS DestinationName,
                Mat.MaterialName,
                HE.EquipmentName AS HaulerName,
                LME.EquipmentName AS LoadingMachineName,
                T.NoofTrip,
                T.QtyTrip,
                T.NtpcQtyTrip,
                T.TotalQty,
                T.TotalNtpcQty,
                U.Name AS UnitName,
                CU.EmpName AS CreatedByName,
                T.CreatedDate,
                T.UpdatedDate,
                UU.EmpName AS UpdatedByName,
                COUNT(*) OVER() as TotalCount
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblSource] Src ON T.SourceId = Src.SlNo
            LEFT JOIN [Master].[TblDestination] Dest ON T.DestinationId = Dest.SlNo
            LEFT JOIN [Master].[TblMaterial] Mat ON T.MaterialId = Mat.SlNo
            LEFT JOIN [Master].[TblEquipment] HE ON T.HaulerEquipmentId = HE.SlNo
            LEFT JOIN [Master].[TblEquipment] LME ON T.LoadingMachineEquipmentId = LME.SlNo
            LEFT JOIN [Master].[TblOperator] O_Large ON T.ShiftInchargeId = O_Large.SlNo
            LEFT JOIN [Master].[TblOperator] O_Mid ON T.MidScaleInchargeId = O_Mid.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            ` + whereClause + `
            ORDER BY T.LoadingDate DESC
            OFFSET 0 ROWS FETCH NEXT 1000000 ROWS ONLY
        `;

        const t0 = Date.now();
        const result = await request.query(query);
        const t1 = Date.now();
        console.log(`Query completed in ${t1 - t0}ms. Rows returned: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.log("First row:", result.recordset[0]);
        }
        
        process.exit(0);
    } catch (e) {
        console.error("Query Error:", e.message);
        process.exit(1);
    }
}

testQueryWithLiterals();
