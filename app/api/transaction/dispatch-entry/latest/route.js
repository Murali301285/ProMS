import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 t.Date, t.CreatedBy 
            FROM [Trans].[TblDispatchEntry] t
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
