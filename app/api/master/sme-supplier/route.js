
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
            SELECT SlNo, Name 
            FROM [Master].[TblSMESupplier] 
            WHERE IsActive = 1 AND IsDelete = 0
            ORDER BY Name
        `);
        return NextResponse.json({ success: true, data: result.recordset });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
