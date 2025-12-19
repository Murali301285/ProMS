
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const { date, shiftId, userId } = await req.json();

        // Helper to fetch keys
        const getIncharges = async (table, fkCol, id) => {
            const res = await executeQuery(`SELECT OperatorId FROM ${table} WHERE ${fkCol} = @id`, [{ name: 'id', value: id }]);
            return res.map(r => r.OperatorId);
        };

        let result = null;
        let source = '';

        // --- Scenario 2: Date AND Shift Selected ---
        if (shiftId) {
            // P1: User History (Date + Shift)
            let q1 = `SELECT TOP 1 SlNo, RelayId, ActivityId, EquipmentId FROM [Trans].[TblEquipmentReading] WHERE CAST([Date] AS DATE) = @date AND ShiftId = @shiftId AND CreatedBy = @userId ORDER BY CreatedDate DESC`;
            let r1 = await executeQuery(q1, [{ name: 'date', type: sql.Date, value: date }, { name: 'shiftId', value: shiftId }, { name: 'userId', value: userId }]);

            if (r1.length > 0) {
                const rec = r1[0];
                const incharges = await getIncharges('[Trans].[TblEquipmentReadingShiftIncharge]', 'EquipmentReadingId', rec.SlNo);
                const operators = await getIncharges('[Trans].[TblEquipmentReadingOperator]', 'EquipmentReadingId', rec.SlNo); // Fetch Operators too? User said "Activity, Equipment, Operator"

                return NextResponse.json({
                    success: true,
                    data: {
                        ShiftInchargeId: incharges,
                        RelayId: rec.RelayId,
                        ActivityId: rec.ActivityId,
                        EquipmentId: rec.EquipmentId,
                        OperatorId: operators
                    },
                    source: 'UserHistory_Shift'
                });
            }

            // P2: Global History (Date + Shift)
            let q2 = `SELECT TOP 1 SlNo, RelayId, ActivityId, EquipmentId FROM [Trans].[TblEquipmentReading] WHERE CAST([Date] AS DATE) = @date AND ShiftId = @shiftId ORDER BY CreatedDate DESC`;
            let r2 = await executeQuery(q2, [{ name: 'date', type: sql.Date, value: date }, { name: 'shiftId', value: shiftId }]);

            if (r2.length > 0) {
                const rec = r2[0];
                const incharges = await getIncharges('[Trans].[TblEquipmentReadingShiftIncharge]', 'EquipmentReadingId', rec.SlNo);
                const operators = await getIncharges('[Trans].[TblEquipmentReadingOperator]', 'EquipmentReadingId', rec.SlNo);

                return NextResponse.json({
                    success: true,
                    data: {
                        ShiftInchargeId: incharges,
                        RelayId: rec.RelayId,
                        ActivityId: rec.ActivityId,
                        EquipmentId: rec.EquipmentId,
                        OperatorId: operators
                    },
                    source: 'GlobalHistory_Shift'
                });
            }

            // P3: TblLoading (Date + Shift)
            // Get Incharge, Relay
            let q3 = `SELECT TOP 1 SlNo, RelayId FROM [Trans].[TblLoading] WHERE CAST(LoadingDate AS DATE) = @date AND ShiftId = @shiftId ORDER BY CreatedDate DESC`;
            let r3 = await executeQuery(q3, [{ name: 'date', type: sql.Date, value: date }, { name: 'shiftId', value: shiftId }]);

            if (r3.length > 0) {
                const rec = r3[0];
                const incharges = await getIncharges('[Trans].[TblLoadingShiftIncharge]', 'LoadingId', rec.SlNo);

                return NextResponse.json({
                    success: true,
                    data: {
                        ShiftInchargeId: incharges,
                        RelayId: rec.RelayId,
                        // Reset others
                        ActivityId: '', EquipmentId: '', OperatorId: []
                    },
                    source: 'LoadingFallback_Shift'
                });
            }

        }
        // --- Scenario 1: Only Date Selected ---
        else {
            // P1: User History (Date Only) -> Get Shift, Incharge, Relay, Activity, Op
            let q1 = `SELECT TOP 1 SlNo, ShiftId, RelayId, ActivityId, EquipmentId FROM [Trans].[TblEquipmentReading] WHERE CAST([Date] AS DATE) = @date AND CreatedBy = @userId ORDER BY CreatedDate DESC`;
            let r1 = await executeQuery(q1, [{ name: 'date', type: sql.Date, value: date }, { name: 'userId', value: userId }]);

            if (r1.length > 0) {
                const rec = r1[0];
                const incharges = await getIncharges('[Trans].[TblEquipmentReadingShiftIncharge]', 'EquipmentReadingId', rec.SlNo);
                const operators = await getIncharges('[Trans].[TblEquipmentReadingOperator]', 'EquipmentReadingId', rec.SlNo);

                return NextResponse.json({
                    success: true,
                    data: {
                        ShiftId: rec.ShiftId,
                        ShiftInchargeId: incharges,
                        RelayId: rec.RelayId,
                        ActivityId: rec.ActivityId, // Also load context
                        EquipmentId: rec.EquipmentId,
                        OperatorId: operators
                    },
                    source: 'UserHistory_Date'
                });
            }

            // P2: Global History (Date Only)
            let q2 = `SELECT TOP 1 SlNo, ShiftId, RelayId, ActivityId, EquipmentId FROM [Trans].[TblEquipmentReading] WHERE CAST([Date] AS DATE) = @date ORDER BY CreatedDate DESC`;
            let r2 = await executeQuery(q2, [{ name: 'date', type: sql.Date, value: date }]);

            if (r2.length > 0) {
                const rec = r2[0];
                const incharges = await getIncharges('[Trans].[TblEquipmentReadingShiftIncharge]', 'EquipmentReadingId', rec.SlNo);
                const operators = await getIncharges('[Trans].[TblEquipmentReadingOperator]', 'EquipmentReadingId', rec.SlNo);

                return NextResponse.json({
                    success: true,
                    data: {
                        ShiftId: rec.ShiftId,
                        ShiftInchargeId: incharges,
                        RelayId: rec.RelayId,
                        ActivityId: rec.ActivityId,
                        EquipmentId: rec.EquipmentId,
                        OperatorId: operators
                    },
                    source: 'GlobalHistory_Date'
                });
            }

            // P3: TblLoading (Date Only) -> Get Shift, Incharge, Relay
            let q3 = `SELECT TOP 1 SlNo, ShiftId, RelayId FROM [Trans].[TblLoading] WHERE CAST(LoadingDate AS DATE) = @date ORDER BY CreatedDate DESC`;
            let r3 = await executeQuery(q3, [{ name: 'date', type: sql.Date, value: date }]);

            if (r3.length > 0) {
                const rec = r3[0];
                const incharges = await getIncharges('[Trans].[TblLoadingShiftIncharge]', 'LoadingId', rec.SlNo);

                return NextResponse.json({
                    success: true,
                    data: {
                        ShiftId: rec.ShiftId,
                        ShiftInchargeId: incharges,
                        RelayId: rec.RelayId,
                        // Reset others
                        ActivityId: '', EquipmentId: '', OperatorId: []
                    },
                    source: 'LoadingFallback_Date'
                });
            }
        }

        // If no matches
        return NextResponse.json({ success: true, data: null });

    } catch (error) {
        console.error("Context Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
