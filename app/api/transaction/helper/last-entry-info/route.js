import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 
                T.LoadingDate, 
                U.UserName AS CreatedByName
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblUser] U ON T.CreatedBy = U.SlNo
            ORDER BY T.SlNo DESC
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
