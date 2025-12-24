
import { NextResponse } from 'next/server';
import { getDbConnection, executeQuery } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const shiftId = searchParams.get('shiftId');

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        // Get Current User
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token')?.value;
        let currentUser = 'Admin';
        if (authToken) {
            const decoded = jwt.decode(authToken);
            if (decoded?.name) currentUser = decoded.name;
        }

        let query = '';
        let params = [
            { name: 'date', value: date },
            { name: 'user', value: currentUser }
        ];

        // Base Filter
        let shiftFilter = '';
        if (shiftId) {
            shiftFilter = 'AND ShiftId = @shift';
            params.push({ name: 'shift', value: shiftId });
        }

        // Priority 1: User Logged In + Date (+ Shift)
        const p1Query = `
            SELECT TOP 1 
                DestinationId, HaulerId, FillingPointId, FillingPumpId, ShiftId
            FROM [Transaction].[TblWaterTankerEntry]
            WHERE IsDelete = 0 
            AND CAST(EntryDate AS DATE) = @date 
            AND CreatedBy = @user
            ${shiftFilter}
            ORDER BY CreatedDate DESC
        `;

        // Priority 2: Any User + Date (+ Shift)
        const p2Query = `
            SELECT TOP 1 
                DestinationId, HaulerId, FillingPointId, FillingPumpId, ShiftId
            FROM [Transaction].[TblWaterTankerEntry]
            WHERE IsDelete = 0 
            AND CAST(EntryDate AS DATE) = @date 
            ${shiftFilter}
            ORDER BY CreatedDate DESC
        `;

        // Execute Priority 1 first
        let data = await executeQuery(p1Query, params);

        // If no data, try Priority 2
        if (!data || data.length === 0) {
            data = await executeQuery(p2Query, params);
        }

        if (data && data.length > 0) {
            return NextResponse.json({
                success: true,
                data: data[0]
            });
        }

        return NextResponse.json({
            success: true,
            data: null
        });

    } catch (error) {
        console.error('Error fetching last water tanker entry:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch last entry'
        }, { status: 500 });
    }
}
