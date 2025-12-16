import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 
                T.TransferDate, 
                U.UserName as CreatedByName
            FROM [Trans].[TblInternalTransfer] T
            LEFT JOIN [Master].[TblUser] U ON T.CreatedBy = U.UserId
            ORDER BY T.SlNo DESC
        `;
        const result = await executeQuery(query);
        return NextResponse.json({ success: true, data: result[0] || null });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
