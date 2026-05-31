export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

// GET Single Record
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const pool = await getDbConnection();
        const result = await pool.request()
            .input('Id', sql.BigInt, id)
            .query(`
                SELECT * FROM [Trans].[TblDrilling] 
                WHERE SlNo = @Id AND IsDelete = 0
            `);

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.recordset[0] });

    } catch (error) {
        console.error('Fetch Drilling Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE Record
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const user = await authenticateUser(request);
        const userId = user ? user.id : 1;

        const pool = await getDbConnection();
        const requestSql = pool.request();

        const query = `
            UPDATE [Trans].[TblDrilling]
            SET 
                [Date] = @Date,
                [DrillingPatchId] = @DrillingPatchId,
                [DrillingAgencyId] = @DrillingAgencyId,
                [EquipmentId] = @EquipmentId,
                [MaterialId] = @MaterialId,
                [LocationId] = @LocationId,
                [SectorId] = @SectorId,
                [ScaleId] = @ScaleId,
                [StrataId] = @StrataId,
                [DepthSlabId] = @DepthSlabId,
                [NoofHoles] = @NoofHoles,
                [TotalMeters] = @TotalMeters,
                [Spacing] = @Spacing,
                [Burden] = @Burden,
                [TopRLBottomRL] = @TopRLBottomRL,
                [AverageDepth] = @AverageDepth,
                [Output] = @Output,
                [UnitId] = @UnitId,
                [TotalQty] = @TotalQty,
                [RemarkId] = @RemarkId,
                [Remarks] = @Remarks,
                [UpdatedBy] = @UpdatedBy,
                [UpdatedDate] = GETDATE()
            WHERE SlNo = @Id
        `;

        const toNull = val => (val === '' || val === undefined) ? null : val;

        requestSql.input('Id', sql.BigInt, id);
        requestSql.input('Date', sql.Date, body.Date);
        requestSql.input('DrillingPatchId', sql.NVarChar, body.DrillingPatchId);
        requestSql.input('DrillingAgencyId', sql.Int, toNull(body.DrillingAgencyId));
        requestSql.input('EquipmentId', sql.BigInt, toNull(body.EquipmentId));
        requestSql.input('MaterialId', sql.BigInt, toNull(body.MaterialId));
        requestSql.input('LocationId', sql.BigInt, toNull(body.LocationId));
        requestSql.input('SectorId', sql.BigInt, toNull(body.SectorId));
        requestSql.input('ScaleId', sql.BigInt, toNull(body.ScaleId));
        requestSql.input('StrataId', sql.BigInt, toNull(body.StrataId));
        requestSql.input('DepthSlabId', sql.BigInt, toNull(body.DepthSlabId));
        requestSql.input('NoofHoles', sql.Int, toNull(body.NoofHoles));
        requestSql.input('TotalMeters', sql.Decimal(18, 3), toNull(body.TotalMeters));
        requestSql.input('Spacing', sql.Decimal(18, 3), toNull(body.Spacing));
        requestSql.input('Burden', sql.Decimal(18, 3), toNull(body.Burden));
        requestSql.input('TopRLBottomRL', sql.NVarChar, toNull(body.TopRLBottomRL));
        requestSql.input('AverageDepth', sql.Decimal(18, 3), toNull(body.AverageDepth));
        requestSql.input('Output', sql.Decimal(18, 2), toNull(body.Output));
        requestSql.input('UnitId', sql.BigInt, toNull(body.UnitId));
        requestSql.input('TotalQty', sql.Decimal(18, 3), toNull(body.TotalQty));
        requestSql.input('RemarkId', sql.BigInt, toNull(body.RemarkId));
        requestSql.input('Remarks', sql.NVarChar, toNull(body.Remarks));
        requestSql.input('UpdatedBy', sql.BigInt, userId);

        await requestSql.query(query);

        return NextResponse.json({ success: true, message: 'Record updated successfully' });

    } catch (error) {
        console.error('Update Drilling Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE Record (Soft Delete)
export async function DELETE(request, { params }) {
    try {
        const user = await authenticateUser(request);
        const { id } = await params;
        const pool = await getDbConnection();

        // Soft delete logic with Audit
        const result = await pool.request()
            .input('Id', sql.BigInt, id)
            .input('UserId', sql.BigInt, user ? user.id : 1)
            .query("UPDATE [Trans].[TblDrilling] SET IsDelete = 1, UpdatedBy = @UserId, UpdatedDate = GETDATE() OUTPUT INSERTED.SlNo WHERE SlNo = @Id");

        if (result.recordset && result.recordset.length > 0) {
            return NextResponse.json({ success: true, message: 'Record deleted successfully' });
        } else {
            return NextResponse.json({ success: false, message: 'Record not found or already deleted' }, { status: 404 });
        }

    } catch (error) {
        console.error('Delete Drilling Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
