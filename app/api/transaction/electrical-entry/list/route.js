import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { fromDate, toDate } = body; // Optional filters

        const pool = await getDbConnection();

        // Base Query
        let query = `
            SELECT 
                T.SlNo,
                T.Date,
                S.ShiftName,
                R.Name as RelayName,
                CASE WHEN T.PlantId IS NOT NULL THEN P.Name ELSE E.EquipmentName END as EquipmentName,
                T.Type,
                T.EquipmentId,
                T.PlantId,
                T.OMR,
                T.CMR,
                T.TotalUnit,
                U.Name as UnitName,
                T.Remarks,
                ISNULL(U1.EmpName, 'Unknown') as CreatedByName,
                T.CreatedDate,
                ISNULL(U2.EmpName, 'Unknown') as UpdatedByName,
                T.UpdatedDate
            FROM [Trans].[TblElectricalEntry] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblEquipment] E ON T.EquipmentId = E.SlNo
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            LEFT JOIN [Master].[TblUser_New] U1 ON T.CreatedBy = U1.SlNo
            LEFT JOIN [Master].[TblUser_New] U2 ON T.UpdatedBy = U2.SlNo
            WHERE T.IsDelete = 0
        `;

        // Apply Date Filter if provided
        if (fromDate && toDate) {
            query += ` AND T.Date BETWEEN @fromDate AND @toDate`;
        }

        query += ` ORDER BY T.Date DESC, T.CreatedDate DESC`; // Default Sort

        const req = pool.request();
        if (fromDate && toDate) {
            req.input('fromDate', sql.Date, fromDate);
            req.input('toDate', sql.Date, toDate);
        }

        const result = await req.query(query);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("Electrical Entry List API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
