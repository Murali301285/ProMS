import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const query = `SELECT * FROM [Trans].[TblBDSEntry] WHERE SlNo = @id AND isDelete = 0`;
        const data = await executeQuery(query, [{ name: 'id', value: id }]);

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
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let updatedBy = 1; // Default Admin

        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.id) updatedBy = decoded.id;
        }

        const body = await req.json();
        const {
            Date, SMECategoryId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks
        } = body;

        const query = `
            UPDATE [Trans].[TblBDSEntry]
            SET 
                Date = @Date,
                SMECategoryId = @SMECategoryId,
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

        const sqlParams = [
            { name: 'Date', value: Date },
            { name: 'SMECategoryId', value: SMECategoryId },
            { name: 'VehicleNo', value: VehicleNo },
            { name: 'Weighment', value: Weighment },
            { name: 'CounterReading', value: CounterReading },
            { name: 'LoadingSheet', value: LoadingSheet },
            { name: 'StandardDeduction', value: StandardDeduction },
            { name: 'AcceptedQuantity', value: AcceptedQuantity },
            { name: 'ChallanNo', value: ChallanNo },
            { name: 'Remarks', value: Remarks },
            { name: 'UpdatedBy', value: updatedBy },
            { name: 'id', value: id }
        ];

        await executeQuery(query, sqlParams);

        return NextResponse.json({ success: true, message: 'Entry Updated Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let updatedBy = 1; // Default Admin

        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.id) updatedBy = decoded.id;
        }

        const query = `UPDATE [Trans].[TblBDSEntry] SET isDelete = 1, UpdatedBy = @UpdatedBy, UpdatedDate = GETDATE() WHERE SlNo = @id`;
        await executeQuery(query, [
            { name: 'UpdatedBy', value: updatedBy },
            { name: 'id', value: id }
        ]);
        return NextResponse.json({ success: true, message: 'Entry Deleted Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
