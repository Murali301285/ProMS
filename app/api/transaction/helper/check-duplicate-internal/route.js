import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            Date: date, ShiftId, RelayId, SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId
        } = body;

        // Duplicate Check Query
        // Checks if an ACTIVE record exists with same main params
        const query = `
            SELECT TOP 1 SlNo FROM [Trans].[TblInternalTransfer]
            WHERE TransferDate = @date
            AND ShiftId = @ShiftId
            AND RelayId = @RelayId
            AND SourceId = @SourceId
            AND DestinationId = @DestinationId
            AND MaterialId = @MaterialId
            AND HaulerEquipmentId = @HaulerId
            AND LoadingMachineEquipmentId = @LoadingMachineId
            AND IsDelete = 0
        `;

        const res = await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId }
        ]);

        return NextResponse.json({ exists: res.length > 0 });

    } catch (error) {
        console.error("Internal Duplicate Check Error:", error);
        return NextResponse.json({ exists: false, error: error.message }, { status: 500 });
    }
}
