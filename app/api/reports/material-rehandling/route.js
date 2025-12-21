import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range is required' }, { status: 400 });
        }

        const query = `EXEC ProMS2_SPReportMaterialRehandling @FromDate = @fromDateInput, @ToDate = @toDateInput`;

        const data = await executeQuery(query, [
            { name: 'fromDateInput', value: fromDate },
            { name: 'toDateInput', value: toDate }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Material Rehandling Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
