import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            Date: date,
            ShiftId,
            RelayId,
            SourceId,
            DestinationId,
            MaterialId,
            HaulerId,
            LoadingMachineId
        } = body;

        // Unique Constraint: Date + Shift + Relay + Source + Destination + Material + Hauler + Loading Machine
        const query = `
            SELECT COUNT(*) as count
            FROM [Transaction].[TblLoadingFromMines]
            WHERE 
                CAST(LoadingDate AS DATE) = CAST(@date AS DATE) AND
                ShiftId = @ShiftId AND
                RelayId = @RelayId AND
                SourceId = @SourceId AND
                DestinationId = @DestinationId AND
                MaterialId = @MaterialId AND
                HaulerEquipmentId = @HaulerId AND
                LoadingMachineId = @LoadingMachineId AND
                IsDelete = 0
        `;

        const data = await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId },
        ]);

        return NextResponse.json({ success: true, exists: data[0].count > 0 });

    } catch (error) {
        console.error('Error checking duplicate:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
