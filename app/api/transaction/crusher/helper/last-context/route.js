
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await authenticateUser(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const userId = session.id;

        // Smart Context Logic:
        // 1. If Date check is requested (Date Change), fetch specific date.
        // 2. If NO date (Initial Load), fetch absolute LAST entry.

        // Note: For Context, we only usually care about "Configuration" fields
        // like Shift, Plant, Hauler, etc. Transactional fields (Qty, Hours) 
        // might not be relevant, but we return the full row and let Frontend decide.

        let query = `
            SELECT TOP 1
                t.SlNo,
                t.Date,
                t.ShiftId,
                t.ShiftInChargeId,
                t.MidScaleInchargeId,
                t.ManPowerInShift,
                t.PlantId,
                t.ProductionUnitId,
                t.HaulerEquipmentId as EquipmentId,
                t.TripQtyUnitId,
                t.CreatedBy,
                t.CreatedDate
            FROM [Trans].[TblCrusher] t
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: userId }];

        if (body.Date) {
            // Check Specific Date
            query += ` AND CAST(t.Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: body.Date });
        }

        // Sorting: Always latest created (or SlNo)
        query += ` ORDER BY t.SlNo DESC`;

        const data = await executeQuery(query, params);

        // Return null if no record found (Frontend will strip non-date)
        return NextResponse.json({ data: data[0] || null });

    } catch (error) {
        console.error("Crusher Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context', error: error.message }, { status: 500 });
    }
}
