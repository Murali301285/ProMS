
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

        // Query: Fetch configuration fields AND 'Type'
        let query = `
            SELECT TOP 1
                t.SlNo,
                t.Date,
                t.ShiftId,
                t.RelayId,
                t.PlantId,
                t.EquipmentId,
                t.UnitId,
                t.OMR,
                t.CMR,
                t.TotalUnit,
                t.Remarks,
                t.Type, -- Critical: Copy Type (Equipment/Plant)
                t.CreatedBy,
                t.CreatedDate
            FROM [Trans].[TblElectricalEntry] t
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

        return NextResponse.json({ data: data[0] || null });

    } catch (error) {
        console.error("Electrical Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context', error: error.message }, { status: 500 });
    }
}
