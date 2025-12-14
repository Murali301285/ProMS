import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbConnection } from '@/lib/db';

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

        // Date Filter
        if (fromDate) {
            whereClause += " AND CAST(T.LoadingDate AS DATE) >= @fromDate";
            request.input('fromDate', sql.Date, fromDate);
        }
        if (toDate) {
            whereClause += " AND CAST(T.LoadingDate AS DATE) <= @toDate";
            request.input('toDate', sql.Date, toDate);
        }

        // Equipment Filter (Both Hauler OR Loading Machine)
        // Equipment Filter (Both Hauler OR Loading Machine)
        if (equipmentIds) {
            const ids = equipmentIds.split(',').map(id => parseInt(id)).filter(n => !isNaN(n));
            if (ids.length > 0) {
                whereClause += ` AND (T.HaulerEquipmentId IN (${ids.join(',')}) OR T.LoadingMachineEquipmentId IN (${ids.join(',')}))`;
            }
        } else {
            // Check for Group Filter if no specific Equipments selected
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

        const query = `
            SELECT 
                T.SlNo,
                T.LoadingDate,
                T.ShiftId, -- Required for Context Filter
                T.RelayId, -- Required for Context Filter
                T.SourceId, -- Required for Context Filter
                T.DestinationId, -- Required for Context Filter
                T.MaterialId, -- Required for Context Filter
                T.HaulerEquipmentId, -- Required for Context Filter
                T.LoadingMachineEquipmentId, -- Required for Context Filter
                S.ShiftName,
                (
                    SELECT STUFF((
                        SELECT ', ' + O.OperatorName
                        FROM [Trans].[TblLoadingShiftIncharge] LSI
                        JOIN [Master].[TblOperator] O ON LSI.OperatorId = O.SlNo
                        WHERE LSI.LoadingId = T.SlNo
                        FOR XML PATH('')
                    ), 1, 2, '')
                ) AS ShiftInCharge,
                T.ManPowerInShift AS ManPower,
                R.Name AS RelayName,
                Src.Name AS SourceName,
                Dest.Name AS DestinationName,
                Mat.MaterialName,
                HE.EquipmentName AS HaulerName,
                LME.EquipmentName AS LoadingMachineName,
                T.NoofTrip,
                T.QtyTrip,
                T.NtpcQtyTrip,
                T.TotalQty,
                T.TotalNtpcQty,
                U.Name AS UnitName,
                CU.UserName AS CreatedByName,
                T.CreatedDate,
                T.UpdatedDate,
                UU.UserName AS UpdatedByName,
                COUNT(*) OVER() as TotalCount
            FROM [Trans].[TblLoading] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblSource] Src ON T.SourceId = Src.SlNo
            LEFT JOIN [Master].[TblDestination] Dest ON T.DestinationId = Dest.SlNo
            LEFT JOIN [Master].[TblMaterial] Mat ON T.MaterialId = Mat.SlNo
            LEFT JOIN [Master].[TblEquipment] HE ON T.HaulerEquipmentId = HE.SlNo
            LEFT JOIN [Master].[TblEquipment] LME ON T.LoadingMachineEquipmentId = LME.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            LEFT JOIN [Master].[TblUser] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser] UU ON T.UpdatedBy = UU.SlNo
            ${whereClause}
            ORDER BY T.LoadingDate DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        return NextResponse.json({
            data: result.recordset,
            total: result.recordset.length > 0 ? result.recordset[0].TotalCount : 0
        });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
