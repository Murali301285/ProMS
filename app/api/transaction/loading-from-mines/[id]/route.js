import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const { id } = params;
        const {
            Date: date, ShiftId, ShiftInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, MangQtyTrip, NTPCQtyTrip, Unit, MangTotalQty, NTPCTotalQty,
            UserId, Remarks
        } = body;

        const query = `
            UPDATE [Trans].[TblLoading]
            SET 
                LoadingDate = @date,
                ShiftId = @ShiftId,
                ManPowerInShift = @ManPower,
                RelayId = @RelayId,
                SourceId = @SourceId,
                DestinationId = @DestinationId,
                MaterialId = @MaterialId,
                HaulerEquipmentId = @HaulerId,
                LoadingMachineEquipmentId = @LoadingMachineId,
                NoofTrip = @NoOfTrips,
                QtyTrip = @MangQtyTrip,
                NtpcQtyTrip = @NTPCQtyTrip,
                UnitId = ISNULL(@Unit, 1),
                TotalQty = @MangTotalQty,
                TotalNtpcQty = @NTPCTotalQty,
                UpdatedDate = GETDATE(),
                UpdatedBy = @UserId,
                Remarks = @Remarks
            WHERE SlNo = @id;
            
            -- Delete Existing Incharges
            DELETE FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @id;
        `;

        await executeQuery(query, [
            { name: 'id', type: sql.Int, value: id },
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
            { name: 'MangQtyTrip', type: sql.Decimal(18, 2), value: MangQtyTrip },
            { name: 'NTPCQtyTrip', type: sql.Decimal(18, 2), value: NTPCQtyTrip },
            { name: 'Unit', type: sql.Int, value: typeof Unit === 'string' ? 1 : Unit },
            { name: 'MangTotalQty', type: sql.Decimal(18, 2), value: MangTotalQty },
            { name: 'NTPCTotalQty', type: sql.Decimal(18, 2), value: NTPCTotalQty },
            { name: 'UserId', type: sql.Int, value: UserId || 1 },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
        for (const opId of incharges) {
            await executeQuery(`INSERT INTO [Trans].[TblLoadingShiftIncharge] (LoadingId, OperatorId) VALUES (@lid, @oid)`, [
                { name: 'lid', type: sql.Int, value: id },
                { name: 'oid', type: sql.Int, value: opId }
            ]);
        }

        return NextResponse.json({ success: true, message: 'Updated Successfully' });

    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
