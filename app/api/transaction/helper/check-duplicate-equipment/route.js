
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const { Date: date, ShiftId, RelayId, ActivityId, EquipmentId } = await req.json();

        const query = `
            SELECT COUNT(1) as count
            FROM [Trans].[TblEquipmentReading]
            WHERE 
                CAST([Date] AS DATE) = @date AND
                ShiftId = @ShiftId AND
                RelayId = @RelayId AND
                ActivityId = @ActivityId AND
                EquipmentId = @EquipmentId AND
                IsDelete = 0
        `;

        const result = await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'ActivityId', type: sql.Int, value: ActivityId },
            { name: 'EquipmentId', type: sql.Int, value: EquipmentId }
        ]);

        return NextResponse.json({
            exists: result[0].count > 0
        });

    } catch (error) {
        console.error("Duplicate Check Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
