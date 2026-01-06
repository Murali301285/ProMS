
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
            AND (CreatedBy = @UserId OR UpdatedBy = @UserId)
        `;

        let queryHistory = queryReading + ` ORDER BY SlNo DESC`;

        if (date) {
            queryReading += ` AND [Date] = @DateParam`;
            request.input('DateParam', date);
        }

        queryReading += ` ORDER BY SlNo DESC`;

        // Execute Primary (Date Specific)
        console.log("🚀 [EqReading Context] Query Primary:", queryReading);
        let resReading = await request.query(queryReading);

        if (resReading.recordset.length > 0) {
            contextData = resReading.recordset[0];
            console.log("✅ [EqReading Context] Found Primary Date Match:", date, "Data:", contextData);
        } else {
            // Fallback to History
            console.log("⚠️ [EqReading Context] No entry for Date", date, ". Fetching Latest History...");
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
