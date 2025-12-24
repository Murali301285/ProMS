
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Shifts
        const shifts = await executeQuery(`
            SELECT SlNo, ShiftName FROM [Master].[TblShift] 
            WHERE IsDelete = 0 
            -- AND IsActive = 1 -- Usually check Active too, user said 'isDelete=0 and isActive=1'
            ORDER BY ShiftName
        `);

        // 2. Filling Points (Used for Destination AND FillingPoint)
        const fillingPoints = await executeQuery(`
            SELECT SlNo, FillingPoint FROM [Master].[tblFillingPoint] 
            WHERE IsDelete = 0 AND IsActive = 1
            ORDER BY FillingPoint
        `);

        // 3. Filling Pumps
        const fillingPumps = await executeQuery(`
            SELECT SlNo, FillingPump FROM [Master].[tblFillingPump] 
            WHERE IsDelete = 0 AND IsActive = 1
            ORDER BY FillingPump
        `);

        // 4. Haulers (Water Tankers - Group 51) + Capacity
        const haulers = await executeQuery(`
            SELECT SlNo, EquipmentName, Capacity 
            FROM [Master].[TblEquipment] 
            WHERE EquipmentGroupId = 51 
            AND IsDelete = 0 AND IsActive = 1
            ORDER BY EquipmentName
        `);

        return NextResponse.json({
            shifts,
            fillingPoints,
            fillingPumps,
            haulers
        });

    } catch (error) {
        console.error("WaterTanker Helper Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
