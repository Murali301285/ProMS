import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req) {
    try {
        const body = await req.json();
        const { data } = body; // Array of rows
        const session = await getSession();
        const createdBy = session?.user?.name || 'Admin'; // Or ID if integer

        // Assuming data is an array of objects matching the table columns
        // We will process them one by one or in a batch. 
        // For simple error reporting per row, one by one is easier to debug but slower. 
        // Given the UI wizard sends one by one (or the UI wizard sends a batch? Check BulkUploadWizard).
        // The BulkUploadWizard sends one by one in a loop (see: handleProcess loop).
        // So this API just needs to handle a single CREATE action or we can support batch.
        // Let's support Single Item Create to match the Wizard's loop pattern "process one by one".

        // Wait, the generic CRUD API handles { action: 'create', data: payload }.
        // I should match that signature so I can reuse logic if I want, or just simple insert.

        const { Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet, StandardDeduction, AcceptedQuantity, ChallanNo, Remarks } = data;

        // Validation
        if (!Date || !PartyId || !VehicleNo) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
            INSERT INTO [Trans].[TblBDSEntry] 
            (Date, PartyId, VehicleNo, Weighment, CounterReading, LoadingSheet, StandardDeduction, AcceptedQuantity, ChallanNo, Remarks, CreatedBy, CreatedDate, isDelete)
            VALUES 
            (@Date, @PartyId, @VehicleNo, @Weighment, @CounterReading, @LoadingSheet, @StandardDeduction, @AcceptedQuantity, @ChallanNo, @Remarks, @CreatedBy, GETDATE(), 0)
        `;

        await executeQuery(query, {
            Date: Date, // Ensure format YYYY-MM-DD
            PartyId,
            VehicleNo,
            Weighment,
            CounterReading,
            LoadingSheet,
            StandardDeduction,
            AcceptedQuantity,
            ChallanNo,
            Remarks,
            CreatedBy: createdBy
        });

        return NextResponse.json({ success: true, message: 'Inserted Successfully' });

    } catch (error) {
        console.error("BDS Bulk Upload Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
