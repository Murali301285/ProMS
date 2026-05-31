export const dynamic = 'force-dynamic';


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

        let contextData = null;

        // --- STEP 1: Attempt to fetch from Equipment Reading ---
        let queryReading = `
            SELECT TOP 1 
                [Date],
                ShiftId, 
                ShiftInchargeId,
                MidScaleInchargeId,
                RelayId,
                ActivityId,
                EquipmentId,
                OperatorId,
                'EquipmentReading' as [SourceOfContext]
            FROM [Trans].[TblEquipmentReading]
            WHERE IsDelete = 0 
        `;

        let queryHistory = queryReading + ` AND (CreatedBy = @UserId OR UpdatedBy = @UserId) ORDER BY SlNo DESC`;

        if (date) {
            queryReading += ` AND [Date] = @DateParam`;
            request.input('DateParam', date);
        }

        if (ShiftId) {
            // Global Scope for Specific Context
            queryReading += ` AND ShiftId = @ShiftIdParam`;
            request.input('ShiftIdParam', ShiftId);
        } else {
            // User Scope for Initial/Partial
            queryReading += ` AND (CreatedBy = @UserId OR UpdatedBy = @UserId)`;
        }

        queryReading += ` ORDER BY SlNo DESC`;

        // Execute Primary (Date Specific)
        console.log("🚀 [EqReading Context] Query Primary:", queryReading);
        let resReading = await request.query(queryReading);

        if (resReading.recordset.length > 0) {
            contextData = resReading.recordset[0];
            console.log("✅ [EqReading Context] Found Primary Date Match:", date, "Data:", contextData);
        } else if (date && ShiftId) {
            // Fallback to Loading From Mines (TblLoading)
            // User Req: "If a record is found there for that same Date/Shift, it will auto-fill... and LOCK them."
            console.log("⚠️ [EqReading Context] No Reading Data. Checking Loading From Mines for Date:", date, "Shift:", ShiftId);

            const queryLoading = `
                 SELECT TOP 1 
                     ShiftInchargeId,
                     MidScaleInchargeId,
                     RelayId,
                     'LoadingFallback' as SourceOfContext
                 FROM [Trans].[TblLoading]
                 WHERE LoadingDate = @DateParam
                 AND ShiftId = @ShiftIdParam
                 AND IsDelete = 0
             `;
            // ShiftIdParam already defined above

            const resLoading = await request.query(queryLoading);

            if (resLoading.recordset.length > 0) {
                contextData = resLoading.recordset[0];
                console.log("✅ [EqReading Context] Found Loading Fallback:", contextData);
            } else {
                console.log("❌ [EqReading Context] No Loading Data found either.");
                // Should we still fetch generic history if no fallback found? 
                // Usually yes, if we want to pre-fill last known context for convenience.
            }
        }

        if (!contextData && !date) {
            // Fallback to History (Last Entry Ever)
            console.log("⚠️ [EqReading Context] No specific entry. Fetching Latest History...");
            console.log("   History Query:", queryHistory);

            const pool2 = await getDbConnection();
            const req2 = pool2.request();
            req2.input('UserId', user.id);

            const resHistory = await req2.query(queryHistory);
            if (resHistory.recordset.length > 0) {
                contextData = resHistory.recordset[0];
                console.log("✅ [EqReading Context] Found Historical Context. Date:", contextData.Date);
            } else {
                console.log("❌ [EqReading Context] No History Found.");
            }
        }

        return NextResponse.json({ success: true, data: contextData });

    } catch (error) {
        console.error("❌ API Error (eq-reading/last-context):", error);
        // Fallback for column names if ManPowerInShift doesn't exist in Reading
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
