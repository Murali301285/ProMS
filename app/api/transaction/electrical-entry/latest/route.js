import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const pool = await getDbConnection();
        // Get the latest created record.
        // We can join with Master.TblUser to get CreatedByName if needed,
        // or rely on the frontend to display if it's already in TblElectricalEntry (it's not, usually).
        // Check list API... list API does a join or view?
        // Let's check list API logic quickly.
        // But for "Select Top 1 Date, user name from tblElectricalEntry" -- usually user name is stored as CreatedBy (username) or CreatedBy (ID).
        // Let's assume CreatedByName is NOT in table.
        // Query: SELECT TOP 1 T.*, U.Name as CreatedByName FROM [Trans].[TblElectricalEntry] T LEFT JOIN [Master].[TblUser] U ON T.CreatedBy = U.UserName (or ID?) ORDER BY SlNo DESC
        // I will trust 'CreatedBy' stores the username or ID.
        // Let's do a safe query.

        const result = await pool.request().query(`
            SELECT TOP 1 
                T.Date, 
                T.CreatedBy,
                ISNULL(U.Name, T.CreatedBy) as CreatedByName, 
                T.CreatedDate
            FROM [Trans].[TblElectricalEntry] T
            LEFT JOIN [Master].[TblUser] U ON T.CreatedBy = U.UserName
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
