
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log("Crusher Create Payload:", JSON.stringify(body, null, 2));

        const user = await authenticateUser(request);
        const userId = user ? user.id : 1;

        const {
            Date: date,
            ShiftId,
            ShiftInChargeId, // OperatorId (Large Scale)
            MidScaleInchargeId, // OperatorId (Mid Scale)
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
            Remarks: remarksVal, // Renamed to avoid cache collision
            CreatedBy = userId,
            stoppages = []
        } = body;

        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();
            const req = new sql.Request(transaction);

            req.input('Date', sql.Date, date);
            req.input('ShiftId', sql.Int, ShiftId);
            req.input('ShiftInChargeId', sql.Int, (ShiftInChargeId && ShiftInChargeId != '0') ? ShiftInChargeId : null);
            req.input('MidScaleInchargeId', sql.Int, (MidScaleInchargeId && MidScaleInchargeId != '0') ? MidScaleInchargeId : null);
            req.input('ManPowerInShift', sql.Decimal(18, 2), ManPowerInShift || 0); // Assuming numeric
            req.input('PlantId', sql.Int, PlantId);
            req.input('BeltScaleOHMR', sql.Decimal(18, 2), BeltScaleOHMR || 0);
            req.input('BeltScaleCHMR', sql.Decimal(18, 2), BeltScaleCHMR || 0);
            req.input('ProductionUnitId', sql.Int, ProductionUnitId);
            req.input('ProductionQty', sql.Decimal(18, 2), ProductionQty || 0);

            req.input('EquipmentId', sql.Int, (EquipmentId && EquipmentId != '0') ? EquipmentId : null);
            req.input('NoofTrip', sql.Int, NoofTrip || 0);
            req.input('QtyTrip', sql.Decimal(18, 2), QtyTrip || 0);
            req.input('TripQtyUnitId', sql.Int, (TripQtyUnitId && TripQtyUnitId != '0') ? TripQtyUnitId : null);

            req.input('TotalQty', sql.Decimal(18, 2), TotalQty || 0);
            req.input('OHMR', sql.Decimal(18, 2), OHMR || 0);
            req.input('CHMR', sql.Decimal(18, 2), CHMR || 0);
            req.input('RunningHr', sql.Decimal(18, 2), RunningHr || 0);
            req.input('TotalStoppageHours', sql.Decimal(18, 2), TotalStoppageHours || 0);

            req.input('Remarks', sql.NVarChar, remarksVal);
            req.input('CreatedBy', sql.Int, CreatedBy);

            const query = `
                INSERT INTO [Trans].[TblCrusher] (
                    [Date], ShiftId, ShiftInChargeId, MidScaleInchargeId, ManPowerInShift, PlantId,
                    BeltScaleOHMR, BeltScaleCHMR, ProductionUnitId, ProductionQty,
                    HaulerEquipmentId,
                    NoofTrip, QtyTrip, TripQtyUnitId,
                    TotalQty, OHMR, CHMR, RunningHr, TotalStoppageHours,
                    Remarks,
                    CreatedBy, CreatedDate, IsDelete
                )
                OUTPUT INSERTED.SlNo
                VALUES (
                    @Date, @ShiftId, @ShiftInChargeId, @MidScaleInchargeId, @ManPowerInShift, @PlantId,
                    @BeltScaleOHMR, @BeltScaleCHMR, @ProductionUnitId, @ProductionQty,
                    @EquipmentId,
                    @NoofTrip, @QtyTrip, @TripQtyUnitId,
                    @TotalQty, @OHMR, @CHMR, @RunningHr, @TotalStoppageHours,
                    @Remarks,
                    @CreatedBy, GETDATE(), 0
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
            console.error("Transaction Error Details:", err);
            if (err.originalError) {
                console.error("Original SQL Error:", err.originalError);
            }
            await transaction.rollback();
            throw err;
        }


    } catch (error) {
        console.error("Error creating Crusher record:", error);
        return NextResponse.json({
            success: false,
            message: error.message,
            details: error.originalError?.message || error.toString()
        }, { status: 500 });
    }
}
