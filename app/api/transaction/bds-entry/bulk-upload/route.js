import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
// import { getSession } from '@/lib/session';

export async function POST(req) {
    try {
        const body = await req.json();
        const { data } = body;
        // const session = await getSession();
        const createdBy = 'Admin'; // session?.user?.name || 'Admin';

        const { Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet, StandardDeduction, AcceptedQuantity, ChallanNo, Remarks } = data;

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

        return NextResponse.json({ success: true, message: 'Inserted Successfully' });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
