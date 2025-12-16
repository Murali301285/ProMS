
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET Single Record
export async function GET(request, { params }) {
    console.log("---------------------------------------------------------");
    console.log("API: GET /api/transaction/equipment-reading/[id] HIT");

    try {
        console.log("DEBUG: Awaiting Params...");
        const resolvedParams = await params;
        const { id } = resolvedParams;
        console.log("DEBUG: Resolved ID:", id);

        if (!id) {
            console.error("ERROR: ID is undefined or null");
            return NextResponse.json({ success: false, message: 'ID missing' }, { status: 400 });
        }

        const query = `
            SELECT * FROM [Trans].[TblEquipmentReading] WHERE SlNo = @id AND IsDelete = 0
        `;
        console.log("DEBUG: Executing Query:", query);
        const result = await executeQuery(query, [{ name: 'id', type: sql.Int, value: id }]);
        console.log("DEBUG: Query Result Length:", result ? result.length : 'null');

        if (!result || result.length === 0) {
            console.warn("WARN: Record not found for ID:", id);
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        const record = result[0];
        console.log("DEBUG: Record Found:", record.SlNo);

        // Fetch Child Tables (Incharges & Operators)
        console.log("DEBUG: Fetching Child Tables...");

        const incharges = await executeQuery(
            `SELECT OperatorId FROM [Trans].[TblEquipmentReadingShiftIncharge] WHERE EquipmentReadingId = @id`,
            [{ name: 'id', type: sql.Int, value: id }]
        );
        console.log("DEBUG: Incharges Count:", incharges.length);

        const operators = await executeQuery(
            `SELECT OperatorId FROM [Trans].[TblEquipmentReadingOperator] WHERE EquipmentReadingId = @id`,
            [{ name: 'id', type: sql.Int, value: id }]
        );
        console.log("DEBUG: Operators Count:", operators.length);

        // Format for Frontend
        const data = {
            ...record,
            ShiftInchargeId: incharges.map(i => i.OperatorId),
            OperatorId: operators.map(i => i.OperatorId)
        };
        console.log("DEBUG: Sending Response Success");

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("CRITICAL ERROR in GET [id]:", error);
        return NextResponse.json({ success: false, message: error.message, stack: error.stack }, { status: 500 });
    }
}


// PUT (Update)
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, RelayId,
            ActivityId, EquipmentId, OperatorId,
            OHMR, CHMR, NetHMR, OKMR, CKMR, NetKMR,
            DevelopmentHrMining, FaceMarchingHr, DevelopmentHrNonMining, BlastingMarchingHr,
            RunningBDMaintenanceHr, TotalWorkingHr, BDHr, MaintenanceHr, IdleHr,
            SectorId, PatchId, MethodId, Remarks,
            UserId = 1
        } = body;

        // Update Main Table
        // Note: We use merge/update logic.
        const query = `
            UPDATE [Trans].[TblEquipmentReading]
            SET 
                [Date] = @date, ShiftId = @ShiftId, RelayId = @RelayId,
                ActivityId = @ActivityId, EquipmentId = @EquipmentId,
                OHMR = @OHMR, CHMR = @CHMR, NetHMR = @NetHMR,
                OKMR = @OKMR, CKMR = @CKMR, NetKMR = @NetKMR,
                DevelopmentHrMining = @DevelopmentHrMining,
                FaceMarchingHr = @FaceMarchingHr,
                DevelopmentHrNonMining = @DevelopmentHrNonMining,
                BlastingMarchingHr = @BlastingMarchingHr,
                RunningBDMaintenanceHr = @RunningBDMaintenanceHr,
                TotalWorkingHr = @TotalWorkingHr,
                BDHr = @BDHr,
                MaintenanceHr = @MaintenanceHr,
                IdleHr = @IdleHr,
                SectorId = @SectorId,
                PatchId = @PatchId,
                MethodId = @MethodId,
                Remarks = @Remarks,
                UpdatedBy = @UserId,
                UpdatedDate = GETDATE()
            WHERE SlNo = @id
        `;

        await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'ActivityId', type: sql.Int, value: ActivityId },
            { name: 'EquipmentId', type: sql.Int, value: EquipmentId },

            { name: 'OHMR', type: sql.Decimal(18, 2), value: OHMR || null },
            { name: 'CHMR', type: sql.Decimal(18, 2), value: CHMR || null },
            { name: 'NetHMR', type: sql.Decimal(18, 2), value: NetHMR || null },

            { name: 'OKMR', type: sql.Decimal(18, 2), value: OKMR || null },
            { name: 'CKMR', type: sql.Decimal(18, 2), value: CKMR || null },
            { name: 'NetKMR', type: sql.Decimal(18, 2), value: NetKMR || null },

            { name: 'DevelopmentHrMining', type: sql.Decimal(18, 2), value: DevelopmentHrMining || null },
            { name: 'FaceMarchingHr', type: sql.Decimal(18, 2), value: FaceMarchingHr || null },
            { name: 'DevelopmentHrNonMining', type: sql.Decimal(18, 2), value: DevelopmentHrNonMining || null },
            { name: 'BlastingMarchingHr', type: sql.Decimal(18, 2), value: BlastingMarchingHr || null },

            { name: 'RunningBDMaintenanceHr', type: sql.Decimal(18, 2), value: RunningBDMaintenanceHr || null },
            { name: 'TotalWorkingHr', type: sql.Decimal(18, 2), value: TotalWorkingHr || null },
            { name: 'BDHr', type: sql.Decimal(18, 2), value: BDHr || null },
            { name: 'MaintenanceHr', type: sql.Decimal(18, 2), value: MaintenanceHr || null },
            { name: 'IdleHr', type: sql.Decimal(18, 2), value: IdleHr || null },

            { name: 'SectorId', type: sql.Int, value: SectorId || null },
            { name: 'PatchId', type: sql.Int, value: PatchId || null },
            { name: 'MethodId', type: sql.Int, value: MethodId || null },

            { name: 'Remarks', type: sql.NVarChar, value: Remarks },
            { name: 'UserId', type: sql.Int, value: UserId },
            { name: 'id', type: sql.Int, value: id }
        ]);

        // Update Children (Delete & Re-insert)
        await executeQuery(`DELETE FROM [Trans].[TblEquipmentReadingShiftIncharge] WHERE EquipmentReadingId = @id`, [{ name: 'id', value: id }]);
        if (ShiftInchargeId && ShiftInchargeId.length > 0) {
            for (const opId of ShiftInchargeId) {
                await executeQuery(`INSERT INTO [Trans].[TblEquipmentReadingShiftIncharge] (EquipmentReadingId, OperatorId) VALUES (@lid, @oid)`, [
                    { name: 'lid', value: id }, { name: 'oid', value: opId }
                ]);
            }
        }

        await executeQuery(`DELETE FROM [Trans].[TblEquipmentReadingOperator] WHERE EquipmentReadingId = @id`, [{ name: 'id', value: id }]);
        if (OperatorId && OperatorId.length > 0) {
            for (const opId of OperatorId) {
                await executeQuery(`INSERT INTO [Trans].[TblEquipmentReadingOperator] (EquipmentReadingId, OperatorId) VALUES (@lid, @oid)`, [
                    { name: 'lid', value: id }, { name: 'oid', value: opId }
                ]);
            }
        }

        return NextResponse.json({ success: true, message: 'Updated Successfully' });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
