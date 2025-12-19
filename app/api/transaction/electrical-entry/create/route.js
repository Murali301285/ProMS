import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { decode } from 'jsonwebtoken';

export async function POST(request) {
    try {
        const body = await request.json();
        const { Date: entryDate, ShiftId, RelayId, EquipmentId, OMR, CMR, TotalUnit, UnitId, Remarks } = body;

        // Basic Validation
        if (!entryDate || !ShiftId || !RelayId || !EquipmentId || OMR == null || CMR == null || !UnitId) {
            return NextResponse.json({ success: false, message: "Missing mandatory fields" }, { status: 400 });
        }

        // Get User
        // Get User
        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        let createdBy = 'System';
        if (token) {
            const decoded = decode(token.value);
            createdBy = decoded?.username || 'System';
        }

        const pool = await getDbConnection();

        // 1. Unique Check (Date + Shift + Relay + Equipment)
        const checkQuery = `
            SELECT COUNT(*) as count 
            FROM [Trans].[TblElectricalEntry] 
            WHERE IsDelete = 0 
            AND CAST(Date AS DATE) = @date 
            AND ShiftId = @shiftId 
            AND RelayId = @relayId 
            AND EquipmentId = @equipmentId
        `;
        const checkReq = pool.request();
        checkReq.input('date', sql.Date, entryDate);
        checkReq.input('shiftId', sql.Int, ShiftId);
        checkReq.input('relayId', sql.Int, RelayId);
        checkReq.input('equipmentId', sql.Int, EquipmentId);

        const checkResult = await checkReq.query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
            return NextResponse.json({ success: false, message: "Duplicate Entry: Record already exists for this combination." }, { status: 409 });
        }

        // 2. Insert
        const insertQuery = `
            INSERT INTO [Trans].[TblElectricalEntry] 
            (Date, ShiftId, RelayId, EquipmentId, OMR, CMR, TotalUnit, UnitId, Remarks, CreatedBy, CreatedDate)
            VALUES 
            (@date, @shiftId, @relayId, @equipmentId, @omr, @cmr, @totalUnit, @unitId, @remarks, @createdBy, GETDATE())
        `;

        const insertReq = pool.request();
        insertReq.input('date', sql.Date, entryDate);
        insertReq.input('shiftId', sql.Int, ShiftId);
        insertReq.input('relayId', sql.Int, RelayId);
        insertReq.input('equipmentId', sql.Int, EquipmentId);
        insertReq.input('omr', sql.Decimal(18, 3), OMR);
        insertReq.input('cmr', sql.Decimal(18, 3), CMR);
        insertReq.input('totalUnit', sql.Decimal(18, 3), TotalUnit);
        insertReq.input('unitId', sql.Int, UnitId);
        insertReq.input('remarks', sql.VarChar, Remarks);
        insertReq.input('createdBy', sql.VarChar, createdBy);

        await insertReq.query(insertQuery);

        return NextResponse.json({ success: true, message: "Saved Successfully" });

    } catch (error) {
        console.error("Electrical Entry Create API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
