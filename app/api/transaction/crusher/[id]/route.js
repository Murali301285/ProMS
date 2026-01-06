import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
SELECT * FROM [Trans].[TblCrusher] WHERE SlNo = @id AND IsDelete = 0;
SELECT * FROM [Trans].[TblCrusherStoppage] WHERE CrusherId = @id;
`);

        if (result.recordsets[0].length === 0) {
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        const data = result.recordsets[0][0];
        data.stoppages = result.recordsets[1]; // Append Stoppages

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const user = await authenticateUser(request);
        const userId = user ? user.id : 1;

        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();
            const req = new sql.Request(transaction);

            req.input('id', sql.Int, id);
            req.input('Date', sql.Date, body.Date);
            req.input('ShiftId', sql.Int, body.ShiftId);
            req.input('ShiftInChargeId', sql.Int, (body.ShiftInChargeId && body.ShiftInChargeId != '0') ? body.ShiftInChargeId : null);
            req.input('MidScaleInchargeId', sql.Int, (body.MidScaleInchargeId && body.MidScaleInchargeId != '0') ? body.MidScaleInchargeId : null);
            req.input('ManPowerInShift', sql.Decimal(18, 2), body.ManPowerInShift || 0);
            req.input('PlantId', sql.Int, body.PlantId);
            req.input('BeltScaleOHMR', sql.Decimal(18, 2), body.BeltScaleOHMR || 0);
            req.input('BeltScaleCHMR', sql.Decimal(18, 2), body.BeltScaleCHMR || 0);
            req.input('ProductionUnitId', sql.Int, body.ProductionUnitId);
            req.input('ProductionQty', sql.Decimal(18, 2), body.ProductionQty || 0);

            req.input('EquipmentId', sql.Int, (body.EquipmentId && body.EquipmentId != '0') ? body.EquipmentId : null);
            req.input('NoofTrip', sql.Int, body.NoofTrip || 0);
            req.input('QtyTrip', sql.Decimal(18, 2), body.QtyTrip || 0);
            req.input('TripQtyUnitId', sql.Int, (body.TripQtyUnitId && body.TripQtyUnitId != '0') ? body.TripQtyUnitId : null);

            req.input('TotalQty', sql.Decimal(18, 2), body.TotalQty || 0);
            req.input('OHMR', sql.Decimal(18, 2), body.OHMR || 0);
            req.input('CHMR', sql.Decimal(18, 2), body.CHMR || 0);
            req.input('RunningHr', sql.Decimal(18, 2), body.RunningHr || 0);
            req.input('TotalStoppageHours', sql.Decimal(18, 2), body.TotalStoppageHours || 0);

            req.input('Remarks', sql.NVarChar, body.Remarks);
            req.input('UpdatedBy', sql.Int, userId);

            await req.query(`
UPDATE [Trans].[TblCrusher] SET
[Date] = @Date,
    ShiftId = @ShiftId,
    ShiftInChargeId = @ShiftInChargeId,
    MidScaleInchargeId = @MidScaleInchargeId,
    ManPowerInShift = @ManPowerInShift,
    PlantId = @PlantId,
    BeltScaleOHMR = @BeltScaleOHMR,
    BeltScaleCHMR = @BeltScaleCHMR,
    ProductionUnitId = @ProductionUnitId,
    ProductionQty = @ProductionQty,
    HaulerEquipmentId = @EquipmentId,
    NoofTrip = @NoofTrip,
    QtyTrip = @QtyTrip,
    TripQtyUnitId = @TripQtyUnitId,
    TotalQty = @TotalQty,
    OHMR = @OHMR,
    CHMR = @CHMR,
    RunningHr = @RunningHr,
    TotalStoppageHours = @TotalStoppageHours,
    Remarks = @Remarks,
    UpdatedBy = @UpdatedBy,
    UpdatedDate = GETDATE()
                WHERE SlNo = @id
    `);

            // Handle Stoppages: Delete existing and re-insert
            const dReq = new sql.Request(transaction);
            dReq.input('CrusherId', sql.Int, id);
            await dReq.query("DELETE FROM [Trans].[TblCrusherStoppage] WHERE CrusherId = @CrusherId");

            if (body.stoppages && body.stoppages.length > 0) {
                for (const st of body.stoppages) {
                    const stReq = new sql.Request(transaction);
                    stReq.input('CrusherId', sql.Int, id);
                    stReq.input('FromTime', sql.VarChar, st.FromTime);
                    stReq.input('ToTime', sql.VarChar, st.ToTime);
                    stReq.input('StoppageId', sql.Int, st.StoppageId);
                    stReq.input('StoppageHours', sql.Decimal(18, 3), st.StoppageHours || 0);
                    stReq.input('Remarks', sql.NVarChar, st.Remarks);

                    await stReq.query(`
                        INSERT INTO [Trans].[TblCrusherStoppage]
    (CrusherId, FromTime, ToTime, StoppageId, StoppageHours, Remarks)
VALUES(@CrusherId, @FromTime, @ToTime, @StoppageId, @StoppageHours, @Remarks)
                    `);
                }
            }

            await transaction.commit();
            return NextResponse.json({ success: true, message: 'Record updated successfully' });

        } catch (err) {
            console.error("Transaction Error Details:", err);
            if (err.originalError) console.error("Original SQL Error:", err.originalError);
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({
            success: false,
            message: error.message,
            details: error.originalError?.message || error.toString()
        }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        const user = await authenticateUser(request);
        const pool = await getDbConnection();
        const req = pool.request();
        req.input('id', sql.Int, id);
        req.input('userId', sql.Int, user ? user.id : 1);

        // Soft Delete with Audit
        await req.query(`UPDATE [Trans].[TblCrusher] SET IsDelete = 1, UpdatedBy = @userId, UpdatedDate = GETDATE() WHERE SlNo = @id`);

        return NextResponse.json({ success: true, message: 'Deleted Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
