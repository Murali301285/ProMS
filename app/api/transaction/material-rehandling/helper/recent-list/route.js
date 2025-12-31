
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(req) {
    try {
        const user = await authenticateUser(req);
        const body = await req.json();
        const { Date: LoadDate, ShiftId, SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId } = body;

        const pool = await getDbConnection();
        const request = pool.request();

        let query = `
            SELECT 
                T.SlNo, 
                T.RehandlingDate as [Date],
                sh.ShiftName,
                SI.OperatorName + ' (' + CAST(SI.OperatorId AS VARCHAR) + ')' as ShiftInchargeName,
                MSI.OperatorName + ' (' + CAST(MSI.OperatorId AS VARCHAR) + ')' as MidScaleInchargeName,
                T.ManPowerInShift as ManPower,
                R.Name as RelayName,
                s.Name as SourceName,
                d.Name as DestinationName,
                m.MaterialName,
                h.EquipmentName as HaulerName,
                lm.EquipmentName as LoaderName,
                T.NoofTrip as NoOfTrips,
                T.QtyTrip,
                T.NtpcQtyTrip,
                U_Unit.Name as UnitName,
                T.TotalQty,
                T.TotalNtpcQty,
                T.CreatedDate,
                U.EmpName as CreatedByName,
                T.UpdatedDate,
                UU.EmpName as UpdatedByName
            FROM [Trans].[TblMaterialRehandling] T
            LEFT JOIN [Master].[TblShift] sh ON T.ShiftId = sh.SlNo
            LEFT JOIN [Master].[TblOperator] SI ON T.ShiftInchargeId = SI.SlNo
            LEFT JOIN [Master].[TblOperator] MSI ON T.MidScaleInchargeId = MSI.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblSource] s ON T.SourceId = s.SlNo
            LEFT JOIN [Master].[TblDestination] d ON T.DestinationId = d.SlNo
            LEFT JOIN [Master].[TblMaterial] m ON T.MaterialId = m.SlNo
            LEFT JOIN [Master].[TblEquipment] h ON T.HaulerEquipmentId = h.SlNo
            LEFT JOIN [Master].[TblEquipment] lm ON T.LoadingMachineEquipmentId = lm.SlNo
            LEFT JOIN [Master].[TblUnit] U_Unit ON T.UnitId = U_Unit.SlNo
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            WHERE T.IsDelete = 0
        `;

        // Apply Filters
        if (LoadDate) {
            query += ` AND T.RehandlingDate = @LoadDate`;
            request.input('LoadDate', LoadDate);
        }
        if (ShiftId) {
            query += ` AND T.ShiftId = @ShiftId`;
            request.input('ShiftId', ShiftId);
        }
        if (SourceId) {
            query += ` AND T.SourceId = @SourceId`;
            request.input('SourceId', SourceId);
        }
        if (DestinationId) {
            query += ` AND T.DestinationId = @DestinationId`;
            request.input('DestinationId', DestinationId);
        }
        if (MaterialId) {
            query += ` AND T.MaterialId = @MaterialId`;
            request.input('MaterialId', MaterialId);
        }
        if (HaulerId) {
            query += ` AND T.HaulerEquipmentId = @HaulerId`;
            request.input('HaulerId', HaulerId);
        }
        if (LoadingMachineId) {
            query += ` AND T.LoadingMachineEquipmentId = @LoadingMachineId`;
            request.input('LoadingMachineId', LoadingMachineId);
        }

        if (user) {
            query += ` AND (T.CreatedBy = @UserId OR T.UpdatedBy = @UserId)`;
            request.input('UserId', user.id);
        }

        query += ` ORDER BY T.CreatedDate DESC`;

        const result = await request.query(query);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("❌ API Error (rehandling/recent-list):", error);
        return NextResponse.json({ success: false, message: error.message, stack: error.stack }, { status: 500 });
    }
}
