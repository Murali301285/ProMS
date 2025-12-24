
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
            SELECT TOP 1 
                RehandlingDate as Date, 
                CreatedBy 
            FROM [Trans].[TblMaterialRehandling]
            WHERE isDelete = 0
            ORDER BY CreatedDate DESC
        `;
        const data = await executeQuery(query);
        const result = data.length > 0 ? data[0] : null;

        return NextResponse.json({ success: true, data: result });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
