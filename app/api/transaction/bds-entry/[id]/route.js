export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const query = `SELECT * FROM [Trans].[TblBDSEntry] WHERE SlNo = @id AND isDelete = 0`;
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
            { name: 'Date', type: sql.Date, value: Date },
            { name: 'SMECategoryId', type: sql.Int, value: SMECategoryId },
            { name: 'VehicleNo', type: sql.NVarChar, value: VehicleNo },
            { name: 'Weighment', type: sql.Decimal(18, 3), value: Weighment },
            { name: 'CounterReading', type: sql.Decimal(18, 3), value: CounterReading },
            { name: 'LoadingSheet', type: sql.Decimal(18, 3), value: LoadingSheet },
            { name: 'StandardDeduction', type: sql.Decimal(18, 3), value: StandardDeduction },
            { name: 'AcceptedQuantity', type: sql.Decimal(18, 3), value: AcceptedQuantity },
            { name: 'ChallanNo', type: sql.NVarChar, value: ChallanNo },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks },
            { name: 'UpdatedBy', type: sql.Int, value: updatedBy },
            { name: 'id', type: sql.Int, value: id }
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

        const query = `UPDATE [Trans].[TblBDSEntry] SET isDelete = 1, UpdatedBy = @UpdatedBy, UpdatedDate = GETDATE() OUTPUT INSERTED.SlNo WHERE SlNo = @id AND IsDelete = 0`;
        const result = await executeQuery(query, [
            { name: 'UpdatedBy', type: sql.Int, value: updatedBy },
            { name: 'id', type: sql.Int, value: id }
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
