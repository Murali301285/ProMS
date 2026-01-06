import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const { id } = await params;
        const {
            Date: date, ShiftId, ShiftInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, QtyTrip, Unit, TotalQty,
            UserId, Remarks
        } = body;

        console.log("📝 [UPDATE] Internal Transfer Payload:", body);

        // 1. debug: Fetch Pre-Update State
        const preCheck = await executeQuery(`SELECT * FROM [Trans].[TblInternalTransfer] WHERE SlNo = @id`, [{ name: 'id', type: sql.Int, value: id }]);
        console.log("🔍 [DEBUG] Pre-Update DB State:", preCheck[0]);

        // Note: Duplicate check usually not strict on Update...

        const query = `
            UPDATE [Trans].[TblInternalTransfer]
            SET 
                TransferDate = @date,
                ShiftId = @ShiftId,
                ManPowerInShift = @ManPower,
                RelayId = @RelayId,
                SourceId = @SourceId,
                DestinationId = @DestinationId,
                MaterialId = @MaterialId,
                HaulerEquipmentId = @HaulerId,
                LoadingMachineEquipmentId = @LoadingMachineId,
                NoofTrip = @NoOfTrips,
                QtyTrip = @QtyTrip,
                UnitId = @Unit,
                TotalQty = @TotalQty,
                UpdatedDate = GETDATE(),
                UpdatedBy = @UserId,
                Remarks = @Remarks
            OUTPUT INSERTED.SlNo, INSERTED.UpdatedDate
            WHERE SlNo = @id;
            
            DELETE FROM [Trans].[TblInternalTransferIncharge] WHERE TransferId = @id;
        `;

        const result = await executeQuery(query, [
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
            { name: 'QtyTrip', type: sql.Decimal(18, 2), value: QtyTrip },
            { name: 'Unit', type: sql.Int, value: Unit ? Number(Unit) : 1 },
            { name: 'TotalQty', type: sql.Decimal(18, 2), value: TotalQty },
            { name: 'UserId', type: sql.Int, value: UserId || 2 }, // FIXED: Default to 2 (Admin)
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        if (!result || result.length === 0) {
            console.error("❌ [UPDATE] Failed: Record not found or no change for ID:", id);
            return NextResponse.json({ success: false, message: 'Update failed: Record not found' }, { status: 404 });
        }

        console.log("✅ [UPDATE] DB Confirmed Update for ID:", result[0]?.SlNo, "Time:", result[0]?.UpdatedDate);

        // 3. debug: Fetch Post-Update State
        const postCheck = await executeQuery(`SELECT * FROM [Trans].[TblInternalTransfer] WHERE SlNo = @id`, [{ name: 'id', type: sql.Int, value: id }]);
        console.log("🔍 [DEBUG] Post-Update DB State:", postCheck[0]);

        // Re-insert Incharges
        const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
        for (const opId of incharges) {
            await executeQuery(`INSERT INTO [Trans].[TblInternalTransferIncharge] (TransferId, OperatorId) VALUES (@lid, @oid)`, [
                { name: 'lid', type: sql.Int, value: id },
                { name: 'oid', type: sql.Int, value: opId }
            ]);
        }

        return NextResponse.json({ success: true, message: 'Updated Successfully' });

    } catch (error) {
        console.error('Internal Transfer Update Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const query = `
            SELECT 
                T.SlNo, 
                T.TransferDate, 
                T.ShiftId, 
                T.ManPowerInShift as ManPower, 
                T.RelayId,
                T.SourceId, 
                T.DestinationId, 
                T.MaterialId, 
                T.HaulerEquipmentId as HaulerId, 
                T.LoadingMachineEquipmentId as LoadingMachineId,
                T.NoofTrip as NoOfTrips, 
                T.QtyTrip, 
                T.UnitId, 
                T.TotalQty, 
                T.Remarks,
                (SELECT STRING_AGG(OperatorId, ',') FROM [Trans].[TblInternalTransferIncharge] WHERE TransferId = T.SlNo) as ShiftInchargeId
            FROM [Trans].[TblInternalTransfer] T
            WHERE T.SlNo = @id
        `;
        const result = await executeQuery(query, [{ name: 'id', type: sql.Int, value: id }]);

        if (result.length > 0) {
            // Convert comma separated Incharge IDs to array
            const record = result[0];
            if (record.ShiftInchargeId) {
                record.ShiftInchargeId = record.ShiftInchargeId.split(',').map(Number);
            } else {
                record.ShiftInchargeId = [];
            }
            return NextResponse.json({ success: true, data: record });
        }
        return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await authenticateUser(request);
        const { id } = await params;

        await executeQuery(`UPDATE [Trans].[TblInternalTransfer] SET IsDelete = 1, UpdatedBy = @userId, UpdatedDate = GETDATE() WHERE SlNo = @id`, [
            { name: 'userId', type: sql.Int, value: user ? user.id : 1 },
            { name: 'id', type: sql.Int, value: id }
        ]);

        return NextResponse.json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Internal Transfer Delete Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
