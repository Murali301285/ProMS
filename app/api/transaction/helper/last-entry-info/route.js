export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 
                T.LoadingDate,
                T.CreatedDate, 
                U.EmpName AS CreatedByName
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            WHERE T.IsDelete = 0
            ORDER BY T.CreatedDate DESC
        `;

        const result = await executeQuery(query, []);

        if (result.length > 0) {
            return NextResponse.json({ success: true, data: result[0] });
        } else {
            return NextResponse.json({ success: true, data: null });
        }
    } catch (error) {
        console.error("Last Entry Info Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
