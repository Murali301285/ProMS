
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
            SELECT TOP 1 
                Date,
                CreatedBy 
            FROM [Trans].[TblBlasting]
            WHERE isDelete = 0
            ORDER BY CreatedDate DESC
        `);

        if (result.recordset.length > 0) {
            return NextResponse.json({ success: true, data: result.recordset[0] });
        }
        return NextResponse.json({ success: true, data: null });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
