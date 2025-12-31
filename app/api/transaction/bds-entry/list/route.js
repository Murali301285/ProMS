import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        const query = `
            SELECT 
                t.*,
                s.Category as SMECategoryName,
                UC.EmpName as CreatedByName,
                UU.EmpName as UpdatedByName
            FROM [Trans].[TblBDSEntry] t
            LEFT JOIN [Master].[TblSMECategory] s ON t.SMECategoryId = s.SlNo
            LEFT JOIN [Master].[TblUser_New] UC ON t.CreatedBy = UC.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON t.UpdatedBy = UU.SlNo
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
