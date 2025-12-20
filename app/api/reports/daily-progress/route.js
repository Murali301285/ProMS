import { getDbConnection, sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { date } = await request.json();

        if (!date) {
            return NextResponse.json({ success: false, message: "Date is required" }, { status: 400 });
        }

        const pool = await getDbConnection();

        const result = await pool.request()
            .input('Date', sql.Date, date)
            .execute('SPReportDailyProgress');

        // Map Result Sets based on SP definition
        // 0: Production Details
        // 1: Drilling Details
        // 2: Blasting Details
        // 3: Crusher Details
        // 4: Header Info

        const productionData = result.recordsets[0] || [];
        const drillingData = result.recordsets[1] || [];
        const blastingData = result.recordsets[2] || [];
        const crusherData = result.recordsets[3] || [];
        const headerInfo = result.recordsets[4]?.[0] || {};

        return NextResponse.json({
            success: true,
            data: {
                production: productionData,
                drilling: drillingData,
                blasting: blastingData,
                crusher: crusherData,
                headerInfo: headerInfo
            }
        });

    } catch (error) {
        console.error("DPR Generation Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
