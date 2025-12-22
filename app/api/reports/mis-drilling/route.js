import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('Date', sql.Date, date)
            .execute('ProMS2_SPReportMISDrilling');

        return NextResponse.json({
            coal: result.recordsets[0] || [],
            ob: result.recordsets[1] || []
        });

    } catch (error) {
        console.error('MIS Drilling Report Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
