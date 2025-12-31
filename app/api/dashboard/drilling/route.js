import { NextResponse } from 'next/server';
import { getDbConnection } from '../../../../lib/db';
import sql from 'mssql';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        const pool = await getDbConnection();

        // 1. Fetch Drilling Data
        const drillingResult = await pool.request()
            .input('Date', sql.Date, date)
            .execute('ProMS2_SPDashboardDrilling');

        // 2. Fetch Blasting Data
        const blastingResult = await pool.request()
            .input('Date', sql.Date, date)
            .execute('ProMS2_SPDashboardBlasting');

        // Drilling Results
        // Set 1: Shift Performance, Set 2: Day Performance, Set 3: Month Performance, Set 4: Recovery
        const drillShift = drillingResult.recordsets[0] || [];
        const drillDay = drillingResult.recordsets[1] || [];
        const drillMonth = drillingResult.recordsets[2] || [];
        const drillRecovery = drillingResult.recordsets[3] || [];

        // Blasting Results
        // Set 1: SME Supplier, Set 2: Vol Usage
        const blastSupplier = blastingResult.recordsets[0] || [];
        const blastExplosive = blastingResult.recordsets[1] || [];

        return NextResponse.json({
            drilling: {
                shift: drillShift[0] || null,
                day: drillDay[0] || null,
                month: drillMonth[0] || null,
                recovery: drillRecovery
            },
            blasting: {
                supplier: blastSupplier,
                explosive: blastExplosive[0] || null
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard drilling data:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
