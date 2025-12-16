import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, QtyTrip, Unit, TotalQty,
            UserId, Remarks
        } = body;

        console.log("📝 [INSERT] Internal Transfer Payload:", body);

        if (!date || !ShiftId || !HaulerId || !LoadingMachineId || !SourceId || !DestinationId) {
            return NextResponse.json({ success: false, message: 'Missing mandatory fields' }, { status: 400 });
        }

        // --- Server Side Duplicate Check ---
        const duplicateCheck = await executeQuery(`
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
        `, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId }
        ]);

        if (duplicateCheck.length > 0) {
            return NextResponse.json({ success: false, message: 'Duplicate Entry Found' }, { status: 409 });
        }
        // -----------------------

        const query = `
            INSERT INTO [Trans].[TblInternalTransfer] (
                TransferDate, ShiftId, ManPowerInShift, RelayId,
                SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId,
                NoofTrip, QtyTrip, UnitId, TotalQty,
                CreatedDate, IsDelete, CreatedBy, Remarks
            ) OUTPUT INSERTED.SlNo VALUES (
                @date, @ShiftId, @ManPower, @RelayId,
                @SourceId, @DestinationId, @MaterialId, @HaulerId, @LoadingMachineId,
                @NoOfTrips, @QtyTrip, ISNULL(@Unit, 1), @TotalQty,
                GETDATE(), 0, @UserId, @Remarks
            );
        `;

        const result = await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'ManPower', type: sql.Int, value: ManPower },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId },
            { name: 'NoOfTrips', type: sql.Int, value: NoOfTrips },
            { name: 'QtyTrip', type: sql.Decimal(18, 2), value: QtyTrip },
            { name: 'Unit', type: sql.Int, value: Unit ? Number(Unit) : 1 }, // Corrected Logic
            { name: 'TotalQty', type: sql.Decimal(18, 2), value: TotalQty },
            { name: 'UserId', type: sql.Int, value: UserId || 2 }, // FIXED: Default 2 (Admin)
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        const newId = result[0]?.SlNo;

        if (newId) {
            // Insert Shift Incharges
            const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
            for (const opId of incharges) {
                await executeQuery(`INSERT INTO [Trans].[TblInternalTransferIncharge] (TransferId, OperatorId) VALUES (@lid, @oid)`, [
                    { name: 'lid', type: sql.Int, value: newId },
                    { name: 'oid', type: sql.Int, value: opId }
                ]);
            }
        }

        return NextResponse.json({ success: true, message: 'Saved successfully', id: newId });

    } catch (error) {
        console.error("Internal Transfer Insert Failed:", error);
        return NextResponse.json({ success: false, message: 'Server Error: ' + error.message }, { status: 500 });
    }
}
