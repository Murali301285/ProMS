
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await authenticateUser(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Standardized on session.id (which should be user.SlNo)
        const userId = session.id;
        const body = await request.json();
        const { skip = 0, take = 50 } = body;
        console.log("Recent List Request:", { userId, body });

        // Query: 
        // - Filter by User
        // - Filter by Date (From Body)
        // - Fetch ALL fields required by TransactionConfig['crusher']

        let query = `
            SELECT 
                T.SlNo,
                T.[Date],
                T.ShiftId,
                T.ShiftInChargeId,
                T.MidScaleInchargeId,
                T.PlantId,
                T.ProductionUnitId,
                COALESCE(T.HaulerId, T.HaulerEquipmentId) as EquipmentId,
                T.TripQtyUnitId,
                
                S.ShiftName,
                O.OperatorName as ShiftInChargeName,
                Om.OperatorName as MidScaleInchargeName,
                
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
            LEFT JOIN [Master].[TblOperator] Om ON T.MidScaleInchargeId = Om.SlNo
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUnit] U1 ON T.ProductionUnitId = U1.SlNo
            LEFT JOIN [Master].[TblEquipment] H ON H.SlNo = COALESCE(T.HaulerId, T.HaulerEquipmentId)
            LEFT JOIN [Master].[TblUnit] U2 ON T.TripQtyUnitId = U2.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            
            WHERE T.IsDelete = 0
            AND (T.CreatedBy = @userId OR T.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: userId }];

        // Filters
        if (body.Date) {
            query += ` AND CAST(T.[Date] AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: body.Date });
        }

        if (body.ShiftId) {
            const sId = parseInt(body.ShiftId, 10);
            console.log("Filtering by ShiftId:", sId);
            if (!isNaN(sId)) {
                query += ` AND T.ShiftId = @ShiftId`;
                params.push({ name: 'ShiftId', type: sql.Int, value: sId });
            }
        }

        // Sorting
        query += ` ORDER BY T.SlNo DESC OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`;
        params.push({ name: 'skip', type: sql.Int, value: skip });
        params.push({ name: 'take', type: sql.Int, value: take });

        // console.log("Executing Query Params:", JSON.stringify(params)); 
        console.log("Executing Query Params Values:", params.map(p => ({ name: p.name, value: p.value })));

        const result = await executeQuery(query, params);

        let data = result;

        // Fetch Stoppages (Optimization: only fetch if needed and if records exist)
        if (data.length > 0) {
            const ids = data.map(row => row.SlNo).join(',');
            // Safe injection - ids are ints
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
            const stoppageResult = await executeQuery(stoppageQuery);

            // Merge
            data = data.map(row => ({
                ...row,
                stoppages: stoppageResult.filter(s => s.CrusherId === row.SlNo)
            }));
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Crusher Recent List Error:", error);
        return NextResponse.json({ message: 'Error fetching list', error: error.message }, { status: 500 });
    }
}
