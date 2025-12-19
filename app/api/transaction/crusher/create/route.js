
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            Date: date,
            ShiftId,
            ShiftInChargeId, // OperatorId
            ManPowerInShift,
            PlantId,
            BeltScaleOHMR,
            BeltScaleCHMR,
            ProductionUnitId,
            ProductionQty,
            EquipmentId, // Changed from HaulerId
            NoofTrip,
            QtyTrip,
            TripQtyUnitId,
            TotalQty,
            OHMR,
            CHMR,
            RunningHr,
            TotalStoppageHours,
            Remarks,
            UserId = 1, // Default to 1 if not provided, though typically from session
            stoppages = []
        } = body;

        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();
            const req = new sql.Request(transaction);

            req.input('Date', sql.Date, date);
            req.input('ShiftId', sql.Int, ShiftId);
            req.input('ShiftInChargeId', sql.VarChar, body.ShiftInChargeId);
            req.input('ManPowerInShift', sql.Decimal(18, 2), ManPowerInShift || 0); // Assuming numeric
            req.input('PlantId', sql.Int, PlantId);
            req.input('BeltScaleOHMR', sql.Decimal(18, 2), BeltScaleOHMR || 0);
            req.input('BeltScaleCHMR', sql.Decimal(18, 2), BeltScaleCHMR || 0);
            req.input('ProductionUnitId', sql.Int, ProductionUnitId);
            req.input('ProductionQty', sql.Decimal(18, 2), ProductionQty || 0);

            req.input('EquipmentId', sql.Int, EquipmentId || null);
            req.input('NoofTrip', sql.Int, NoofTrip || 0);
            req.input('QtyTrip', sql.Decimal(18, 2), QtyTrip || 0);
            req.input('TripQtyUnitId', sql.Int, TripQtyUnitId || null);

            req.input('TotalQty', sql.Decimal(18, 2), TotalQty || 0);
            req.input('OHMR', sql.Decimal(18, 2), OHMR || 0);
            req.input('CHMR', sql.Decimal(18, 2), CHMR || 0);
            req.input('RunningHr', sql.Decimal(18, 2), RunningHr || 0);
            req.input('TotalStoppageHours', sql.Decimal(18, 2), TotalStoppageHours || 0);

            req.input('Remarks', sql.NVarChar, Remarks);
            req.input('UserId', sql.Int, UserId);

            const query = `
                INSERT INTO [Trans].[TblCrusher] (
                    [Date], ShiftId, ShiftInChargeId, ManPowerInShift, PlantId,
                    BeltScaleOHMR, BeltScaleCHMR, ProductionUnitId, ProductionQty,
                    HaulerId, NoofTrip, QtyTrip, TripQtyUnitId,
                    TotalQty, OHMR, CHMR, RunningHr, TotalStoppageHours,
                    Remarks,
                    CreatedBy, CreatedDate, IsDelete
                )
                OUTPUT INSERTED.SlNo
                VALUES (
                    @Date, @ShiftId, @ShiftInChargeId, @ManPowerInShift, @PlantId,
                    @BeltScaleOHMR, @BeltScaleCHMR, @ProductionUnitId, @ProductionQty,
                    @EquipmentId, @NoofTrip, @QtyTrip, @TripQtyUnitId,
                    @TotalQty, @OHMR, @CHMR, @RunningHr, @TotalStoppageHours,
                    @Remarks,
                    @UserId, GETDATE(), 0
                )
            `;

            const result = await req.query(query);
            const parentId = result.recordset[0].SlNo;

            // Insert Stoppages
            if (stoppages && stoppages.length > 0) {
                for (const st of stoppages) {
                    const stReq = new sql.Request(transaction);
                    stReq.input('CrusherId', sql.Int, parentId);
                    stReq.input('FromTime', sql.VarChar, st.FromTime); // Using VarChar for Time HH:mm
                    stReq.input('ToTime', sql.VarChar, st.ToTime);
                    stReq.input('StoppageId', sql.Int, st.StoppageId);
                    stReq.input('StoppageHours', sql.Decimal(18, 3), st.StoppageHours);
                    stReq.input('Remarks', sql.NVarChar, st.Remarks);

                    await stReq.query(`
                        INSERT INTO [Trans].[TblCrusherStoppage]
                        (CrusherId, FromTime, ToTime, StoppageId, StoppageHours, Remarks)
                        VALUES (@CrusherId, @FromTime, @ToTime, @StoppageId, @StoppageHours, @Remarks)
                    `);
                }
            }

            await transaction.commit();
            return NextResponse.json({ success: true, message: 'Record created successfully' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }


    } catch (error) {
        console.error("Error creating Crusher record:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
