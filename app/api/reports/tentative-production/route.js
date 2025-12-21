import { getDbConnection, sql, executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (type === 'shifts') {
            const data = await executeQuery('EXEC ProMS2_SPGetShifts');
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ success: false, message: 'Invalid Type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    // ... existing POST code ...
    try {
        const { date, shiftId } = await req.json();

        if (!date || !shiftId) {
            return NextResponse.json({ success: false, message: 'Date and Shift are required' }, { status: 400 });
        }

        const pool = await getDbConnection();

        // SQL Query provided by USER
        // Note: Using pool.request().query() for multiple statements in one go.
        const query = `EXEC ProMS2_SPReportTentativeProduction @Date = @dateInput, @ShiftId = @shiftIdInput`;

        const request = pool.request();
        request.input('dateInput', sql.Date, date);
        request.input('shiftIdInput', sql.Int, shiftId);

        const result = await request.query(query);

        // Map recordsets to logical names
        const data = {
            wasteHandling: result.recordsets[0] || [],
            coalProduction: result.recordsets[1] || [],
            wp3: result.recordsets[2] || [],
            obRehandling: result.recordsets[3] || [],
            coalRehandling: result.recordsets[4] || [],
            headerInfo: result.recordsets[5]?.[0] || {}
        };

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Tentative Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
