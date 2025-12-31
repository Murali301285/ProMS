/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import { executeQuery, sql, getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const pool = await getDbConnection();
        await pool.request().query(`UPDATE [Trans].[TblLoading] SET IsDelete = 1 WHERE SlNo = ${id}`);

        return NextResponse.json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const user = await authenticateUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const UserId = user.id;

        const body = await request.json();
        const { id } = await params; // FIXED: Await Params
        const {
            Date: date, ShiftId, ShiftInchargeId, MidScaleInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, MangQtyTrip, NTPCQtyTrip, Unit, MangTotalQty, NTPCTotalQty,
            Remarks // UserId removed
        } = body;

        console.log("📝 [UPDATE-MINES] Payload:", body);

        const query = `
            UPDATE [Trans].[TblLoading]
            SET 
                LoadingDate = @date,
                ShiftId = @ShiftId,
                ShiftInchargeId = @ShiftInchargeId,
                MidScaleInchargeId = @MidScaleInchargeId,
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
                UnitId = @Unit,
                TotalQty = @MangTotalQty,
                TotalNtpcQty = @NTPCTotalQty,
                UpdatedDate = GETDATE(),
                UpdatedBy = @UserId,
                Remarks = @Remarks
            OUTPUT INSERTED.SlNo
            WHERE SlNo = @id;
            
            -- DELETE FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @id; -- No longer used
        `;

        const result = await executeQuery(query, [
            { name: 'id', type: sql.Int, value: id },
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
            { name: 'Unit', type: sql.Int, value: Unit ? Number(Unit) : 1 }, // FIXED: Casting
            { name: 'MangTotalQty', type: sql.Decimal(18, 2), value: MangTotalQty },
            { name: 'NTPCTotalQty', type: sql.Decimal(18, 2), value: NTPCTotalQty },
            { name: 'UserId', type: sql.Int, value: UserId },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        if (!result || result.length === 0) {
            console.error("❌ [UPDATE-MINES] Failed. ID not found:", id);
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        console.log("✅ [UPDATE-MINES] Detailed Update Success for ID:", id);

        /*
        const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
        for (const opId of incharges) {
            await executeQuery(`INSERT INTO [Trans].[TblLoadingShiftIncharge] (LoadingId, OperatorId) VALUES (@lid, @oid)`, [
                { name: 'lid', type: sql.Int, value: id },
                { name: 'oid', type: sql.Int, value: opId }
            ]);
        }
        */

        return NextResponse.json({ success: true, message: 'Updated Successfully' });

    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
