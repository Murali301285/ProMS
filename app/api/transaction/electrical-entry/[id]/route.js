import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { decode } from 'jsonwebtoken';

// GET Single Record
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`
                SELECT * FROM [Trans].[TblElectricalEntry] 
                WHERE SlNo = @id AND IsDelete = 0
            `);

        if (result.recordset.length === 0) {
            return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// UPDATE Record
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        console.log("Update Payload:", body);
        const { Date: entryDate, ShiftId, RelayId, EquipmentId, PlantId, OMR, CMR, TotalUnit, UnitId, Remarks, entryType } = body;

        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        let updatedBy = 1; // Default
        if (token) {
            const decoded = decode(token.value);
            if (decoded?.id) updatedBy = decoded.id;
        }

        const pool = await getDbConnection();

        // Helper to safely convert to int or null
        const safeInt = (val) => (val && val !== '' && !isNaN(val)) ? parseInt(val) : null;
        const type = entryType ? entryType.trim() : '';

        // Mutual Exclusivity Logic based on Explicit Type
        let finalEquipmentId = null;
        let finalPlantId = null;

        if (type === 'Equipment') {
            finalEquipmentId = safeInt(EquipmentId);
            finalPlantId = null;
        } else if (type === 'Plant') {
            finalEquipmentId = null;
            finalPlantId = safeInt(PlantId);
        } else {
            // Fallback
            finalEquipmentId = safeInt(EquipmentId);
            finalPlantId = safeInt(EquipmentId) ? null : safeInt(PlantId);
        }

        console.log("Resolved IDs for Update:", { finalEquipmentId, finalPlantId, entryType });

        // 1. Unique Check (Exclude Self)
        let checkQuery = `
            SELECT COUNT(*) as count 
            FROM [Trans].[TblElectricalEntry] 
            WHERE IsDelete = 0 
            AND SlNo != @id
            AND CAST(Date AS DATE) = @date 
            AND ShiftId = @shiftId 
            AND RelayId = @relayId 
        `;

        // Use Final IDs for Check
        if (finalEquipmentId) {
            checkQuery += ` AND EquipmentId = @equipmentId`;
        } else {
            checkQuery += ` AND PlantId = @plantId`;
        }

        const checkReq = pool.request();
        checkReq.input('id', sql.Int, id);
        checkReq.input('date', sql.Date, entryDate);
        checkReq.input('shiftId', sql.Int, ShiftId);
        checkReq.input('relayId', sql.Int, RelayId);
        if (finalEquipmentId) checkReq.input('equipmentId', sql.Int, finalEquipmentId);
        if (finalPlantId) checkReq.input('plantId', sql.Int, finalPlantId);

        const checkResult = await checkReq.query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
            return NextResponse.json({ success: false, message: "Duplicate: Record exists for this combination." }, { status: 409 });
        }

        // 2. Update
        const updateQuery = `
            UPDATE [Trans].[TblElectricalEntry]
            SET 
                Date = @date,
                ShiftId = @shiftId,
                RelayId = @relayId,
                EquipmentId = @equipmentId,
                PlantId = @plantId,
                OMR = @omr,
                CMR = @cmr,
                TotalUnit = @totalUnit,
                UnitId = @unitId,
                Remarks = @remarks,
                UpdatedBy = @updatedBy,
                UpdatedDate = GETDATE(),
                Type = @type
            WHERE SlNo = @id
        `;

        const updateReq = pool.request();
        updateReq.input('id', sql.Int, id);
        updateReq.input('date', sql.Date, entryDate);
        updateReq.input('shiftId', sql.Int, ShiftId);
        updateReq.input('relayId', sql.Int, RelayId);

        // Pass Final IDs
        updateReq.input('equipmentId', sql.Int, finalEquipmentId);
        updateReq.input('plantId', sql.Int, finalPlantId);
        updateReq.input('omr', sql.Decimal(18, 3), OMR);
        updateReq.input('cmr', sql.Decimal(18, 3), CMR);
        updateReq.input('totalUnit', sql.Decimal(18, 3), TotalUnit);
        updateReq.input('unitId', sql.Int, UnitId);
        updateReq.input('remarks', sql.VarChar, Remarks);
        updateReq.input('updatedBy', sql.Int, updatedBy);
        updateReq.input('type', sql.VarChar, type);

        await updateReq.query(updateQuery);

        return NextResponse.json({ success: true, message: "Updated Successfully" });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE Record (Soft Delete)
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        let updatedBy = 1;
        if (token) {
            const decoded = decode(token.value);
            if (decoded?.id) updatedBy = decoded.id;
        }

        const pool = await getDbConnection();

        await pool.request()
            .input('id', sql.BigInt, id)
            .input('userId', sql.Int, updatedBy)
            .query(`UPDATE [Trans].[TblElectricalEntry] SET IsDelete = 1, UpdatedBy = @userId, UpdatedDate = GETDATE() WHERE SlNo = @id`);

        return NextResponse.json({ success: true, message: "Deleted Successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
