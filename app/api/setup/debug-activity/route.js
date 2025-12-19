import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const eqId = 735;

        const readings = await executeQuery(`
            SELECT TOP 5 * FROM [Trans].[TblEquipmentReading] 
            WHERE EquipmentId = @eqId 
            ORDER BY Date DESC
        `, [
            { name: 'eqId', type: 'Int', value: eqId }
        ]);

        return NextResponse.json({ debugVersion: 'V4', readings });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
