import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { Date: LoadDate, ShiftId, SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId } = body;

        // Basic Validation
        if (!LoadDate || !ShiftId || !SourceId || !DestinationId || !MaterialId || !HaulerId || !LoadingMachineId) {
            return NextResponse.json({ success: false, message: 'Missing fields for duplicate check' });
        }

        const pool = await getDbConnection();

        // Check for duplicate
        const result = await pool.request()
            .input('LoadingDate', LoadDate)
            .input('ShiftId', ShiftId)
            .input('SourceId', SourceId)
            .input('DestinationId', DestinationId)
            .input('MaterialId', MaterialId)
            .input('HaulerId', HaulerId)
            .input('LoadingMachineId', LoadingMachineId)
            .query(`
                SELECT TOP 1 1 as ExistsVal
                FROM [Trans].[TblLoading]
                WHERE IsDelete = 0
                AND LoadingDate = @LoadingDate
                AND ShiftId = @ShiftId
                AND SourceId = @SourceId
                AND DestinationId = @DestinationId
                AND MaterialId = @MaterialId
                AND HaulerId = @HaulerId
                AND LoadingMachineId = @LoadingMachineId
            `);

        const exists = result.recordset.length > 0;
        return NextResponse.json({ success: true, exists });

    } catch (error) {
        console.error("Duplicate Check Failed:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
