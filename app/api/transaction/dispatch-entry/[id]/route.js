import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req, { params }) {
    try {
        const { id } = params;
        const query = `SELECT * FROM [Trans].[TblDispatchEntry] WHERE SlNo = @id AND isDelete = 0`;
        const data = await executeQuery(query, { id });

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
        const { id } = params;
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

        await executeQuery(query, {
            Date, DispatchLocationId, Trip, TotalQty, UOMId, Remarks, UpdatedBy: updatedBy, id
        });

        return NextResponse.json({ success: true, message: 'Entry Updated Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        const query = `UPDATE [Trans].[TblDispatchEntry] SET isDelete = 1 WHERE SlNo = @id`;
        await executeQuery(query, { id });
        return NextResponse.json({ success: true, message: 'Entry Deleted Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
