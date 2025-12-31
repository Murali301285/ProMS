import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const pool = await getDbConnection();

        const result = await pool.request().query(`
            SELECT TOP 1 
                T.EntryDate, 
                T.CreatedBy,
                ISNULL(U.EmpName, 'Unknown') as CreatedByName, 
                T.CreatedDate
            FROM [Transaction].[TblWaterTankerEntry] T
            LEFT JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.SlNo
            WHERE T.IsDelete = 0
            ORDER BY T.SlNo DESC
        `);

        if (result.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "No records found" });
        }

        return NextResponse.json({ success: true, data: result.recordset[0] });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
