
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
        const { Date: reqDate } = body;

        // Logic: Get last entry for this user on the SPECIFIC DATE
        // If no date provided, maybe fallback to overall last? Or just return nothing?
        // User asked for "once date changed -> check". So Date is crucial.

        let query = `
            SELECT TOP 1
                Date,
                DrillingPatchId,
                EquipmentId,
                MaterialId,
                LocationId,
                SectorId,
                ScaleId,
                StrataId,
                DepthSlabId,
                DrillingAgencyId
            FROM [Trans].[TblDrilling]
            WHERE IsDelete = 0 
            AND (CreatedBy = @userId OR UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: session.id }];

        if (reqDate) {
            query += ` AND CAST(Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: reqDate });
        }

        query += ` ORDER BY CreatedDate DESC`;

        const data = await executeQuery(query, params);

        return NextResponse.json(data[0] || {});

    } catch (error) {
        console.error("Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context' }, { status: 500 });
    }
}
