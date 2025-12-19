import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req, { params }) {
    try {
        const { id } = params;
        const query = `SELECT * FROM [Trans].[TblBDSEntry] WHERE SlNo = @id AND isDelete = 0`;
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
        const updatedBy = session?.user?.name || 'Admin';

        const body = await req.json();
        const {
            Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks
        } = body;

        const query = `
            UPDATE [Trans].[TblBDSEntry]
            SET 
                Date = @Date,
                PartyId = @PartyId,
                VehicleNo = @VehicleNo,
                Weighment = @Weighment,
                CounterReading = @CounterReading,
                LoadingSheet = @LoadingSheet,
                StandardDeduction = @StandardDeduction,
                AcceptedQuantity = @AcceptedQuantity,
                ChallanNo = @ChallanNo,
                Remarks = @Remarks,
                UpdatedBy = @UpdatedBy,
                UpdatedDate = GETDATE()
            WHERE SlNo = @id
        `;

        await executeQuery(query, {
            Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks, UpdatedBy: updatedBy, id
        });

        return NextResponse.json({ success: true, message: 'Entry Updated Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = params;
        const query = `UPDATE [Trans].[TblBDSEntry] SET isDelete = 1 WHERE SlNo = @id`;
        await executeQuery(query, { id });
        return NextResponse.json({ success: true, message: 'Entry Deleted Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
