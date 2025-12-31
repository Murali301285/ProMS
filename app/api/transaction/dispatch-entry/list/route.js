import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { fromDate, toDate, dispatchLocationId } = await req.json();

        const query = `
            SELECT 
                t.*,
                l.LocationName as DispatchLocationName,
                u.Name as UnitName,
                usr.EmpName as CreatedByName,
                usr2.EmpName as UpdatedByName
            FROM [Trans].[TblDispatchEntry] t
            LEFT JOIN [Master].[TblLocation] l ON t.DispatchLocationId = l.SlNo
            LEFT JOIN [Master].[TblUnit] u ON t.UOMId = u.SlNo
            LEFT JOIN [Master].[TblUser_New] usr ON t.CreatedBy = usr.SlNo
            LEFT JOIN [Master].[TblUser_New] usr2 ON t.UpdatedBy = usr2.SlNo
            WHERE (t.isDelete = 0 OR t.isDelete IS NULL) 
            AND CAST(t.Date AS DATE) >= @fromDate 
            AND CAST(t.Date AS DATE) <= @toDate
            AND (@dispatchLocationId IS NULL OR t.DispatchLocationId = @dispatchLocationId)
            ORDER BY t.SlNo DESC
        `;

        const data = await executeQuery(query, [
            { name: 'fromDate', value: fromDate },
            { name: 'toDate', value: toDate },
            { name: 'dispatchLocationId', value: dispatchLocationId || null }
        ]);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Dispatch Entry List Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
