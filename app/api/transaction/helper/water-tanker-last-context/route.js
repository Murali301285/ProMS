import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const query = `
            SELECT TOP 1
                EntryDate,
                ShiftId
            FROM [Transaction].[TblWaterTankerEntry]
            WHERE IsDelete = 0
            ORDER BY CreatedDate DESC
        `;

        const data = await executeQuery(query);

        return NextResponse.json({
            success: true,
            data: data.length > 0 ? data[0] : null
        });

    } catch (error) {
        console.error("Water Tanker Last Context Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
