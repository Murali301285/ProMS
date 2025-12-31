import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../../lib/db';
import sql from 'mssql';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const zoneId = searchParams.get('zoneId') || null;
        const pssId = searchParams.get('pssId') || null;

        if (!date) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        const pool = await getDbConnection();

        const result = await pool.request()
            .input('Date', sql.Date, date)
            .input('ZoneId', sql.Int, zoneId)
            .input('PSSId', sql.Int, pssId)
            .execute('ProMS2_SPDashboardCrushing');

        // Set 1: Shift Highest, Set 2: Day Highest, Set 3: Month Highest, Set 4: Stoppage Analysis
        const shiftHigh = result.recordsets[0] || [];
        const dayHigh = result.recordsets[1] || [];
        const monthHigh = result.recordsets[2] || [];
        const stoppages = result.recordsets[3] || [];

        return NextResponse.json({
            production: {
                shift: shiftHigh[0] || null,
                day: dayHigh[0] || null,
                month: monthHigh[0] || null
            },
            stoppages: stoppages
        });

    } catch (error) {
        console.error('Error fetching dashboard crushing data:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
