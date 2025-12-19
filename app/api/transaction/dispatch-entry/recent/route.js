import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { decode } from 'jsonwebtoken';

export async function POST(request) {
    try {
        const body = await request.json();
        const { date } = body;

        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        let username = 'System';
        if (token) {
            const decoded = decode(token.value);
            username = decoded?.username || 'System';
        }

        const pool = await getDbConnection();
        const result = await pool.request()
            .input('date', sql.Date, date)
            .input('user', sql.VarChar, username)
            .query(`
                SELECT 
                    T.SlNo,
                    T.Date,
                    T.Trip,
                    T.TotalQty,
                    T.Remarks,
                    T.CreatedBy as CreatedByName, 
                    T.CreatedDate,
                    L.LocationName as DispatchLocation,
                    U.Name as UOM
                FROM [Trans].[TblDispatchEntry] T
                LEFT JOIN [Master].[TblLocation] L ON T.DispatchLocationId = L.SlNo
                LEFT JOIN [Master].[TblUnit] U ON T.UOMId = U.SlNo
                WHERE T.IsDelete = 0 
                AND CAST(T.Date AS DATE) = @date
                -- Priority: User's data first? Or just filter by User?
                -- Prompt: "check is any data is already inserted on the date for logged in user... if yes then load initial data"
                -- Wait, logic for "Initial Load" of FORM vs "Recent Data" TABLE?
                -- "Recent Dispatch Entry data has to be loaded" (Table).
                -- "Logic for initial loading... priority 1-> check is any data is already inserted... if yes then load initial data".
                -- This likely means: If user enters Date X, fetch the LATEST record for that date/user and PRE-FILL the form?
                -- Prompt says: "load initial data" if exists.
                -- BUT Prompt ALSO says: "if data is inserted -> Date should remain same and others reset".
                -- Let's stick to "Recent Data" API returning a List for the Table.
                -- And "Initial Load" logic might be handled by a separate call or same call?
                -- The requirement "Recent Dispatch Entry data has to be loaded" refers to the Bottom Table.
                -- The requirement "Logic for initial loading... load initial data" refers to form pre-filling?
                -- "If Only Date Selected or Entered... load initial data"
                -- I will return the LIST here. Frontend can pick the top one if it needs to pre-fill.
                AND T.CreatedBy = @user
                ORDER BY T.CreatedDate DESC
            `);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
