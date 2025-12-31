
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

        // Smart Date Context Logic:
        // 1. If Date provided: Get Last Context for THAT Date (Date Specific)
        // 2. If Date NOT provided: Get Absolute Last Context (ignoring date)

        let query = `
            SELECT TOP 1
                t.Date,
                t.BlastingPatchId,
                t.SMESupplierId,
                t.SMEQty,
                t.MaxChargeHole as MaxCharge, -- Alias to match Form
                t.PPV,
                t.NoofHolesDeckCharged as DeckHoles, -- Alias
                t.NoofWetHole as WetHoles, -- Alias
                t.AirPressure
            FROM [Trans].[TblBlasting] t
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: session.id }];

        if (reqDate) {
            // Date Specific Context
            query += ` AND CAST(t.Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: reqDate });
        }

        // Always order by SlNo DESC (Latest Created) because CreatedDate can be NULL
        query += ` ORDER BY t.SlNo DESC`;

        const data = await executeQuery(query, params);

        return NextResponse.json(data[0] || {});

    } catch (error) {
        console.error("Blasting Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context' }, { status: 500 });
    }
}
