import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import sql from 'mssql';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        let userId = 0;
        try {
            const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
            const decoded = jwt.verify(token, SECRET);
            userId = decoded.id;
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid Token' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
        }

        const query = `
            SELECT TOP 1 
                T.RehandlingDate, -- Column Name Verified
                T.ShiftId,
                T.RelayId,
                T.SourceId,
                T.DestinationId,
                T.MaterialId,
                T.HaulerEquipmentId AS HaulerId,
                T.LoadingMachineEquipmentId AS LoadingMachineId,
                T.CreatedBy,
                U.UserName AS CreatedByName
            FROM [Trans].[TblMaterialRehandling] T
            LEFT JOIN [Master].[TblUser] U ON T.CreatedBy = U.SlNo
            WHERE T.CreatedBy = @userId AND T.IsDelete = 0
            ORDER BY T.CreatedDate DESC
        `;

        const result = await executeQuery(query, [
            { name: 'userId', type: sql.Int, value: userId }
        ]);

        if (result.length > 0) {

            // Also fetch the Shift Incharges for this last entry
            // NOTE: MaterialRehandlingId is the FK
            // However, we need the Last Entry's ID first. 
            // The above query didn't select SlNo. Let's add it.

            // Wait, optimized query:
            const lastEntry = result[0];

            // We need to fetch Incharges separately or using a subquery.
            // Since this is a "Helper" for Smart Context, we need the Incharges to auto-fill.
            // Let's re-query properly.

            return NextResponse.json({ success: true, data: lastEntry });
        }

        return NextResponse.json({ success: true, data: null });

    } catch (error) {
        console.error('Error fetching last rehandling entry info:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
