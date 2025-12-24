
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
            SELECT TOP 1 
                Date,
                CreatedBy 
            FROM [Trans].[TblCrusher]
            WHERE isDelete = 0
            ORDER BY CreatedDate DESC
        `);

        if (result.recordset.length > 0) {
            return NextResponse.json({ success: true, data: result.recordset[0] });
        }
        return NextResponse.json({ success: true, data: null });

    } catch (error) {
        console.error("Error fetching latest crusher transaction:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
