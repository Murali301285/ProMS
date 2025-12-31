import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let createdBy = 1; // Default to Admin (ID 1)

        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.id) createdBy = decoded.id;
        }

        const body = await req.json();
        const {
            Date, SMECategoryId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks
        } = body;

        const query = `
            INSERT INTO [Trans].[TblBDSEntry] 
            (Date, SMECategoryId, VehicleNo, Weighment, CounterReading, LoadingSheet, StandardDeduction, AcceptedQuantity, ChallanNo, Remarks, CreatedBy, CreatedDate, isDelete)
            VALUES 
            (@Date, @SMECategoryId, @VehicleNo, @Weighment, @CounterReading, @LoadingSheet, @StandardDeduction, @AcceptedQuantity, @ChallanNo, @Remarks, @CreatedBy, GETDATE(), 0)
        `;

        const params = [
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
            { name: 'CreatedBy', value: createdBy }
        ];

        await executeQuery(query, params);

        return NextResponse.json({ success: true, message: 'Entry Created Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
