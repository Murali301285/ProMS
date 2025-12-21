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

        const result = await request.query('EXEC ProMS2_SPReportOperatorPerformanceLoading @Date');

        return NextResponse.json({ success: true, data: result.recordset || [] });
    } catch (error) {
        console.error("Operator Performance Report API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
