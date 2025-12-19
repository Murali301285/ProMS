import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
// import { getSession } from '@/lib/session';

export async function POST(req) {
    try {
        // const session = await getSession();
        // const createdBy = session?.user?.name || 'Admin';
        const createdBy = 'Admin';

        const body = await req.json();
        const {
            Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks
        } = body;

        const query = `
            INSERT INTO [Trans].[TblBDSEntry] 
            (Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet, StandardDeduction, AcceptedQuantity, ChallanNo, Remarks, CreatedBy, CreatedDate, isDelete)
            VALUES 
            (@Date, @PartyId, @VehicleNo, @Weighment, @CounterReading, @LoadingSheet, @StandardDeduction, @AcceptedQuantity, @ChallanNo, @Remarks, @CreatedBy, GETDATE(), 0)
        `;

        const params = [
            { name: 'Date', value: Date },
            { name: 'PartyId', value: PartyId },
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
