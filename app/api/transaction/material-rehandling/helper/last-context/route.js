
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(req) {
    try {
        const user = await authenticateUser(req);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { date, ShiftId } = await req.json();
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('UserId', user.id);

        // STRATEGY:
        // 1. Initial Load (No Date provided): Get absolute last record from TblMaterialRehandling.
        // 2. Date Change (Date provided): 
        //    a. Check TblMaterialRehandling for that date.
        //    b. If not found, check TblLoading for that date (Fallback).

        let contextData = null;

        // --- STEP 1: Attempt to fetch from Material Rehandling ---
        let queryRehandling = `
            SELECT TOP 1 
                T.RehandlingDate as [Date],
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
                'Rehandling' as [SourceOfContext],
                -- Load Factors from Mapping (User Request Step 1201)
                M.ManagementQtyTrip,
                M.NTPCQtyTrip
            FROM [Trans].[TblMaterialRehandling] T
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

        // Clone for History Fallback (No Date Filter)
        let queryHistory = queryRehandling + ` ORDER BY T.SlNo DESC`;

        // Apply Date Filter to Primary
        if (date) {
            queryRehandling += ` AND T.RehandlingDate = @DateParam`;
            request.input('DateParam', date);
        }

        if (ShiftId) {
            queryRehandling += ` AND T.ShiftId = @ShiftIdParam`;
            request.input('ShiftIdParam', ShiftId);
        }

        queryRehandling += ` ORDER BY T.SlNo DESC`;

        // Execute Primary (Date Specific)
        console.log("🚀 [Rehandling Context] Query Primary:", queryRehandling);
        let resRehandling = await request.query(queryRehandling);

        if (resRehandling.recordset.length > 0) {
            contextData = resRehandling.recordset[0];
            console.log("✅ [MR-Context] Found Primary Date Match:", date, "Data:", contextData);
            console.log("✅ Found Context for Date:", date);
        } else if (!ShiftId) {
            // Fallback to History (Last Entry Ever) - ONLY if Strict Shift is NOT enabled
            console.log("⚠️ [MR-Context] No entry for Date", date, ". Fetching Latest History...");
            console.log("   History Query:", queryHistory);

            // New Request for History
            const pool2 = await getDbConnection();
            const req2 = pool2.request();
            req2.input('UserId', user.id);

            const resHistory = await req2.query(queryHistory);
            if (resHistory.recordset.length > 0) {
                contextData = resHistory.recordset[0];
                console.log("✅ [MR-Context] Found Historical Context. Date:", contextData.Date);
            } else {
                console.log("❌ [MR-Context] No History Found.");
            }
        }

        // Return whatever we found (or null)
        return NextResponse.json({ success: true, data: contextData });

    } catch (error) {
        console.error("❌ API Error (rehandling/last-context):", error);
        return NextResponse.json({ success: false, message: error.message, stack: error.stack }, { status: 500 });
    }
}
