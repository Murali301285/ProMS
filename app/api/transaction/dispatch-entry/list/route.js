import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        // Get Party Name via Look up
        // Get CreatedBy Name if possible (assuming simple text or lookup)
        // User requirements: Date, Party, Vehicle No, Weighment(Kg). Counter Reading(Kg), Loading Sheet(Kg) ,Standard Deduction(kg), Accepted Quantity(kg), Challan No, Remarks, CreatedBy, Created DateTime, UpdatedBy, Updated DateTime

        const query = `
            SELECT 
                t.*,
                p.PartyName,
                -- Format Dates for consistent UI if needed, or handle in frontend
                t.CreatedBy as CreatedByName -- Assuming text, or join with User table if needed. Using direct column for now as per schema
            FROM [Trans].[TblBDSEntry] t
            LEFT JOIN [Master].[tblParty] p ON t.PartyId = p.SlNo
            WHERE t.isDelete = 0 
            AND t.Date >= @fromDate 
            AND t.Date <= @toDate
            ORDER BY t.CreatedDate DESC
        `;

        const data = await executeQuery(query, { fromDate, toDate });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Dispatch Entry List Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
