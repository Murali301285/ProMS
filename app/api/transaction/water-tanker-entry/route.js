
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        let query = `
            SELECT 
                WT.SlNo,
                WT.EntryDate,
                WT.ShiftId,
                S.ShiftName,
                WT.DestinationId,
                FP_Dest.FillingPoint as DestinationName,
                WT.HaulerId,
                E.EquipmentName as HaulerName,
                WT.FillingPointId,
                FP_Fill.FillingPoint as FillingPointName,
                WT.FillingPumpId,
                pump.FillingPump as FillingPumpName,
                WT.NoOfTrip,
                WT.Capacity,
                WT.TotalQty,
                WT.Remarks,
                WT.CreatedBy,
                WT.CreatedDate,
                WT.UpdatedBy,
                WT.UpdatedDate
            FROM [Transaction].[TblWaterTankerEntry] WT
            LEFT JOIN [Master].[TblShift] S ON WT.ShiftId = S.SlNo
            LEFT JOIN [Master].[tblFillingPoint] FP_Dest ON WT.DestinationId = FP_Dest.SlNo
            LEFT JOIN [Master].[TblEquipment] E ON WT.HaulerId = E.SlNo
            LEFT JOIN [Master].[tblFillingPoint] FP_Fill ON WT.FillingPointId = FP_Fill.SlNo
            LEFT JOIN [Master].[tblFillingPump] pump ON WT.FillingPumpId = pump.SlNo
            WHERE WT.IsDelete = 0
        `;

        const params = [];
        if (date) {
            query += ` AND CAST(WT.EntryDate AS DATE) = @date`;
            params.push({ name: 'date', value: date });
        }

        query += ` ORDER BY WT.CreatedDate DESC`; // Recent first

        const data = await executeQuery(query, params);
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("WaterTanker List Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let createdBy = 'Admin'; // Default

        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.name) createdBy = decoded.name; // Or user name logic
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

        // Validation (Basic)
        if (!ShiftId || !DestinationId || !HaulerId || !FillingPointId || !FillingPumpId || !NoOfTrip || !TotalQty || !EntryDate) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
            INSERT INTO [Transaction].[TblWaterTankerEntry] 
            (ShiftId, DestinationId, HaulerId, FillingPointId, FillingPumpId, NoOfTrip, Capacity, TotalQty, Remarks, EntryDate, CreatedBy, CreatedDate)
            VALUES 
            (@shift, @dest, @hauler, @fillpt, @fillpump, @trips, @cap, @qty, @remarks, @date, @user, GETDATE())
        `;

        await executeQuery(query, [
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
            { name: 'user', value: createdBy }
        ]);

        return NextResponse.json({ message: 'Saved successfully' });

    } catch (error) {
        console.error("WaterTanker Create Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
