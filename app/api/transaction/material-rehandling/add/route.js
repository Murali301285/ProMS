/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, MangQtyTrip, NTPCQtyTrip, Unit, MangTotalQty, NTPCTotalQty,
            UserId, Remarks
        } = body;

        // 1. Duplicate Check
        const checkQuery = `
            SELECT SlNo FROM [Trans].[TblMaterialRehandling]
            WHERE RehandlingDate = @date 
            AND ShiftId = @ShiftId 
            AND SourceId = @SourceId 
            AND DestinationId = @DestinationId
            AND MaterialId = @MaterialId 
            AND HaulerEquipmentId = @HaulerId 
            AND LoadingMachineEquipmentId = @LoadingMachineId
            AND IsDelete = 0
        `;

        const duplicateCheck = await executeQuery(checkQuery, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId }, // Added Destination to check
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId }
        ]);

        if (duplicateCheck.length > 0) {
            return NextResponse.json({ success: false, message: 'Duplicate Entry Found' }, { status: 409 });
        }

        // 2. Insert
        const query = `
            INSERT INTO [Trans].[TblMaterialRehandling] (
                RehandlingDate, ShiftId, ManPower, RelayId, -- ManPower vs ManPowerInShift? Using ManPower as per config
                SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId,
                NoofTrip, QtyTrip, NtpcQtyTrip, UnitId, TotalQty, TotalNtpcQty,
                CreatedDate, IsDelete, UserId, Remarks -- UserId instead of CreatedBy for consistency
            ) OUTPUT INSERTED.SlNo VALUES (
                @date, @ShiftId, @ManPower, @RelayId,
                @SourceId, @DestinationId, @MaterialId, @HaulerId, @LoadingMachineId,
                @NoOfTrips, @MangQtyTrip, @NTPCQtyTrip, ISNULL(@Unit, 1), @MangTotalQty, @NTPCTotalQty,
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
            { name: 'MangQtyTrip', type: sql.Decimal(18, 2), value: MangQtyTrip },
            { name: 'NTPCQtyTrip', type: sql.Decimal(18, 2), value: NTPCQtyTrip },
            { name: 'Unit', type: sql.Int, value: Unit ? Number(Unit) : 1 },
            { name: 'MangTotalQty', type: sql.Decimal(18, 2), value: MangTotalQty },
            { name: 'NTPCTotalQty', type: sql.Decimal(18, 2), value: NTPCTotalQty },

            // Default to 2 (Admin) if no user provided
            { name: 'UserId', type: sql.Int, value: UserId || 2 },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        const newId = result[0]?.SlNo;

        if (newId) {
            // Insert Shift Incharges
            const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
            for (const opId of incharges) {
                await executeQuery(`INSERT INTO [Trans].[TblMaterialRehandlingShiftIncharge] (MaterialRehandlingId, OperatorId) VALUES (@lid, @oid)`, [
                    { name: 'lid', type: sql.Int, value: newId },
                    { name: 'oid', type: sql.Int, value: opId }
                ]);
            }
        }

        return NextResponse.json({ success: true, message: 'Saved Successfully', id: newId });

    } catch (error) {
        console.error('Insert Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
