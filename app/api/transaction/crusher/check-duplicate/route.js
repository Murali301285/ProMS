
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { Date: date, ShiftId, PlantId, EquipmentId } = await request.json();

        if (!date || !ShiftId || !PlantId || !EquipmentId) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const result = await pool.request()
            .input('Date', sql.Date, date)
            .input('ShiftId', sql.Int, ShiftId)
            .input('PlantId', sql.Int, PlantId)
            .input('EquipmentId', sql.Int, EquipmentId)
            .query(`
                SELECT SlNo FROM [Trans].[TblCrusher] 
                WHERE Date = @Date AND ShiftId = @ShiftId AND PlantId = @PlantId AND HaulerId = @EquipmentId AND IsDelete = 0
            `);

        if (result.recordset.length > 0) {
            return NextResponse.json({ success: true, exists: true, message: 'Data already exists for this combination.' });
        }

        return NextResponse.json({ success: true, exists: false });

    } catch (error) {
        console.error("Check Duplicate Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
