
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const { equipmentId } = await req.json();

        if (!equipmentId) {
            return NextResponse.json({ success: false, message: 'Equipment Id required' });
        }

        const query = `
            SELECT TOP 1 CHMR, CKMR
            FROM [Trans].[TblEquipmentReading]
            WHERE EquipmentId = @eid AND IsDelete = 0
            ORDER BY [Date] DESC, CreatedDate DESC
        `;

        const result = await executeQuery(query, [
            { name: 'eid', type: sql.Int, value: equipmentId }
        ]);

        if (result.length > 0) {
            return NextResponse.json({
                success: true,
                data: {
                    OHMR: result[0].CHMR,
                    OKMR: result[0].CKMR
                }
            });
        } else {
            return NextResponse.json({ success: true, data: null });
        }

    } catch (error) {
        console.error("Meter Reading Fetch Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
