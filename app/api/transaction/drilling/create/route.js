import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();

        // Manual Validation (Basic)
        if (!body.Date || !body.EquipmentId || !body.MaterialId) {
            return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const requestSql = pool.request();

        // Get User ID from Session/Cookie if possible, else Default to 1 (Admin) or from body
        // For now, assumming we get User ID from auth middleware or passed in body
        // In this project, we usually fetch it from session. 
        // Let's assume passed in body or default to 2 (Admin) for safety if auth fails
        let createdBy = 2;
        try {
            // Mock Auth check or similar if needed. For now simple.
            // If you have a solid auth system, retrieve userId there.
            // Example: const session = await getSession(); createdBy = session.user.id;
            // Here we will use the one passed from frontend or default
            if (body.CreatedBy) createdBy = body.CreatedBy;
        } catch (e) { }


        const query = `
            INSERT INTO [Trans].[TblDrilling] (
                [Date],
                [DrillingPatchId],
                [EquipmentId],
                [MaterialId],
                [LocationId],
                [SectorId],
                [ScaleId],
                [StrataId],
                [DepthSlabId],
                [NoofHoles],
                [TotalMeters],
                [Spacing],
                [Burden],
                [TopRLBottomRL],
                [AverageDepth],
                [Output],
                [UnitId],
                [TotalQty],
                [RemarkId],
                [Remarks],
                [CreatedBy],
                [CreatedDate],
                [IsDelete]
            ) VALUES (
                @Date,
                @DrillingPatchId,
                @EquipmentId,
                @MaterialId,
                @LocationId,
                @SectorId,
                @ScaleId,
                @StrataId,
                @DepthSlabId,
                @NoofHoles,
                @TotalMeters,
                @Spacing,
                @Burden,
                @TopRLBottomRL,
                @AverageDepth,
                @Output,
                @UnitId,
                @TotalQty,
                @RemarkId,
                @Remarks,
                @CreatedBy,
                GETDATE(),
                0
            )
        `;

        requestSql.input('Date', sql.Date, body.Date);
        requestSql.input('DrillingPatchId', sql.NVarChar, body.DrillingPatchId);
        requestSql.input('EquipmentId', sql.BigInt, body.EquipmentId);
        requestSql.input('MaterialId', sql.BigInt, body.MaterialId);
        requestSql.input('LocationId', sql.BigInt, body.LocationId);
        requestSql.input('SectorId', sql.BigInt, body.SectorId);
        requestSql.input('ScaleId', sql.BigInt, body.ScaleId);
        requestSql.input('StrataId', sql.BigInt, body.StrataId);
        requestSql.input('DepthSlabId', sql.BigInt, body.DepthSlabId);
        requestSql.input('NoofHoles', sql.Int, body.NoofHoles);
        requestSql.input('TotalMeters', sql.Decimal(18, 3), body.TotalMeters);
        requestSql.input('Spacing', sql.Decimal(18, 3), body.Spacing);
        requestSql.input('Burden', sql.Decimal(18, 3), body.Burden);
        requestSql.input('TopRLBottomRL', sql.NVarChar, body.TopRLBottomRL);
        requestSql.input('AverageDepth', sql.Decimal(18, 3), body.AverageDepth);
        requestSql.input('Output', sql.Decimal(18, 2), body.Output); // Output %
        requestSql.input('UnitId', sql.BigInt, body.UnitId);
        requestSql.input('TotalQty', sql.Decimal(18, 3), body.TotalQty);
        requestSql.input('RemarkId', sql.BigInt, body.RemarkId);
        requestSql.input('Remarks', sql.NVarChar, body.Remarks);
        requestSql.input('CreatedBy', sql.BigInt, createdBy);

        await requestSql.query(query);

        return NextResponse.json({ success: true, message: 'Drilling record created successfully' });

    } catch (error) {
        console.error('Create Drilling Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
