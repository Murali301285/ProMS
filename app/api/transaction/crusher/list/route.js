
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Pagination
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '100'); // Higher text limit for tables

    // Filters
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    try {
        const pool = await getDbConnection();
        const req = pool.request();

        let whereClause = "WHERE T.IsDelete = 0";

        if (fromDate) {
            whereClause += " AND CAST(T.[Date] AS DATE) >= @fromDate";
            req.input('fromDate', sql.Date, fromDate);
        }
        if (toDate) {
            whereClause += " AND CAST(T.[Date] AS DATE) <= @toDate";
            req.input('toDate', sql.Date, toDate);
        }

        req.input('offset', sql.Int, offset);
        req.input('limit', sql.Int, limit);

        let query = `
            SELECT 
                T.SlNo,
                T.[Date],
                T.ShiftId,
                T.ShiftInChargeId,
                T.PlantId,
                T.ProductionUnitId,
                T.HaulerId as EquipmentId,
                T.TripQtyUnitId,
                
                S.ShiftName,
                
                (SELECT STRING_AGG(O_Sub.OperatorName, ', ') 
                 FROM STRING_SPLIT(T.ShiftInChargeId, ',') SS
                 JOIN [Master].[TblOperator] O_Sub ON O_Sub.SlNo = TRY_CAST(SS.value AS INT)
                ) as ShiftInChargeName,
                
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
                T.KWH,
                T.TotalStoppageHours,
                T.Remarks,

                CU.UserName as CreatedByName,
                T.CreatedDate,
                UU.UserName as UpdatedByName,
                T.UpdatedDate

            FROM [Trans].[TblCrusher] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            -- LEFT JOIN [Master].[TblOperator] O ON T.ShiftInChargeId = O.SlNo -- REMOVED: CSV Issue
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUnit] U1 ON T.ProductionUnitId = U1.SlNo
            LEFT JOIN [Master].[TblEquipment] H ON T.HaulerId = H.SlNo
            LEFT JOIN [Master].[TblUnit] U2 ON T.TripQtyUnitId = U2.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            
            ${whereClause}
            ORDER BY T.[Date] DESC, T.SlNo DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        const result = await req.query(query);
        let data = result.recordset;

        // Fetch Stoppages for these records
        if (data.length > 0) {
            const ids = data.map(row => row.SlNo).join(',');
            const stoppageQuery = `
                SELECT 
                    CS.CrusherId,
                    CS.FromTime,
                    CS.ToTime,
                    R.BDReasonName as ReasonName,
                    CS.StoppageHours,
                    CS.Remarks
                FROM [Trans].[TblCrusherStoppage] CS
                LEFT JOIN [Master].[TblBDReason] R ON CS.StoppageId = R.SlNo
                WHERE CS.CrusherId IN (${ids})
            `;
            const stoppageResult = await pool.request().query(stoppageQuery);
            const stoppages = stoppageResult.recordset;

            // Map stoppages to parents
            data = data.map(row => ({
                ...row,
                stoppages: stoppages.filter(s => s.CrusherId === row.SlNo)
            }));
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Error fetching Crusher list:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

