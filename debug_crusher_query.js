
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

async function runQuery() {
    try {
        await sql.connect(config);

        const query = `
            SELECT 
                T.SlNo,
                T.[Date],
                T.ShiftId,
                T.ShiftInChargeId,
                T.PlantId,
                T.ProductionUnitId,
                T.HaulerId,
                T.TripQtyUnitId,
                
                S.ShiftName,
                O.OperatorName as ShiftInChargeName,
                
                T.ManPowerInShift,
                
                P.Name as PlantName,
                
                T.BeltScaleOHMR,
                T.BeltScaleCHMR,
                
                U1.Name as ProductionUnitName,
                T.ProductionQty,
                
                H.EquipmentName as HaulerName,
                
                T.NoofTrip,
                T.QtyTrip,
                U2.Name as TripQtyUnitName,
                
                T.TotalQty,
                T.OHMR,
                T.CHMR,
                T.RunningHr,
                T.TotalStoppageHours,
                T.Remarks,

                CU.UserName as CreatedByName,
                T.CreatedDate,
                UU.UserName as UpdatedByName,
                T.UpdatedDate

            FROM [Trans].[TblCrusher] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblOperator] O ON T.ShiftInChargeId = O.SlNo 
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUnit] U1 ON T.ProductionUnitId = U1.SlNo
            LEFT JOIN [Master].[TblEquipment] H ON T.HaulerId = H.SlNo
            LEFT JOIN [Master].[TblUnit] U2 ON T.TripQtyUnitId = U2.SlNo
            LEFT JOIN [Master].[TblUser] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser] UU ON T.UpdatedBy = UU.SlNo
            
            WHERE T.IsDelete = 0
            ORDER BY T.[Date] DESC, T.SlNo DESC
            OFFSET 0 ROWS FETCH NEXT 1000 ROWS ONLY
        `;

        const result = await sql.query(query);
        console.log("Query Successful. Rows:", result.recordset.length);

    } catch (err) {
        console.error("SQL ERROR:", err);
    } finally {
        await sql.close();
    }
}

runQuery();
