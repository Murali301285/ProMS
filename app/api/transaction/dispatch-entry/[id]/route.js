export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const query = `SELECT * FROM [Trans].[TblDispatchEntry] WHERE SlNo = @id AND isDelete = 0`;
        const data = await executeQuery(query, [{ name: 'id', type: sql.Int, value: id }]);

        if (data.length === 0) {
            return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: data[0] });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const session = await getSession();
        const updatedBy = session?.user?.id || 1;

        const body = await req.json();
        const {
            Date, DispatchLocationId, Trip, TotalQty, UOMId, Remarks
        } = body;

        const query = `
            UPDATE [Trans].[TblDispatchEntry]
            SET 
                Date = @Date,
                DispatchLocationId = @DispatchLocationId,
                Trip = @Trip,
                TotalQty = @TotalQty,
                UOMId = @UOMId,
                Remarks = @Remarks,
                UpdatedBy = @UpdatedBy,
                UpdatedDate = GETDATE()
            WHERE SlNo = @id
        `;

        await executeQuery(query, [
            { name: 'Date', type: sql.Date, value: Date },
            { name: 'DispatchLocationId', type: sql.Int, value: DispatchLocationId },
            { name: 'Trip', type: sql.Int, value: Trip },
            { name: 'TotalQty', type: sql.Decimal(18, 2), value: TotalQty },
            { name: 'UOMId', type: sql.Int, value: UOMId },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks },
            { name: 'UpdatedBy', type: sql.Int, value: updatedBy },
            { name: 'id', type: sql.Int, value: id }
        ]);

        return NextResponse.json({ success: true, message: 'Entry Updated Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const session = await getSession();
        const updatedBy = session?.user?.id || 1;

        const query = `UPDATE [Trans].[TblDispatchEntry] SET isDelete = 1, UpdatedBy = @UpdatedBy, UpdatedDate = GETDATE() OUTPUT INSERTED.SlNo WHERE SlNo = @id AND IsDelete = 0`;
        const result = await executeQuery(query, [
            { name: 'id', type: sql.Int, value: id },
            { name: 'UpdatedBy', type: sql.Int, value: updatedBy }
        ]);

        if (result && result.length > 0) {
            return NextResponse.json({ success: true, message: 'Entry Deleted Successfully' });
        } else {
            return NextResponse.json({ success: false, message: 'Record not found or already deleted' }, { status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
