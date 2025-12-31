/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = await authenticateUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const UserId = user.id; // Use authenticated User ID

        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, MidScaleInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, MangQtyTrip, NTPCQtyTrip, Unit, MangTotalQty, NTPCTotalQty,
            Remarks // UserId removed from body destructuring
        } = body;

        if (!date || !ShiftId || !HaulerId || !LoadingMachineId) {
            return NextResponse.json({ success: false, message: 'Missing mandatory fields' }, { status: 400 });
        }

        // Correct Table Name: [Trans].[TblLoading]

        // --- Duplicate Check ---
        const duplicateCheck = await executeQuery(`
            SELECT TOP 1 SlNo FROM [Trans].[TblLoading]
            WHERE CAST(LoadingDate AS DATE) = @date
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
            return NextResponse.json({ success: false, message: 'Entry is already found , pls check.' }, { status: 409 });
        }
        // -----------------------

        // Columns adjusted to match GET API: LoadingDate, ShiftId, ManPowerInShift, RelayId...
        const query = `
            INSERT INTO [Trans].[TblLoading] (
                LoadingDate, ShiftId, ShiftInchargeId, MidScaleInchargeId, ManPowerInShift, RelayId,
                SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId,
                NoofTrip, QtyTrip, NtpcQtyTrip, UnitId, TotalQty, TotalNtpcQty,
                CreatedDate, IsDelete, CreatedBy, Remarks
            ) OUTPUT INSERTED.SlNo VALUES (
                @date, @ShiftId, @ShiftInchargeId, @MidScaleInchargeId, @ManPower, @RelayId,
                @SourceId, @DestinationId, @MaterialId, @HaulerId, @LoadingMachineId,
                @NoOfTrips, @MangQtyTrip, @NTPCQtyTrip, ISNULL(@Unit, 1), @MangTotalQty, @NTPCTotalQty,
                GETDATE(), 0, @UserId, @Remarks
            );
        `;

        const result = await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'ShiftInchargeId', type: sql.Int, value: ShiftInchargeId || null },
            { name: 'MidScaleInchargeId', type: sql.Int, value: MidScaleInchargeId || null },
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

            { name: 'UserId', type: sql.Int, value: UserId },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        const newId = result[0]?.SlNo;

        if (newId) {
            // Deprecated: Multi-select table insert removed as per new Single Select requirement.
            /*
            // Insert Shift Incharge (Multi-select support)
            // ShiftInchargeId can be array or single value (if older client?)
            const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
            for (const opId of incharges) {
                await executeQuery(`INSERT INTO [Trans].[TblLoadingShiftIncharge] (LoadingId, OperatorId) VALUES (@lid, @oid)`, [
                    { name: 'lid', type: sql.Int, value: newId },
                    { name: 'oid', type: sql.Int, value: opId }
                ]);
            }
            */
        }
        // REDO STRATEGY: 
        // 1. Modify Main Insert to use OUTPUT INSERTED.SlNo.
        // 2. Get that ID.
        // 3. Loop Insert.

        // Actually, let's do it in one big script if possible? 
        // Or cleaner: Get ID, then loop.


        return NextResponse.json({ success: true, message: 'Transaction Created Successfully' });

    } catch (error) {
        console.error('Create Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
