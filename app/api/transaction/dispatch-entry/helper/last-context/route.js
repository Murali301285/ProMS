import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { Date: reqDate } = body; // Optional Date filter

        let query = `
            SELECT TOP 1
                t.SlNo,
                t.Date,
                t.DispatchLocationId,
                t.Trip,
                t.TotalQty,
                t.UOMId,
                t.Remarks,
                t.CreatedBy,
                t.CreatedDate
            FROM [Trans].[TblDispatchEntry] t
            WHERE t.isDelete = 0
        `;

        const params = {};

        if (reqDate) {
            query += ` AND CAST(t.Date AS DATE) = @Date`;
            params.Date = reqDate;
        }

        // Order by Created for absolute last, or specific logic if needed
        // Using SlNo DESC as proxy for latest creation
        query += ` ORDER BY t.SlNo DESC`;

        const data = await executeQuery(query, params);

        return NextResponse.json({
            success: true,
            data: data.length > 0 ? data[0] : null
        });

    } catch (error) {
        console.error("Dispatch Entry Last Context Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
