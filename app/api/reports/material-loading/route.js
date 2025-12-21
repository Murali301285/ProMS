import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range is required' }, { status: 400 });
        }

        // Note: The user provided query has many optional filters (@ShiftId, @DestinationId etc.)
        // For now, we only bind @FromDate and @ToDate. Other variables are hardcoded to 0/empty to fetch all.
        // Note: The user provided query has many optional filters (@ShiftId, @DestinationId etc.)
        // For now, we only bind @FromDate and @ToDate. Other variables are hardcoded to 0/empty in the SP to fetch all.
        const query = `EXEC ProMS2_SPReportMaterialLoading @FromDate = @fromDateInput, @ToDate = @toDateInput`;

        const data = await executeQuery(query, [
            { name: 'fromDateInput', value: fromDate },
            { name: 'toDateInput', value: toDate }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Material Loading Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
