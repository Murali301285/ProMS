
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 
                T.RehandlingDate as Date, 
                T.CreatedBy,
                ISNULL(U.EmpName, 'Unknown') as CreatedByName
            FROM [Trans].[TblMaterialRehandling] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            WHERE T.isDelete = 0
            ORDER BY T.CreatedDate DESC
        `;
        const data = await executeQuery(query);
        const result = data.length > 0 ? data[0] : null;

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
