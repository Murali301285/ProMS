
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const { date, shiftId, userId } = await req.json();

        // Priority 1: Check EquipmentReading for Logged User (Date)
        // If Shift is provided, we might want to prioritize that? 
        // User said: "If Only Date Selected... priority 1-> check is any data is already inserted on the date for logged in user"
        // Let's look for ANY record on that date for that user.
        let query1 = `
            SELECT TOP 1 ShiftId, RelayId
            FROM [Trans].[TblEquipmentReading]
            WHERE CAST([Date] AS DATE) = @date AND CreatedBy = @userId
            ORDER BY CreatedDate DESC
        `;

        let res1 = await executeQuery(query1, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'userId', type: sql.Int, value: userId }
        ]);

        if (res1.length > 0) {
            // Fetch Shift Incharges for this Shift/Date context? 
            // Actually the requirement says "load initial data" -> Shift, Incharge, Relay.
            // But Incharge is in a child table. We need to fetch it too.
            // Use the shiftID/Relay found to fetch *possible* defaults or just use the values?
            // "load only data to mentioned controls" -> implying we copy from the FOUND record.
            // But wait, the found record might have specific incharges.
            // Let's fetch the Incharges from the LAST record found.
            // We need the ID of that record to fetch incharges.

            // Re-query to get ID
            query1 = `
                SELECT TOP 1 SlNo, ShiftId, RelayId
                FROM [Trans].[TblEquipmentReading]
                WHERE CAST([Date] AS DATE) = @date AND CreatedBy = @userId
                ORDER BY CreatedDate DESC
            `;
            res1 = await executeQuery(query1, [
                { name: 'date', type: sql.Date, value: date },
                { name: 'userId', type: sql.Int, value: userId }
            ]);

            const rec = res1[0];
            const incharges = await executeQuery(`SELECT OperatorId FROM [Trans].[TblEquipmentReadingShiftIncharge] WHERE EquipmentReadingId = @id`, [{ name: 'id', value: rec.SlNo }]);

            return NextResponse.json({
                success: true,
                data: {
                    ShiftId: rec.ShiftId,
                    RelayId: rec.RelayId,
                    ShiftInchargeId: incharges.map(i => i.OperatorId)
                },
                source: 'UserHistory'
            });
        }

        // Priority 2: Check EquipmentReading for ANY User
        let query2 = `
            SELECT TOP 1 SlNo, ShiftId, RelayId
            FROM [Trans].[TblEquipmentReading]
            WHERE CAST([Date] AS DATE) = @date
            ORDER BY CreatedDate DESC
        `;
        const res2 = await executeQuery(query2, [{ name: 'date', type: sql.Date, value: date }]);

        if (res2.length > 0) {
            const rec = res2[0];
            const incharges = await executeQuery(`SELECT OperatorId FROM [Trans].[TblEquipmentReadingShiftIncharge] WHERE EquipmentReadingId = @id`, [{ name: 'id', value: rec.SlNo }]);

            return NextResponse.json({
                success: true,
                data: {
                    ShiftId: rec.ShiftId,
                    RelayId: rec.RelayId,
                    ManPower: rec.ManPower,
                    ShiftInchargeId: incharges.map(i => i.OperatorId)
                },
                source: 'GlobalHistory'
            });
        }

        // Priority 3: Fallback to [Trans].[TblLoading]
        // "get the Incharge,Man Power, Relay from [Trans].[TblLoading]"
        // If ShiftId is provided (from our request), use it. Else just use Date (get top 1).

        let query3 = `
            SELECT TOP 1 SlNo, ShiftId, RelayId, ManPowerInShift as ManPower
            FROM [Trans].[TblLoading]
            WHERE CAST(LoadingDate AS DATE) = @date
        `;

        if (shiftId) {
            query3 += ` AND ShiftId = @shiftId`;
        }

        query3 += ` ORDER BY CreatedDate DESC`;

        const params3 = [{ name: 'date', type: sql.Date, value: date }];
        if (shiftId) params3.push({ name: 'shiftId', type: sql.Int, value: shiftId });

        const res3 = await executeQuery(query3, params3);

        if (res3.length > 0) {
            const rec = res3[0];
            // Fetch Loading Incharges
            // [Trans].[TblLoadingShiftIncharge]
            const incharges = await executeQuery(`SELECT OperatorId FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @id`, [{ name: 'id', value: rec.SlNo }]);

            return NextResponse.json({
                success: true,
                data: {
                    ShiftId: rec.ShiftId,
                    RelayId: rec.RelayId,
                    ManPower: rec.ManPower,
                    ShiftInchargeId: incharges.map(i => i.OperatorId)
                },
                source: 'LoadingFallback'
            });
        }

        return NextResponse.json({ success: true, data: null });

    } catch (error) {
        console.error("Context Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
