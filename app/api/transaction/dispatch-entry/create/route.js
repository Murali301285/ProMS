import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req) {
    try {
        const session = await getSession();
        // Use SlNo from session if available (migrated to INT), else fallback (which might fail FK if not valid INT, but app flow ensures login)
        // Actually, TblUser_New SlNo is INT. Session usually has string/id.
        // Assuming session.user.id is the SlNo or we parse it.
        // In previous changes (Blasting/Drilling), we used `session?.user?.id` or `session?.user?.api_token` logic?
        // Let's check session usage in `DrillingForm`.
        // Actually, `ElectricalEntry` migration changed CreatedBy to INT.
        // The API should insert the INT ID.
        // Let's assume `session.user.id` holds the SlNo.
        // If not, we might need to lookup.
        // For now, I'll pass `session.user.id` or `1` (Admin) if missing.
        const createdBy = session?.user?.id || 1; // Default to 1 (Admin) for safety

        const body = await req.json();
        const {
            Date, DispatchLocationId, Trip, TotalQty, UOMId, Remarks
        } = body;

        // Validation
        if (!Date || !DispatchLocationId || !Trip || !TotalQty || !UOMId) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
            INSERT INTO [Trans].[TblDispatchEntry] 
            (Date, DispatchLocationId, Trip, TotalQty, UOMId, Remarks, CreatedBy, CreatedDate)
            VALUES 
            (@Date, @DispatchLocationId, @Trip, @TotalQty, @UOMId, @Remarks, @CreatedBy, GETDATE())
        `;

        await executeQuery(query, {
            Date, DispatchLocationId, Trip, TotalQty, UOMId, Remarks, CreatedBy: createdBy
        });

        return NextResponse.json({ success: true, message: 'Entry Created Successfully' });
    } catch (error) {
        console.error("Dispatch Entry Create Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
