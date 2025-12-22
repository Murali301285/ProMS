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
    const search = searchParams.get('search');

    try {
        const pool = await getDbConnection();
        const request = pool.request();

        let whereClause = "WHERE T.IsDelete = 0";

        // Date Filter (Date of Drilling)
        if (fromDate) {
            whereClause += " AND CAST(T.Date AS DATE) >= @fromDate";
            request.input('fromDate', sql.Date, fromDate);
        }
        if (toDate) {
            whereClause += " AND CAST(T.Date AS DATE) <= @toDate";
            request.input('toDate', sql.Date, toDate);
        }

        // Global Search
        if (search) {
            const term = `%${search}%`;
            whereClause += ` AND (
                T.DrillingPatchId LIKE @search OR
                E.EquipmentName LIKE @search OR
                M.MaterialName LIKE @search OR
                L.LocationName LIKE @search OR
                Sec.SectorName LIKE @search OR
                Sc.Name LIKE @search OR
                Str.Name LIKE @search
            )`;
            request.input('search', sql.NVarChar, term);
        }

        const query = `
            SELECT 
                T.SlNo,
                T.Date AS DateOfDrilling,
                (
                    SELECT TOP 1 B.[Date] 
                    FROM [Trans].[TblBlasting] B 
                    WHERE B.[BlastingPatchId] = T.[DrillingPatchId]
                ) AS DateOfBlasting,
                T.DrillingPatchId,
                T.DrillingAgencyId,
                DA.AgencyName AS DrillingAgency,
                T.EquipmentId,
                E.EquipmentName AS Equipment,
                T.MaterialId,
                M.MaterialName AS Material,
                T.LocationId,
                L.LocationName AS Location,
                T.SectorId,
                Sec.SectorName AS Sector,
                T.ScaleId,
                Sc.Name AS Scale,
                T.StrataId,
                Str.Name AS Strata,
                T.DepthSlabId,
                DS.Name AS DepthSlab,
                T.NoofHoles,
                T.TotalMeters,
                T.Spacing,
                T.Burden,
                T.TopRLBottomRL,
                T.AverageDepth,
                T.Output,
                T.UnitId,
                U.Name AS Unit,
                T.TotalQty,
                T.RemarkId,
                DR.DrillingRemarks,
                T.Remarks,
                T.CreatedBy,
                CU.UserName AS CreatedByName,
                T.CreatedDate,
                T.UpdatedBy,
                UU.UserName AS UpdatedByName,
                T.UpdatedDate,
                COUNT(*) OVER() as TotalCount
            FROM [Trans].[TblDrilling] T
            LEFT JOIN [Master].[TblEquipment] E ON T.EquipmentId = E.SlNo
            LEFT JOIN [Master].[TblDrillingAgency] DA ON T.DrillingAgencyId = DA.SlNo
            LEFT JOIN [Master].[TblMaterial] M ON T.MaterialId = M.SlNo
            LEFT JOIN [Master].[TblLocation] L ON T.LocationId = L.SlNo
            LEFT JOIN [Master].[TblSector] Sec ON T.SectorId = Sec.SlNo
            LEFT JOIN [Master].[TblScale] Sc ON T.ScaleId = Sc.SlNo
            LEFT JOIN [Master].[TblStrata] Str ON T.StrataId = Str.SlNo
            LEFT JOIN [Master].[TblDepthSlab] DS ON T.DepthSlabId = DS.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            LEFT JOIN [Master].[TblDrillingRemarks] DR ON T.RemarkId = DR.SlNo
            LEFT JOIN [Master].[TblUser] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser] UU ON T.UpdatedBy = UU.SlNo
            ${whereClause}
            ORDER BY T.Date DESC
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
