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
                LoadingDate, 
                ShiftId, 
                ShiftInchargeId,
                MidScaleInchargeId,
                RelayId, 
                SourceId,
                ManPowerInShift as ManPower,
                UnitId, 
                LoadingMachineEquipmentId as LoadingMachineId,
                HaulerEquipmentId as HaulerId,
                DestinationId,
                MaterialId
            FROM [Trans].[TblLoading]
            WHERE IsDelete = 0 
            AND (CreatedBy = @UserId OR UpdatedBy = @UserId)
        `;

        // Clone query for History Fallback
        let queryHistory = query + ` ORDER BY CreatedDate DESC`;

        // Apply Date Filter to Primary Query
        if (date) {
            query += ` AND LoadingDate = @LoadingDate`;
            request.input('LoadingDate', date);
        }

        // Strict Shift Filter (Optional, usually we want broader context)
        if (ShiftId) {
            query += ` AND ShiftId = @ShiftId`;
            request.input('ShiftId', ShiftId);
        }

        query += ` ORDER BY CreatedDate DESC`;

        console.log("🚀 [last-context] Trying Primary Date:", date);
        let result = await request.query(query);

        let data = null;
        if (result.recordset.length > 0) {
            data = result.recordset[0];
            console.log("✅ Found Context for Date:", date);
        } else {
            // 2. Fallback to History (Last Entry Ever)
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
