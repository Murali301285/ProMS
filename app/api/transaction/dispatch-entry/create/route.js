import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session'; // Or however auth is handled

export async function POST(req) {
    try {
        const session = await getSession();
        // Fallback or specific user logic. Using 'Admin' if no session, or specific user. 
        // Typically req.headers or session.
        const createdBy = session?.user?.name || 'Admin';

        const body = await req.json();
        const {
            Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks
        } = body;

        // Validation?
        if (!Date || !PartyId || !VehicleNo) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
            INSERT INTO [Trans].[TblBDSEntry] 
            (Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet, StandardDeduction, AcceptedQuantity, ChallanNo, Remarks, CreatedBy, CreatedDate)
            VALUES 
            (@Date, @PartyId, @VehicleNo, @Weighment, @CounterReading, @LoadingSheet, @StandardDeduction, @AcceptedQuantity, @ChallanNo, @Remarks, @CreatedBy, GETDATE())
        `;

        await executeQuery(query, {
            Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet,
            StandardDeduction, AcceptedQuantity, ChallanNo, Remarks, CreatedBy: createdBy
        });

        return NextResponse.json({ success: true, message: 'Entry Created Successfully' });
    } catch (error) {
        console.error("Dispatch Entry Create Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
