import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // Correct path
import { authenticateUser } from '@/lib/auth'; // Ensure Auth

export async function POST(req) {
    try {
        const user = await authenticateUser(req);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { date, ShiftId } = await req.json(); // Accept Date and optionally Shift to be specific

        const pool = await getDbConnection();
        const request = pool.request();

        request.input('UserId', user.id);

        // 1. Try Specific Date Match First (Resume Work)
        let query = `
            SELECT TOP 1 
                T.LoadingDate, 
                T.ShiftId, 
                T.ShiftInchargeId,
                T.MidScaleInchargeId,
                T.RelayId, 
                T.SourceId,
                T.ManPowerInShift as ManPower,
                T.UnitId, 
                T.LoadingMachineEquipmentId as LoadingMachineId,
                T.HaulerEquipmentId as HaulerId,
                T.DestinationId,
                T.MaterialId,
                -- Load Factors from Mapping (User Request Step 1112)
                M.ManagementQtyTrip,
                M.NTPCQtyTrip
            FROM [Trans].[TblLoading] T
            -- Join to get Equipment Group from Hauler
            LEFT JOIN [Master].[TblEquipment] E ON T.HaulerEquipmentId = E.SlNo
            -- Join to get QtyMapping based on Equipment Group AND Material
            LEFT JOIN [Master].[TblQtyTripMapping] M ON E.EquipmentGroupId = M.EquipmentGroupId 
                                                     AND T.MaterialId = M.MaterialId 
                                                     AND M.IsActive = 1 
                                                     AND M.IsDelete = 0
            WHERE T.IsDelete = 0 
            AND (T.CreatedBy = @UserId OR T.UpdatedBy = @UserId)
        `;

        // Clone query for History Fallback
        let queryHistory = query + ` ORDER BY T.CreatedDate DESC`;

        // Apply Date Filter to Primary Query
        if (date) {
            query += ` AND T.LoadingDate = @LoadingDate`;
            request.input('LoadingDate', date);
        }

        // Strict Shift Filter (Enforced as per User Request)
        if (ShiftId) {
            query += ` AND T.ShiftId = @ShiftId`;
            request.input('ShiftId', ShiftId);
        }

        query += ` ORDER BY T.CreatedDate DESC`;

        console.log("🚀 [last-context] Trying Primary Date:", date);
        let result = await request.query(query);

        let data = null;
        if (result.recordset.length > 0) {
            data = result.recordset[0];
            console.log("✅ Found Context for Date:", date);
        } else if (!ShiftId) {
            // 2. Fallback to History (Last Entry Ever) - ONLY if Strict Shift is NOT enabled
            console.log("⚠️ No entry for Date. Fetching Latest History...");
            // Clear Date param for history query if reused? No, create new clean query or just run history string
            // Actually request object inputs stick. 

            // Safest: New Request/Query for History
            const pool2 = await getDbConnection(); // reuse pool
            const req2 = pool2.request();
            req2.input('UserId', user.id);

            const resHistory = await req2.query(queryHistory);
            if (resHistory.recordset.length > 0) {
                data = resHistory.recordset[0];
                console.log("✅ Found Historical Context:", data.LoadingDate);
            }
        }

        if (data) {
            return NextResponse.json({ success: true, data });
        } else {
            return NextResponse.json({ success: true, data: null });
        }

    } catch (error) {
        console.error("❌ API Error (last-context):", error);
        console.error("Stack:", error.stack);
        return NextResponse.json({ success: false, message: error.message, stack: error.stack }, { status: 500 });
    }
}
