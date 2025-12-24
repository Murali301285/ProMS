
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const data = await executeQuery(`
            SELECT * FROM [Transaction].[TblWaterTankerEntry] 
            WHERE SlNo = @id AND IsDelete = 0
        `, [{ name: 'id', value: id }]);

        if (data.length === 0) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(data[0]);
    } catch (error) {
        console.error("WaterTanker ID GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let user = 'Admin';

        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.name) user = decoded.name;
        }

        const {
            ShiftId,
            DestinationId,
            HaulerId,
            FillingPointId,
            FillingPumpId,
            NoOfTrip,
            Capacity,
            TotalQty,
            Remarks,
            EntryDate
        } = body;

        await executeQuery(`
            UPDATE [Transaction].[TblWaterTankerEntry]
            SET 
                ShiftId = @shift,
                DestinationId = @dest,
                HaulerId = @hauler,
                FillingPointId = @fillpt,
                FillingPumpId = @fillpump,
                NoOfTrip = @trips,
                Capacity = @cap,
                TotalQty = @qty,
                Remarks = @remarks,
                EntryDate = @date,
                UpdatedBy = @user,
                UpdatedDate = GETDATE()
            WHERE SlNo = @id
        `, [
            { name: 'shift', value: ShiftId },
            { name: 'dest', value: DestinationId },
            { name: 'hauler', value: HaulerId },
            { name: 'fillpt', value: FillingPointId },
            { name: 'fillpump', value: FillingPumpId },
            { name: 'trips', value: NoOfTrip },
            { name: 'cap', value: Capacity || 0 },
            { name: 'qty', value: TotalQty },
            { name: 'remarks', value: Remarks || null },
            { name: 'date', value: EntryDate },
            { name: 'user', value: user },
            { name: 'id', value: id }
        ]);

        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        console.error("WaterTanker PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let user = 'Admin';
        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.name) user = decoded.name;
        }

        await executeQuery(`
            UPDATE [Transaction].[TblWaterTankerEntry]
            SET IsDelete = 1, UpdatedBy = @user, UpdatedDate = GETDATE()
            WHERE SlNo = @id
        `, [
            { name: 'id', value: id },
            { name: 'user', value: user }
        ]);

        return NextResponse.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error("WaterTanker DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
