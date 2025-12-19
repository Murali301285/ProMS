import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const patchId = searchParams.get('patchId');

        if (!patchId) {
            return NextResponse.json({ error: 'Patch ID is required' }, { status: 400 });
        }

        const pool = await getDbConnection();
        // Requirement: check[DrillingPatchId],No of Holes, Average Depth from [Trans].[TblDrilling] where [DrillingPatchId] = Blasting PatchID
        // Average Depth = TotalMeters / NoofHoles. 
        // If AverageDepth column exists (which I confirmed), I'll use that. 
        // But confirm if it's populated. If null, I'll calculate it.
        const query = `
            SELECT TOP 1 
                SlNo, 
                NoofHoles, 
                TotalMeters,
                AverageDepth 
            FROM [Trans].[TblDrilling] 
            WHERE DrillingPatchId = '${patchId}' AND IsDelete = 0
        `;

        const result = await pool.request().query(query);

        if (result.recordset.length === 0) {
            return NextResponse.json({ found: false });
        }

        const data = result.recordset[0];

        let avgDepth = data.AverageDepth;
        if (!avgDepth && data.NoofHoles > 0) {
            avgDepth = (data.TotalMeters / data.NoofHoles).toFixed(2);
        }

        return NextResponse.json({
            found: true,
            data: {
                holes: data.NoofHoles,
                averageDepth: avgDepth
            }
        });

    } catch (error) {
        console.error('Drilling Lookup Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
