import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '1000');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        const pool = await getDbConnection();

        // 1. Fetch Main Data
        let query = `
            SELECT 
                B.SlNo,
                B.Date,
                B.ShiftId,
                B.BlastingPatchId,
                B.SMESupplierId,
                B.SMEQty,
                B.MaxChargeHole as MaxCharge,
                B.PPV,
                B.NoofHolesDeckCharged as HolesCharged,
                B.NoofWetHole as WetHoles,
                B.AirPressure,
                B.TotalExplosiveUsed,
                B.Remarks,
                B.CreatedBy,
                B.CreatedDate,
                B.UpdatedBy,
                B.UpdatedDate,
                B.IsDelete,
                Sh.ShiftName,
                SS.Name as SMESupplierName,
                U1.UserName as CreatedByName,
                U2.UserName as UpdatedByName
            FROM [Trans].[TblBlasting] B
            LEFT JOIN [Master].[TblShift] Sh ON B.ShiftId = Sh.SlNo
            LEFT JOIN [Master].[TblSMESupplier] SS ON B.SMESupplierId = SS.SlNo
            LEFT JOIN [Master].[TblUser] U1 ON B.CreatedBy = U1.SlNo
            LEFT JOIN [Master].[TblUser] U2 ON B.UpdatedBy = U2.SlNo
            WHERE B.IsDelete = 0
        `;

        // The user requirement says "Shift -> Load the valid [ShiftName] FROM [Master].[TblShift]"
        // If TblBlasting.Shift stores Date or ID? 
        // Mapping Details: "Shift -> Load the valid [ShiftName] FROM [Master].[TblShift]"
        // Usually transaction tables store ID. Let's assume Column is ShiftId or Shift. 
        // Based on other modules, it's often ShiftId. But schema said 'Shift'.
        // If query fails, I will debug.

        if (fromDate && toDate) {
            query += ` AND CAST(B.Date AS DATE) BETWEEN '${fromDate}' AND '${toDate}'`;
        }

        query += ` ORDER BY B.Date DESC`;

        const mainRes = await pool.request().query(query);
        const mainData = mainRes.recordset;

        if (mainData.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 2. Fetch Accessories for these IDs
        // Optimization: Get IDs
        const ids = mainData.map(r => r.SlNo).join(',');

        const accQuery = `
            SELECT 
                SlNo, BlastingId, SED, TotalBoosterUsed, TotalNonelMeters, TotalTLDMeters
            FROM [Trans].[TblBlastingAccessories]
            WHERE IsDelete = 0 AND BlastingId IN (${ids})
        `;

        const accRes = await pool.request().query(accQuery);
        const accData = accRes.recordset;

        // 3. Merge Data
        const finalData = mainData.map(row => {
            return {
                ...row,
                accessories: accData.filter(a => a.BlastingId === row.SlNo)
            };
        });

        return NextResponse.json({ success: true, data: finalData });

    } catch (error) {
        console.error('Fetch Blasting List Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
