
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await authenticateUser(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Base Query - Filter by Logged In User
        let query = `
            SELECT
                t.SlNo,
                t.Date,
                t.BlastingPatchId,
                s.Name as SMESupplierName,
                t.SMEQty,
                t.MaxChargeHole,
                t.PPV,
                t.NoofHolesDeckCharged,
                t.NoofWetHole,
                t.AirPressure,
                t.TotalExplosiveUsed,
                t.Remarks,
                t.CreatedDate,
                t.UpdatedDate,
                u.UserName as CreatedBy,
                u.EmpName as CreatedByName,
                u2.UserName as UpdatedBy
            FROM [Trans].[TblBlasting] t
            LEFT JOIN [Master].[TblSMESupplier] s ON t.SMESupplierId = s.SlNo
            LEFT JOIN [Master].[TblUser_New] u ON t.CreatedBy = u.SlNo
            LEFT JOIN [Master].[TblUser_New] u2 ON t.UpdatedBy = u2.SlNo
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: session.id }];

        // Dynamic Filtering
        // Date
        if (body.Date) {
            query += ` AND CAST(t.Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: body.Date });
        }

        // Patch ID (Like search)
        if (body.BlastingPatchId) {
            query += ` AND t.BlastingPatchId LIKE @patchId`;
            params.push({ name: 'patchId', type: sql.VarChar, value: `%${body.BlastingPatchId}%` });
        }

        // Exact Filters for IDs
        if (body.SMESupplierId) {
            query += ` AND t.SMESupplierId = @supplierId`;
            params.push({ name: 'supplierId', type: sql.Int, value: body.SMESupplierId });
        }

        query += ` ORDER BY t.SlNo DESC`;

        const data = await executeQuery(query, params);

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Blasting Recent List Error:", error);
        return NextResponse.json({ message: 'Error fetching list', error: error.message }, { status: 500 });
    }
}
