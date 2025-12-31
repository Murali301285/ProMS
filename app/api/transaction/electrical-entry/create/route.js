import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { decode } from 'jsonwebtoken';

export async function POST(request) {
    try {
        const body = await request.json();
        const { Date: entryDate, ShiftId, RelayId, EquipmentId, PlantId, OMR, CMR, TotalUnit, UnitId, Remarks, entryType } = body;
        const type = entryType ? entryType.trim() : 'Equipment'; // Default to Equipment if missing

        // Mutual Exclusivity Logic based on Explicit Type
        let finalEquipmentId = null;
        let finalPlantId = null;

        if (entryType === 'Equipment') {
            finalEquipmentId = EquipmentId;
            finalPlantId = null;
        } else if (entryType === 'Plant') {
            finalEquipmentId = null;
            finalPlantId = PlantId;
        } else {
            // Fallback
            finalEquipmentId = EquipmentId ? EquipmentId : null;
            finalPlantId = EquipmentId ? null : (PlantId ? PlantId : null);
        }

        // Basic Validation
        if (!entryDate || !ShiftId || !RelayId || (!finalEquipmentId && !finalPlantId) || OMR == null || CMR == null || !UnitId) {
            return NextResponse.json({ success: false, message: "Missing mandatory fields" }, { status: 400 });
        }

        // Get User
        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        let createdBy = 1; // Default to ID 1 (Admin/System)
        if (token) {
            const decoded = decode(token.value);
            // Use ID if available, otherwise fallback
            if (decoded?.id) createdBy = decoded.id;
        }

        const pool = await getDbConnection();

        // 1. Unique Check
        let checkQuery = `
            SELECT COUNT(*) as count 
            FROM [Trans].[TblElectricalEntry] 
            WHERE IsDelete = 0 
            AND CAST(Date AS DATE) = @date 
            AND ShiftId = @shiftId 
            AND RelayId = @relayId 
        `;

        // Use Final IDs
        if (finalEquipmentId) {
            checkQuery += ` AND EquipmentId = @equipmentId`;
        } else {
            checkQuery += ` AND PlantId = @plantId`;
        }

        const checkReq = pool.request();
        checkReq.input('date', sql.Date, entryDate);
        checkReq.input('shiftId', sql.Int, ShiftId);
        checkReq.input('relayId', sql.Int, RelayId);
        if (finalEquipmentId) checkReq.input('equipmentId', sql.Int, finalEquipmentId);
        if (finalPlantId) checkReq.input('plantId', sql.Int, finalPlantId);

        const checkResult = await checkReq.query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
            return NextResponse.json({ success: false, message: "Duplicate Entry: Record already exists for this combination." }, { status: 409 });
        }

        // 2. Insert
        const insertQuery = `
            INSERT INTO [Trans].[TblElectricalEntry] 
            (Date, ShiftId, RelayId, EquipmentId, PlantId, OMR, CMR, TotalUnit, UnitId, Remarks, CreatedBy, CreatedDate, Type)
            VALUES 
            (@date, @shiftId, @relayId, @equipmentId, @plantId, @omr, @cmr, @totalUnit, @unitId, @remarks, @createdBy, GETDATE(), @type)
        `;

        const insertReq = pool.request();
        insertReq.input('date', sql.Date, entryDate);
        insertReq.input('shiftId', sql.Int, ShiftId);
        insertReq.input('relayId', sql.Int, RelayId);
        insertReq.input('equipmentId', sql.Int, finalEquipmentId);
        insertReq.input('plantId', sql.Int, finalPlantId);
        insertReq.input('omr', sql.Decimal(18, 3), OMR);
        insertReq.input('cmr', sql.Decimal(18, 3), CMR);
        insertReq.input('totalUnit', sql.Decimal(18, 3), TotalUnit);
        insertReq.input('unitId', sql.Int, UnitId);
        insertReq.input('remarks', sql.VarChar, Remarks);
        insertReq.input('createdBy', sql.Int, createdBy);
        insertReq.input('type', sql.VarChar, type);

        await insertReq.query(insertQuery);

        return NextResponse.json({ success: true, message: "Saved Successfully" });

    } catch (error) {
        console.error("Electrical Entry Create API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
