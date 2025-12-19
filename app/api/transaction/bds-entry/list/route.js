import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        const query = `
            SELECT 
                t.*,
                p.PartyName,
                t.CreatedBy as CreatedByName
            FROM [Trans].[TblBDSEntry] t
            LEFT JOIN [Master].[tblParty] p ON t.PartyId = p.SlNo
            WHERE t.isDelete = 0 
            AND t.Date >= @fromDate 
            AND t.Date <= @toDate
            ORDER BY t.CreatedDate DESC
        `;

        const params = [
            { name: 'fromDate', value: fromDate },
            { name: 'toDate', value: toDate }
        ];

        const data = await executeQuery(query, params);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
