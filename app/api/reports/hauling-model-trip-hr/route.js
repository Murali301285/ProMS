import { getDbConnection, sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const date = body.date;

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const request = pool.request();
        request.input('Date', sql.Date, date);

        const result = await request.query('EXEC ProMS2_SPReportHaulingModelWise @Date');

        return NextResponse.json({ success: true, data: result.recordset || [] });
    } catch (error) {
        console.error("Hauling Model Report API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
