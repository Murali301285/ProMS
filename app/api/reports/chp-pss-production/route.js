import { getDbConnection, sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { month, plantId } = body; // month format 'YYYY-MM'

        if (!month || !plantId) {
            return NextResponse.json({ success: false, message: 'Month and Plant are required' }, { status: 400 });
        }

        // Month input '2025-12' -> '2025-12-01'
        const dateInput = `${month}-01`;

        const pool = await getDbConnection();
        const request = pool.request();
        request.input('Month', sql.Date, dateInput);
        request.input('PlantId', sql.Int, plantId);

        const result = await request.query('EXEC ProMS2_SPReportCHPPSSProduction @Month, @PlantId');

        // Result sets: [0] = Production, [1] = Stoppages, [2] = All Reasons
        return NextResponse.json({
            success: true,
            production: result.recordsets[0] || [],
            stoppages: result.recordsets[1] || [],
            allReasons: result.recordsets[2] || []
        });
    } catch (error) {
        console.error("CHP PSS Report API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
