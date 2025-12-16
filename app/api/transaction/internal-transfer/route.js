import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Prevent Caching

export async function GET(req) {
    try {
        console.log("🔍 [LIST] Internal Transfer API Called - " + new Date().toISOString());
        const { searchParams } = new URL(req.url);

        const limitParam = searchParams.get('limit');
        const limit = limitParam && limitParam !== 'All' ? parseInt(limitParam) : 50; // Default 50
        const isAll = limitParam === 'All';

        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        let query = `
            SELECT ${isAll ? '' : `TOP (@limit)`}
                T.SlNo,
                T.TransferDate as LoadingDate, -- Alias for UI 
                S.ShiftName,
                R.RelayName,
                Src.SourceName,
                Dest.DestinationName,
                Mat.MaterialName,
                EqHauler.EquipmentName as HaulerName,
                EqLoader.EquipmentName as LoadingMachineName,
                U.UnitName,
                
                T.NoofTrip,
                T.QtyTrip,
                T.TotalQty,
                
                T.ShiftId, T.RelayId, T.SourceId, T.DestinationId, T.MaterialId, T.HaulerEquipmentId, T.LoadingMachineEquipmentId,
                T.CreatedDate,
                T.Remarks,
                
                -- Aggregated Incharges
                (SELECT STRING_AGG(IO.OperatorName, ', ') 
                 FROM [Trans].[TblInternalTransferIncharge] TI
                 JOIN [Master].[TblOperator] IO ON TI.OperatorId = IO.SlNo
                 WHERE TI.TransferId = T.SlNo) as ShiftInCharge

            FROM [Trans].[TblInternalTransfer] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblSource] Src ON T.SourceId = Src.SlNo
            LEFT JOIN [Master].[TblDestination] Dest ON T.DestinationId = Dest.SlNo
            LEFT JOIN [Master].[TblMaterial] Mat ON T.MaterialId = Mat.SlNo
            LEFT JOIN [Master].[TblEquipment] EqHauler ON T.HaulerEquipmentId = EqHauler.SlNo
            LEFT JOIN [Master].[TblEquipment] EqLoader ON T.LoadingMachineEquipmentId = EqLoader.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            
            WHERE T.IsDelete = 0
        `;

        const params = [];
        if (!isAll) params.push({ name: 'limit', type: sql.Int, value: limit });

        if (fromDate && toDate) {
            query += ` AND CAST(T.TransferDate AS DATE) BETWEEN @fromDate AND @toDate`;
            params.push({ name: 'fromDate', type: sql.Date, value: fromDate });
            params.push({ name: 'toDate', type: sql.Date, value: toDate });
        } else {
            // Default: Previous 2 days if no logs? Or just last 50 entries regardless of date?
            // Existing logic uses LIMIT. If no date, we check last 7 days? 
            // Let's stick to simple LIMIT.
        }

        query += ` ORDER BY T.TransferDate DESC, T.SlNo DESC`;

        const result = await executeQuery(query, params);
        console.log(`✅ [LIST] Found ${result.length} rows.`);
        return NextResponse.json({ success: true, count: result.length, data: result });

    } catch (error) {
        console.error("Internal Transfer List Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
