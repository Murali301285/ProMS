import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { decode } from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { date, shiftId } = body;

        if (!date) {
            return NextResponse.json({ success: false, message: "Date is required" }, { status: 400 });
        }

        // Get Logged In User
        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        let username = '';
        if (token) {
            const decoded = decode(token.value);
            username = decoded?.username || '';
        }

        const pool = await getDbConnection();

        // Query Helper
        const fetchRecords = async (d, s, u) => {
            let q = `
                SELECT 
                    T.SlNo, T.Date, S.ShiftName, R.Name as RelayName, E.EquipmentName,
                    T.OMR, T.CMR, T.TotalUnit, U.Name as UnitName, T.Remarks,
                    T.CreatedBy, T.CreatedDate
                FROM [Trans].[TblElectricalEntry] T
                LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
                LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
                LEFT JOIN [Master].[TblEquipment] E ON T.EquipmentId = E.SlNo
                LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
                WHERE T.IsDelete = 0 AND CAST(T.Date AS DATE) = @date
            `;

            if (s) q += ` AND T.ShiftId = @shiftId`;
            if (u) q += ` AND T.CreatedBy = @user`;

            q += ` ORDER BY T.CreatedDate DESC`; // Recent first

            const req = pool.request();
            req.input('date', sql.Date, d);
            if (s) req.input('shiftId', sql.Int, s);
            if (u) req.input('user', sql.VarChar, u);

            const result = await req.query(q);
            return result.recordset;
        };

        let data = [];

        if (shiftId) {
            // Priority 1: Date + Shift + User
            data = await fetchRecords(date, shiftId, username);
            if (data.length > 0) return NextResponse.json({ success: true, data });

            // Priority 2: Date + Shift + Any User
            data = await fetchRecords(date, shiftId, null);
            if (data.length > 0) return NextResponse.json({ success: true, data });
        }

        // Fallback 1: Date + User (if Shift logic failed or skipped)
        data = await fetchRecords(date, null, username);
        if (data.length > 0) return NextResponse.json({ success: true, data });

        // Fallback 2: Date + Any User
        data = await fetchRecords(date, null, null);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Electrical Entry Recent API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
