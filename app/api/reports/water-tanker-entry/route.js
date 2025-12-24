
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { date, shiftId } = await req.json(); // Expecting 'date' from singleDate filter

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        const query = `EXEC ProMS2_SPReportWaterTankerEntry @Date = @dateInput, @ShiftId = @shiftInput`;

        const data = await executeQuery(query, [
            { name: 'dateInput', value: date },
            { name: 'shiftInput', value: shiftId || null } // Pass null if 'All' or empty
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Water Tanker Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
