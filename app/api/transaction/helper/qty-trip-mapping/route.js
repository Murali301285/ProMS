import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const haulerId = searchParams.get('haulerId'); // We need to fetch GroupId from this if not passed
        const materialId = searchParams.get('materialId');

        if (!haulerId || !materialId) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        // 1. Get GroupId from TblEquipment using HaulerId
        const groupQuery = `SELECT EquipmentGroupId FROM [Master].[TblEquipment] WHERE SlNo = @haulerId`;
        const groupRes = await executeQuery(groupQuery, [{ name: 'haulerId', type: sql.Int, value: haulerId }]);

        if (!groupRes || groupRes.length === 0 || !groupRes[0].EquipmentGroupId) {
            return NextResponse.json({ success: false, message: 'Equipment Group not found for this Hauler' });
        }

        const groupId = groupRes[0].EquipmentGroupId;

        // 2. Get Qty Mapping using GroupId and MaterialId
        const mapQuery = `
            SELECT TOP 1 
                ManagementQtyTrip, 
                NTPCQtyTrip 
            FROM [Master].[TblQtyTripMapping]
            WHERE EquipmentGroupId = @groupId 
              AND MaterialId = @materialId 
              AND IsActive = 1 
              AND IsDelete = 0
        `;

        const mapRes = await executeQuery(mapQuery, [
            { name: 'groupId', type: sql.Int, value: groupId },
            { name: 'materialId', type: sql.Int, value: materialId }
        ]);

        if (mapRes.length > 0) {
            return NextResponse.json({ success: true, data: mapRes[0] });
        } else {
            // Explicitly return null data to trigger "Not Found" modal on frontend
            return NextResponse.json({ success: true, data: null });
        }

    } catch (error) {
        console.error('Error fetching Qty Mapping:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
