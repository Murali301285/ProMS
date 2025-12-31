
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const shift = searchParams.get('shift');

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
                WT.NoOfTrip,
                WT.Capacity,
                WT.TotalQty,
                WT.Remarks,
                WT.CreatedBy,
                ISNULL(U1.EmpName, 'Unknown') as CreatedByName,
                WT.CreatedDate,
                WT.UpdatedBy,
                ISNULL(U2.EmpName, 'Unknown') as UpdatedByName,
                WT.UpdatedDate
            FROM [Transaction].[TblWaterTankerEntry] WT
            LEFT JOIN [Master].[TblShift] S ON WT.ShiftId = S.SlNo
            LEFT JOIN [Master].[tblFillingPoint] FP_Dest ON WT.DestinationId = FP_Dest.SlNo
            LEFT JOIN [Master].[TblEquipment] E ON WT.HaulerId = E.SlNo
            LEFT JOIN [Master].[tblFillingPoint] FP_Fill ON WT.FillingPointId = FP_Fill.SlNo
            LEFT JOIN [Master].[TblUser_New] U1 ON WT.CreatedBy = U1.SlNo
            LEFT JOIN [Master].[TblUser_New] U2 ON WT.UpdatedBy = U2.SlNo
            WHERE WT.IsDelete = 0
        `;

        const params = [];
        if (date) {
            query += ` AND CAST(WT.EntryDate AS DATE) = @date`;
            params.push({ name: 'date', value: date });
        } else {
            if (fromDate) {
                query += ` AND CAST(WT.EntryDate AS DATE) >= @fromDate`;
                params.push({ name: 'fromDate', value: fromDate });
            }
            if (toDate) {
                query += ` AND CAST(WT.EntryDate AS DATE) <= @toDate`;
                params.push({ name: 'toDate', value: toDate });
            }
        }

        if (shift) {
            query += ` AND WT.ShiftId = @shift`;
            params.push({ name: 'shift', value: shift });
        }

        query += ` ORDER BY WT.CreatedDate DESC`;

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
        let userId = 1; // Default Admin

        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.id) userId = decoded.id;
        }

        const {
            ShiftId,
            DestinationId,
            HaulerId,
            FillingPointId,
            NoOfTrip,
            Capacity,
            TotalQty,
            Remarks,
            EntryDate
        } = body;

        // Validation (Basic)
        if (!ShiftId || !DestinationId || !HaulerId || !FillingPointId || !NoOfTrip || !TotalQty || !EntryDate) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const query = `
            INSERT INTO [Transaction].[TblWaterTankerEntry] 
            (ShiftId, DestinationId, HaulerId, FillingPointId, NoOfTrip, Capacity, TotalQty, Remarks, EntryDate, CreatedBy, CreatedDate)
            VALUES 
            (@shift, @dest, @hauler, @fillpt, @trips, @cap, @qty, @remarks, @date, @user, GETDATE())
        `;

        await executeQuery(query, [
            { name: 'shift', value: ShiftId },
            { name: 'dest', value: DestinationId },
            { name: 'hauler', value: HaulerId },
            { name: 'fillpt', value: FillingPointId },
            { name: 'trips', value: NoOfTrip },
            { name: 'cap', value: Capacity || 0 },
            { name: 'qty', value: TotalQty },
            { name: 'remarks', value: Remarks || null },
            { name: 'date', value: EntryDate },
            { name: 'user', value: userId }
        ]);

        return NextResponse.json({ message: 'Saved successfully' });

    } catch (error) {
        console.error("WaterTanker Create Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
