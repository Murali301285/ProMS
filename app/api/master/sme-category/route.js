import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
            SELECT SlNo as id, Category as name 
            FROM [Master].[TblSMECategory] 
            WHERE IsDelete = 0 
            ORDER BY Category ASC
        `;
        const data = await executeQuery(query);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
