import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        const body = await req.json();
        const { date, ShiftId } = body;

        // Determine User ID from Token
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        let userId = 0;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id; // Corrected from sub/userId based on standard usage
            } catch (e) {
                console.warn("Token Decode Failed:", e.message);
            }
        }

        console.log("🔍 [API-SMART-CTX-INT] User:", userId, "Date:", date, "Shift:", ShiftId);

        // Function to fetch context
        const fetchContext = async (scopeUserId) => {
            let query = `
                SELECT TOP 1 
                    ShiftId, RelayId, SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId,
                    (SELECT STRING_AGG(OperatorId, ',') FROM [Trans].[TblInternalTransferIncharge] WHERE TransferId = T.SlNo) as ShiftInchargeIds,
                    ManPowerInShift as ManPower, UnitId as Unit
                FROM [Trans].[TblInternalTransfer] T
                WHERE TransferDate = @date
                AND IsDelete = 0
            `;

            const params = [{ name: 'date', type: sql.Date, value: date }];

            if (ShiftId) {
                query += ` AND ShiftId = @ShiftId`;
                params.push({ name: 'ShiftId', type: sql.Int, value: ShiftId });
            }

            if (scopeUserId) {
                query += ` AND CreatedBy = @uid`;
                params.push({ name: 'uid', type: sql.Int, value: scopeUserId });
            }

            query += ` ORDER BY SlNo DESC`; // Get Latest Entry

            const res = await executeQuery(query, params);
            return res[0] || null;
        };

        // 1. Try Fetching USER'S Last Entry
        let data = await fetchContext(userId);
        let scope = 'USER';

        // 2. If Not Found -> Fetch GLOBAL Last Entry
        if (!data) {
            console.log("⚠️ [SmartContext-Int] No User Data. Falling back to GLOBAL.");
            data = await fetchContext(null);
            scope = 'GLOBAL';
        }

        return NextResponse.json({ success: true, data, scope });

    } catch (error) {
        console.error("❌ [API-SMART-CTX-INT] Error:", error);
        return NextResponse.json({ success: false, message: 'Server Error: ' + error.message }, { status: 500 });
    }
}
