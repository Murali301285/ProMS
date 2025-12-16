/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET Single Record
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const query = `
            SELECT 
                SlNo,
                RehandlingDate,
                ShiftId,
                ManPowerInShift AS ManPower, -- Map to Form Field
                RelayId,
                SourceId,
                DestinationId,
                MaterialId,
                HaulerEquipmentId AS HaulerId,
                LoadingMachineEquipmentId AS LoadingMachineId,
                NoofTrip AS NoOfTrips,
                QtyTrip,
                NtpcQtyTrip, 
                UnitId,
                TotalQty,
                TotalNtpcQty,
                Remarks
            FROM [Trans].[TblMaterialRehandling] 
            WHERE SlNo = @id AND IsDelete = 0
        `;

        const res = await executeQuery(query, [
            { name: 'id', type: sql.Int, value: id }
        ]);

        const mainData = res[0];
        if (!mainData) {
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        // Fetch Incharges
        try {
            const queryInc = `SELECT OperatorId FROM [Trans].[TblMaterialRehandlingShiftIncharge] WHERE MaterialRehandlingId = @lid`;
            const resInc = await executeQuery(queryInc, [
                { name: 'lid', type: sql.Int, value: id }
            ]);
            mainData.ShiftInchargeId = resInc.map(row => row.OperatorId);
        } catch (incError) {
            mainData.ShiftInchargeId = [];
        }

        return NextResponse.json({ success: true, data: mainData });

    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const { id } = await params;
        const {
            Date: date, ShiftId, ShiftInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, MangQtyTrip, NTPCQtyTrip, Unit, MangTotalQty, NTPCTotalQty,
            UserId, Remarks
        } = body;

        // 1. Duplicate Check (Exclude Current ID)
        const dupQuery = `
            SELECT COUNT(1) as count
            FROM [Trans].[TblMaterialRehandling]
            WHERE 
                CAST(RehandlingDate AS DATE) = CAST(@date AS DATE) AND
                ShiftId = @ShiftId AND
                RelayId = @RelayId AND
                SourceId = @SourceId AND
                DestinationId = @DestinationId AND
                MaterialId = @MaterialId AND
                HaulerEquipmentId = @HaulerId AND
                LoadingMachineEquipmentId = @LoadingMachineId AND
                IsDelete = 0 AND
                SlNo != @id
        `;

        const dupRes = await executeQuery(dupQuery, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId },
            { name: 'id', type: sql.Int, value: id }
        ]);

        if (dupRes[0].count > 0) {
            return NextResponse.json({ success: false, message: 'Entry is already found , pls check.' });
        }

        // 2. Update Record
        // Use ManPowerInShift column name
        const query = `
            UPDATE [Trans].[TblMaterialRehandling]
            SET 
                RehandlingDate = @date,
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
                UnitId = @Unit,
                TotalQty = @MangTotalQty,
                TotalNtpcQty = @NTPCTotalQty,
                UpdatedDate = GETDATE(),
                UpdatedBy = @UserId,
                Remarks = @Remarks
            OUTPUT INSERTED.SlNo
            WHERE SlNo = @id;
            
            DELETE FROM [Trans].[TblMaterialRehandlingShiftIncharge] WHERE MaterialRehandlingId = @id;
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
            { name: 'MangQtyTrip', type: sql.Decimal(18, 2), value: MangQtyTrip },
            { name: 'NTPCQtyTrip', type: sql.Decimal(18, 2), value: NTPCQtyTrip },
            { name: 'Unit', type: sql.Int, value: Unit ? Number(Unit) : 1 },
            { name: 'MangTotalQty', type: sql.Decimal(18, 2), value: MangTotalQty },
            { name: 'NTPCTotalQty', type: sql.Decimal(18, 2), value: NTPCTotalQty },
            { name: 'UserId', type: sql.Int, value: UserId || 2 },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks }
        ]);

        if (!result || result.length === 0) {
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        const incharges = Array.isArray(ShiftInchargeId) ? ShiftInchargeId : (ShiftInchargeId ? [ShiftInchargeId] : []);
        for (const opId of incharges) {
            await executeQuery(`INSERT INTO [Trans].[TblMaterialRehandlingShiftIncharge] (MaterialRehandlingId, OperatorId) VALUES (@lid, @oid)`, [
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
