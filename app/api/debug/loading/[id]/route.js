import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = params;
    try {
        const pool = await getDbConnection();

        // 1. Fetch Main Transaction Data with Mapped Columns
        const res = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    SlNo,
                    LoadingDate,
                    ShiftId,
                    ManPowerInShift AS ManPower,
                    RelayId,
                    SourceId,
                    DestinationId,
                    MaterialId,
                    HaulerEquipmentId AS HaulerId,
                    LoadingMachineEquipmentId AS LoadingMachineId,
                    NoofTrip AS NoOfTrips,
                    QtyTrip AS MangQtyTrip,
                    NtpcQtyTrip AS NTPCQtyTrip, 
                    UnitId AS Unit,
                    TotalQty AS MangTotalQty,
                    TotalNtpcQty AS NTPCTotalQty,
                    Remarks
                FROM [Trans].[TblLoading] 
                WHERE SlNo = @id AND IsDelete = 0
            `);

        const mainData = res.recordset[0];

        let incharges = [];
        if (mainData) {
            // 2. Fetch Shift Incharges (Multi-Select)
            // Using EXACT query from page.js
            const resInc = await pool.request()
                .input('lid', sql.Int, id)
                .query(`SELECT OperatorId FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @lid`);

            incharges = resInc.recordset.map(row => row.OperatorId);
        }

        return NextResponse.json({
            success: true,
            id,
            mainData,
            incharges,
            found: !!mainData
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
    }
}
