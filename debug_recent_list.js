const { getDbConnection } = require('./lib/db');

async function testQuery() {
    try {
        const pool = await getDbConnection();
        const request = pool.request();

        // This is the query from route.js
        const query = `
            SELECT TOP 20 
                T.SlNo, 
                T.LoadingDate as [Date],
                sh.ShiftName,
                SI.OperatorName + ' (' + CAST(SI.OperatorId AS VARCHAR) + ')' as ShiftInchargeName,
                MSI.OperatorName + ' (' + CAST(MSI.OperatorId AS VARCHAR) + ')' as MidScaleInchargeName,
                T.ManPower,
                R.Name as RelayName,
                s.Name as SourceName,
                d.Name as DestinationName,
                m.MaterialName,
                h.EquipmentName as HaulerName,
                lm.EquipmentName as LoadingMachineName,
                T.NoofTrip as NoOfTrips, 
                T.QtyTrip,
                T.NtpcQtyTrip,
                U_Unit.Name as UnitName,
                T.TotalQty,
                T.TotalNtpcQty,
                T.CreatedDate,
                CU.EmpName as CreatedByName,
                T.UpdatedDate,
                UU.EmpName as UpdatedByName
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblShift] sh ON T.ShiftId = sh.SlNo
            LEFT JOIN [Master].[TblOperator] SI ON T.ShiftInchargeId = SI.SlNo
            LEFT JOIN [Master].[TblOperator] MSI ON T.MidScaleInchargeId = MSI.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblSource] s ON T.SourceId = s.SlNo
            LEFT JOIN [Master].[TblDestination] d ON T.DestinationId = d.SlNo
            LEFT JOIN [Master].[TblMaterial] m ON T.MaterialId = m.SlNo
            LEFT JOIN [Master].[TblEquipment] h ON T.HaulerEquipmentId = h.SlNo 
            LEFT JOIN [Master].[TblEquipment] lm ON T.LoadingMachineEquipmentId = lm.SlNo 
            LEFT JOIN [Master].[TblUnit] U_Unit ON T.Unit = U_Unit.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            WHERE T.IsDelete = 0
            ORDER BY T.CreatedDate DESC
        `;

        console.log("Executing Query...");
        const result = await request.query(query);
        console.log("✅ Success! Rows returned:", result.recordset.length);
        if (result.recordset.length > 0) {
            console.log("First Row:", result.recordset[0]);
        }
    } catch (error) {
        console.error("❌ SQL Error:", error);
    } finally {
        process.exit();
    }
}

testQuery();
