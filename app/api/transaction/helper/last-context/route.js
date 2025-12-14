import { getDbConnection } from '@/lib/db';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        const body = await req.json();
        const { date, scope } = body; // Scope: ME or ALL

        if (!date) return Response.json({ success: false, message: 'Date required' });

        const pool = await getDbConnection();

        // Determine User ID for Priority 1 via JWT
        const token = cookies().get('auth_token')?.value;
        let userId = 0;

        if (token) {
            const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
            try {
                const decoded = jwt.verify(token, SECRET);
                userId = decoded.id || 0;
            } catch (e) {
                console.warn("Token verification failed in last-context", e.message);
            }
        }

        // Fetch Last Transaction Logic with Priority
        // Priority 1: Logged in User
        // Priority 2: Any User (Global Fallback)

        let shiftFilter = '';
        if (body.ShiftId) {
            shiftFilter = `AND ShiftId = @shiftId`;
        }

        console.log("🔍 Last Context Input:", { date, ShiftId: body.ShiftId, userId });

        const baseQuery = `
            SELECT TOP 1 
                T.ShiftId, 
                T.RelayId, 
                T.SourceId, 
                T.DestinationId, 
                T.MaterialId, 
                T.HaulerEquipmentId, 
                T.LoadingMachineEquipmentId AS LoadingMachineId,
                T.ManPowerInShift AS ManPower,
                T.UnitId AS Unit,
                (
                    SELECT STUFF((
                        SELECT ',' + CAST(LSI.OperatorId AS VARCHAR)
                        FROM [Trans].[TblLoadingShiftIncharge] LSI
                        WHERE LSI.LoadingId = T.SlNo
                        FOR XML PATH('')
                    ), 1, 1, '')
                ) AS ShiftInchargeIds
            FROM [Trans].[TblLoading] T
            WHERE CAST(T.LoadingDate AS DATE) = @date ${shiftFilter}
        `;

        console.log("🔍 Last Context Query Params:", { date, ShiftId: body.ShiftId || 0, userId });

        // 1. Try Priority 1: Logged In User
        const userResult = await pool.request()
            .input('date', date)
            .input('shiftId', body.ShiftId || 0) // Safe default
            .input('userId', userId || 0)
            .query(`${baseQuery} AND T.CreatedBy = @userId ORDER BY T.CreatedDate DESC`);

        // Need userId param if using it
        if (userResult.recordset.length > 0) {
            console.log("✅ Context Found (Priority 1 - User):", userResult.recordset[0]);
            return Response.json({ success: true, data: userResult.recordset[0] });
        }

        // 2. Try Priority 2: Global (Any User) - only if not found for user (or scope is ALL explicit?)
        // User requested: "priority 2-> if not Priority 1 then check... by any user"
        const globalResult = await pool.request()
            .input('date', date)
            .input('shiftId', body.ShiftId || 0)
            .query(`${baseQuery} ORDER BY T.CreatedDate DESC`);

        if (globalResult.recordset.length > 0) {
            console.log("✅ Context Found (Priority 2 - Global):", globalResult.recordset[0]);
            return Response.json({ success: true, data: globalResult.recordset[0] });
        } else {
            console.warn("❌ No Context Found");
            return Response.json({ success: false, message: 'No history found' });
        }

    } catch (error) {
        console.error('Last Context Error:', error);
        return Response.json({ success: false, message: 'Server Error' });
    }
}
