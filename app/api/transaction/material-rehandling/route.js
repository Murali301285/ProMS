/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbConnection, executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Pagination
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filters
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const equipmentIds = searchParams.get('equipmentIds'); // Comma separated IDs
    const search = searchParams.get('search'); // Global Search

    try {
        const pool = await getDbConnection();
        const request = pool.request();

        let whereClause = "WHERE T.IsDelete = 0";

        // Date Filter (RehandlingDate)
        if (fromDate) {
            whereClause += " AND CAST(T.RehandlingDate AS DATE) >= @fromDate";
            request.input('fromDate', sql.Date, fromDate);
        }
        if (toDate) {
            whereClause += " AND CAST(T.RehandlingDate AS DATE) <= @toDate";
            request.input('toDate', sql.Date, toDate);
        }

        // Equipment Filter
        if (equipmentIds) {
            const ids = equipmentIds.split(',').map(id => parseInt(id)).filter(n => !isNaN(n));
            if (ids.length > 0) {
                whereClause += ` AND (T.HaulerEquipmentId IN (${ids.join(',')}) OR T.LoadingMachineEquipmentId IN (${ids.join(',')}))`;
            }
        } else {
            const equipmentGroupIds = searchParams.get('equipmentGroupIds');
            if (equipmentGroupIds) {
                const gIds = equipmentGroupIds.split(',').map(id => parseInt(id)).filter(n => !isNaN(n));
                if (gIds.length > 0) {
                    whereClause += ` AND (
                        T.HaulerEquipmentId IN (SELECT SlNo FROM [Master].[TblEquipment] WHERE EquipmentGroupId IN (${gIds.join(',')}))
                        OR 
                        T.LoadingMachineEquipmentId IN (SELECT SlNo FROM [Master].[TblEquipment] WHERE EquipmentGroupId IN (${gIds.join(',')}))
                     )`;
                }
            }
        }

        // Global Search
        if (search) {
            const term = `%${search}%`;
            whereClause += ` AND (
                S.ShiftName LIKE @search OR 
                R.Name LIKE @search OR 
                Src.Name LIKE @search OR 
                Dest.Name LIKE @search OR 
                Mat.MaterialName LIKE @search OR 
                HE.EquipmentName LIKE @search OR 
                LME.EquipmentName LIKE @search
            )`;
            request.input('search', sql.NVarChar, term);
        }

        let query = "SELECT ";
        query += "T.SlNo, T.RehandlingDate, T.ShiftId, T.RelayId, T.SourceId, T.DestinationId, T.MaterialId, T.HaulerEquipmentId, T.LoadingMachineEquipmentId, ";
        query += "S.ShiftName, ";
        query += "SI.OperatorName AS ShiftInchargeName, ";
        query += "MI.OperatorName AS MidScaleInchargeName, ";
        query += "T.ManPowerInShift AS ManPower, R.Name AS RelayName, Src.Name AS SourceName, Dest.Name AS DestinationName, Mat.MaterialName, ";
        query += "HE.EquipmentName AS HaulerName, LME.EquipmentName AS LoadingMachineName, ";
        query += "T.NoofTrip, T.QtyTrip, T.NtpcQtyTrip, T.TotalQty, T.TotalNtpcQty, U.Name AS UnitName, T.Remarks, ";
        query += "T.CreatedDate, T.UpdatedDate, CU.EmpName AS CreatedByName, UU.EmpName AS UpdatedByName ";
        query += "FROM [Trans].[TblMaterialRehandling] T ";
        query += "LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo ";
        query += "LEFT JOIN [Master].[TblOperator] SI ON T.ShiftInchargeId = SI.SlNo ";
        query += "LEFT JOIN [Master].[TblOperator] MI ON T.MidScaleInchargeId = MI.SlNo ";
        query += "LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo ";
        query += "LEFT JOIN [Master].[TblSource] Src ON T.SourceId = Src.SlNo ";
        query += "LEFT JOIN [Master].[TblDestination] Dest ON T.DestinationId = Dest.SlNo ";
        query += "LEFT JOIN [Master].[TblMaterial] Mat ON T.MaterialId = Mat.SlNo ";
        query += "LEFT JOIN [Master].[TblEquipment] HE ON T.HaulerEquipmentId = HE.SlNo ";
        query += "LEFT JOIN [Master].[TblEquipment] LME ON T.LoadingMachineEquipmentId = LME.SlNo ";
        query += "LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo ";
        query += "LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo ";
        query += "LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo ";
        query += whereClause;
        query += " ORDER BY T.RehandlingDate DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        // console.log(`✅ [LIST-REHANDLING] Found ${result.recordset.length} rows.`);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error('Error fetching material rehandling list:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = await authenticateUser(request);
        const UserId = user ? user.id : 1; // Default to Admin if auth fails (e.g. dev mode) or handle strictly

        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, MidScaleInchargeId, ManPower, RelayId,
            SourceId, DestinationId, MaterialId, HaulerId, LoadingMachineId,
            NoOfTrips, MangQtyTrip, NTPCQtyTrip, Unit, MangTotalQty, NTPCTotalQty,
            Remarks
        } = body;

        // console.log("📝 [POST-REHANDLING] Creating Record:", body);

        // 1. Duplicate Check
        const dupQuery = `
            SELECT COUNT(1) as count
            FROM [Trans].[TblMaterialRehandling]
            WHERE 
                CAST(RehandlingDate AS DATE) = CAST(@date AS DATE) AND
                ShiftId = @ShiftId AND
                RelayId = @RelayId AND
                SourceId = @SourceId AND
                DestinationId = @DestinationId AND
                MaterialId = @MaterialId AND
                HaulerEquipmentId = @HaulerId AND
                LoadingMachineEquipmentId = @LoadingMachineId AND
                IsDelete = 0
        `;

        const dupRes = await executeQuery(dupQuery, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId },
        ]);

        if (dupRes[0].count > 0) {
            return NextResponse.json({ success: false, message: 'Entry is already found , pls check.' });
        }

        // 2. Insert Record

        const query = `
            INSERT INTO [Trans].[TblMaterialRehandling] (
                RehandlingDate, ShiftId, ShiftInchargeId, MidScaleInchargeId, ManPowerInShift, RelayId,
                SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId,
                NoofTrip, QtyTrip, NtpcQtyTrip, UnitId, TotalQty, TotalNtpcQty,
                Remarks, CreatedBy, CreatedDate, IsDelete
            )
            OUTPUT INSERTED.SlNo
            VALUES (
                @date, @ShiftId, @ShiftInchargeId, @MidScaleInchargeId, @ManPower, @RelayId,
                @SourceId, @DestinationId, @MaterialId, @HaulerId, @LoadingMachineId,
                @NoOfTrips, @MangQtyTrip, @NTPCQtyTrip, @Unit, @MangTotalQty, @NTPCTotalQty,
                @Remarks, @UserId, GETDATE(), 0
            )
        `;

        const result = await executeQuery(query, [
            { name: 'date', type: sql.Date, value: date },
            { name: 'ShiftId', type: sql.Int, value: ShiftId },
            { name: 'ShiftInchargeId', type: sql.Int, value: ShiftInchargeId },
            { name: 'MidScaleInchargeId', type: sql.Int, value: MidScaleInchargeId },
            { name: 'ManPower', type: sql.Int, value: ManPower },
            { name: 'RelayId', type: sql.Int, value: RelayId },
            { name: 'SourceId', type: sql.Int, value: SourceId },
            { name: 'DestinationId', type: sql.Int, value: DestinationId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId },
            { name: 'HaulerId', type: sql.Int, value: HaulerId },
            { name: 'LoadingMachineId', type: sql.Int, value: LoadingMachineId },
            { name: 'NoOfTrips', type: sql.Int, value: NoOfTrips },
            { name: 'MangQtyTrip', type: sql.Decimal(18, 2), value: MangQtyTrip },
            { name: 'NTPCQtyTrip', type: sql.Decimal(18, 2), value: NTPCQtyTrip },
            { name: 'Unit', type: sql.Int, value: Unit ? Number(Unit) : 1 },
            { name: 'MangTotalQty', type: sql.Decimal(18, 2), value: MangTotalQty },
            { name: 'NTPCTotalQty', type: sql.Decimal(18, 2), value: NTPCTotalQty },
            { name: 'Remarks', type: sql.NVarChar, value: Remarks },
            { name: 'UserId', type: sql.Int, value: UserId },
        ]);

        if (!result || result.length === 0) {
            throw new Error('Failed to insert record');
        }

        const newId = result[0].SlNo;

        // Legacy Shift Incharges Link Table (Removed)

        return NextResponse.json({ success: true, message: 'Saved Successfully', id: newId });

    } catch (error) {
        console.error('Create Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
