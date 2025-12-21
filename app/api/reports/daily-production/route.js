import { getDbConnection, sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { date } = await req.json();

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const request = pool.request();
        request.input('Date', sql.Date, date);

        const result = await request.query('EXEC ProMS2_SPReportDailyProduction @Date');

        // Map result sets
        // 0: Shift Prod Coal
        // 1: Shift Prod Waste
        // 2: Coal Details (FTD/MTD/YTD)
        // 3: Waste Details (FTD/MTD/YTD)
        // 4: Crushed Coal
        // 5: Coal Crushing
        // 6: Crusher Coal Qty (Summary)
        // 7: Blasting
        // 8: Dump Rehandling
        // 9-12: Placeholders
        // 13: Remarks

        const data = result.recordsets;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Daily Production Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
