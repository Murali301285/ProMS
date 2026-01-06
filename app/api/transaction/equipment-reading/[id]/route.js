
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET Single Record
export async function GET(request, { params }) {
    // console.log("API: GET /api/transaction/equipment-reading/[id] HIT");

    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            console.error("ERROR: ID is undefined or null");
            return NextResponse.json({ success: false, message: 'ID missing' }, { status: 400 });
        }

        const query = `
            SELECT * FROM [Trans].[TblEquipmentReading] WHERE SlNo = @id AND IsDelete = 0
        `;
        const result = await executeQuery(query, [{ name: 'id', type: sql.Int, value: id }]);

        if (!result || result.length === 0) {
            console.warn("WARN: Record not found for ID:", id);
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        const record = result[0];

        // Fetch Child Tables (Operators Only)
        // Incharges now in Main Table

        // Fetch Child Tables - Operators
        const operatorsQuery = `SELECT OperatorId FROM [Trans].[TblEquipmentReadingOperator] WHERE EquipmentReadingId = @id`;
        const operatorsResult = await executeQuery(operatorsQuery, [{ name: 'id', type: sql.Int, value: id }]);
        const operatorIds = operatorsResult.map(row => row.OperatorId);

        // Format for Frontend
        const data = {
            ...record,
            OperatorId: operatorIds.length > 0 ? operatorIds : (record.OperatorId ? [record.OperatorId] : []) // Fallback to main table if child is empty
        };

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("CRITICAL ERROR in GET [id]:", error);
        return NextResponse.json({ success: false, message: error.message, stack: error.stack }, { status: 500 });
    }
}


import { authenticateUser } from '@/lib/auth';

// PUT (Update)
// PUT (Update)
export async function PUT(request, { params }) {
    try {
        const user = await authenticateUser(request);
        const UserId = user ? user.id : 1;

        const { id } = await params; // await params in Next.js 15+ convention if needed, though mostly params is sync in older versions. 
        // Based on previous code: const { id } = await params; - sticking to existing pattern.

        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, MidScaleInchargeId, RelayId,
            ActivityId, EquipmentId, OperatorId,
            OHMR, CHMR, NetHMR, OKMR, CKMR, NetKMR,
            DevelopmentHrMining, FaceMarchingHr, DevelopmentHrNonMining, BlastingMarchingHr,
            RunningBDMaintenanceHr, TotalWorkingHr, BDHr, MaintenanceHr, IdleHr,
            SectorId, PatchId, MethodId, Remarks,
        } = body;

        // Handle Operator Array
        const operators = Array.isArray(OperatorId) ? OperatorId : (OperatorId ? [OperatorId] : []);
        const primaryOperator = operators.length > 0 ? operators[0] : null;

        // Update Main Table
        // Note: We use merge/update logic.
        const query = `
            UPDATE [Trans].[TblEquipmentReading]
            SET 
                [Date] = @date, ShiftId = @ShiftId, 
                ShiftInchargeId = @ShiftInchargeId, MidScaleInchargeId = @MidScaleInchargeId,
                RelayId = @RelayId,
                ActivityId = @ActivityId, EquipmentId = @EquipmentId, OperatorId = @OperatorId,
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

        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const req = new sql.Request(transaction);

            req.input('date', sql.Date, date);
            req.input('ShiftId', sql.Int, ShiftId);
            req.input('ShiftInchargeId', sql.Int, ShiftInchargeId);
            req.input('MidScaleInchargeId', sql.Int, MidScaleInchargeId);
            req.input('RelayId', sql.Int, RelayId);
            req.input('ActivityId', sql.Int, ActivityId);
            req.input('EquipmentId', sql.Int, EquipmentId);
            // Main Table Operator
            req.input('OperatorId', sql.Int, primaryOperator);

            req.input('OHMR', sql.Decimal(18, 2), OHMR || null);
            req.input('CHMR', sql.Decimal(18, 2), CHMR || null);
            req.input('NetHMR', sql.Decimal(18, 2), NetHMR || null);

            req.input('OKMR', sql.Decimal(18, 2), OKMR || null);
            req.input('CKMR', sql.Decimal(18, 2), CKMR || null);
            req.input('NetKMR', sql.Decimal(18, 2), NetKMR || null);

            req.input('DevelopmentHrMining', sql.Decimal(18, 2), DevelopmentHrMining || null);
            req.input('FaceMarchingHr', sql.Decimal(18, 2), FaceMarchingHr || null);
            req.input('DevelopmentHrNonMining', sql.Decimal(18, 2), DevelopmentHrNonMining || null);
            req.input('BlastingMarchingHr', sql.Decimal(18, 2), BlastingMarchingHr || null);

            req.input('RunningBDMaintenanceHr', sql.Decimal(18, 2), RunningBDMaintenanceHr || null);
            req.input('TotalWorkingHr', sql.Decimal(18, 2), TotalWorkingHr || null);
            req.input('BDHr', sql.Decimal(18, 2), BDHr || null);
            req.input('MaintenanceHr', sql.Decimal(18, 2), MaintenanceHr || null);
            req.input('IdleHr', sql.Decimal(18, 2), IdleHr || null);

            req.input('SectorId', sql.Int, SectorId || null);
            req.input('PatchId', sql.Int, PatchId || null);
            req.input('MethodId', sql.Int, MethodId || null);

            req.input('Remarks', sql.NVarChar, Remarks);
            req.input('UserId', sql.Int, UserId);
            req.input('id', sql.Int, id);

            await req.query(query);

            // --- Child Table Update ---
            // 1. Delete Existing
            const deleteReq = new sql.Request(transaction);
            await deleteReq.query(`DELETE FROM [Trans].[TblEquipmentReadingOperator] WHERE EquipmentReadingId = ${id}`);

            // 2. Insert New
            if (operators.length > 0) {
                const insertReq = new sql.Request(transaction);
                for (const opId of operators) {
                    await insertReq.query(`
                        INSERT INTO [Trans].[TblEquipmentReadingOperator] (EquipmentReadingId, OperatorId)
                        VALUES (${id}, ${opId})
                    `);
                }
            }

            await transaction.commit();
            return NextResponse.json({ success: true, message: 'Updated Successfully' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE (Soft Delete)
export async function DELETE(request, { params }) {
    try {
        const user = await authenticateUser(request);
        const { id } = await params;
        if (!id) return NextResponse.json({ success: false, message: 'ID missing' }, { status: 400 });

        const query = `UPDATE [Trans].[TblEquipmentReading] SET IsDelete = 1, UpdatedBy = @userId, UpdatedDate = GETDATE() WHERE SlNo = @id`;
        await executeQuery(query, [
            { name: 'id', type: sql.Int, value: id },
            { name: 'userId', type: sql.Int, value: user ? user.id : 1 }
        ]);

        return NextResponse.json({ success: true, message: 'Deleted Successfully' });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
