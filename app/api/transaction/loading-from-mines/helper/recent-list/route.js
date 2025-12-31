import { NextResponse } from 'next/server';
// Force Rebuild Trigger: 2025-12-28 20:05
import { getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(req) {
    try {
        const user = await authenticateUser(req);
        // User requested: "Load the Recent transactions is based on the created or updated by logged in user" ? 
        // Or filter by selection?
        // "Controls like Date, Shift... Once changes -> recent transactions should load based on the filtered details"
        // Also: "Select from tblload where Date... and Shift... etc"
        // AND "Date... isDelete=0 and (created by =[username] or Updatedby=[Username])" implies scoping to user?
        // Let's assume User Scope + Filter Scope.

        const body = await req.json();
        console.log("Values passed to recent-list:", body);
        const { Date: LoadDate, ShiftId, SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId, skip = 0, take = 50 } = body;

        const pool = await getDbConnection();
        const request = pool.request();

        let query = `
            SELECT 
                T.SlNo, 
                T.LoadingDate as [Date],
                sh.ShiftName,
                SI.OperatorName + ' (' + CAST(SI.OperatorId AS VARCHAR) + ')' as ShiftInchargeName,
                MSI.OperatorName + ' (' + CAST(MSI.OperatorId AS VARCHAR) + ')' as MidScaleInchargeName,
                T.ManPowerInShift as ManPower,
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
            LEFT JOIN [Master].[TblUnit] U_Unit ON T.UnitId = U_Unit.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            WHERE T.IsDelete = 0
        `;

        // Apply Filters if present
        if (LoadDate) {
            query += ` AND T.LoadingDate = @LoadingDate`;
            request.input('LoadingDate', LoadDate);
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
            query += ` AND T.HaulerEquipmentId = @HaulerId`; // CORRECT COLUMN
            request.input('HaulerId', HaulerId);
        }
        if (LoadingMachineId) {
            query += ` AND T.LoadingMachineEquipmentId = @LoadingMachineId`; // CORRECT COLUMN
            request.input('LoadingMachineId', LoadingMachineId);
        }

        // Add scoping to User
        if (user) {
            query += ` AND (T.CreatedBy = @UserId OR T.UpdatedBy = @UserId)`;
            request.input('UserId', user.id);
        }

        // Pagination
        query += ` ORDER BY T.CreatedDate DESC, T.SlNo DESC OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`;
        request.input('skip', skip);
        request.input('take', take);

        console.log("📝 [Recent-List] Generated Query:", query);
        const result = await request.query(query);
        console.log("✅ [Recent-List] Success. Rows:", result.recordset.length);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("❌ API Error (recent-list):", error);
        console.error("Stack:", error.stack);
        console.error("Original Error:", error.originalError?.info || error.originalError);
        return NextResponse.json({ success: false, message: error.message, stack: error.stack, originalError: error.originalError?.info }, { status: 500 });
    }
}
