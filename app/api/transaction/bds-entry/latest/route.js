import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 t.Date, t.CreatedBy, t.SMECategoryId, s.Category as SMECategoryName,
                ISNULL(U.EmpName, 'Unknown') as CreatedByName
            FROM [Trans].[TblBDSEntry] t
            LEFT JOIN [Master].[TblSMECategory] s ON t.SMECategoryId = s.SlNo
            LEFT JOIN [Master].[TblUser_New] U ON t.CreatedBy = U.SlNo
            WHERE t.isDelete = 0
            ORDER BY t.CreatedDate DESC
        `;
        const data = await executeQuery(query);
        const result = data.length > 0 ? data[0] : null;
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
