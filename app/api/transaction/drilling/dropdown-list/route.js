export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET(request) {
    try {
        const pool = await getDbConnection();
        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month'); // Expecting format 'YYYY-MM'

        let selectClause = 'SELECT';
        let dateFilter = '';

        if (monthParam && monthParam.includes('-')) {
            const [yearStr, monthStr] = monthParam.split('-');
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            if (!isNaN(year) && !isNaN(month)) {
                dateFilter = ` AND YEAR(d.Date) = ${year} AND MONTH(d.Date) = ${month}`;
            }
        } else {
            selectClause = 'SELECT TOP 200';
        }

        // Return Drilling Patches with all Master data relationships resolved
        // for the rich Dropdown UI in Create Blasting Entry.
        const query = `
            ${selectClause}
                d.SlNo,
                d.DrillingPatchId,
                ISNULL(a.AgencyName, '') as Agency,
                ISNULL(eq.EquipmentName, '') as Equipment,
                ISNULL(m.MaterialName, '') as Material,
                ISNULL(l.LocationName, '') as Location,
                ISNULL(sec.SectorName, '') as Sector,
                ISNULL(sc.Name, '') as Scale,
                ISNULL(st.Name, '') as Strata,
                ISNULL(ds.Name, '') as DepthSlab,
                ISNULL(d.NoofHoles, 0) as NoofHoles,
                ISNULL(d.TotalMeters, 0) as TotalMeters,
                ISNULL(d.Spacing, 0) as Spacing,
                ISNULL(d.Burden, 0) as Burden,
                FORMAT(d.CreatedDate, 'dd-MMM-yyyy HH:mm') as CreatedOn,
                -- We still pass the precise Avg Depth for the form autofill
                ISNULL(d.AverageDepth, CASE WHEN ISNULL(d.NoofHoles, 0) > 0 THEN d.TotalMeters / d.NoofHoles ELSE 0 END) as AverageDepth
            FROM [Trans].[TblDrilling] d
            LEFT JOIN [Master].[TblDrillingAgency] a ON d.DrillingAgencyId = a.SlNo
            LEFT JOIN [Master].[TblEquipment] eq ON d.EquipmentId = eq.SlNo
            LEFT JOIN [Master].[TblMaterial] m ON d.MaterialId = m.SlNo
            LEFT JOIN [Master].[TblLocation] l ON d.LocationId = l.SlNo
            LEFT JOIN [Master].[TblSector] sec ON d.SectorId = sec.SlNo
            LEFT JOIN [Master].[TblScale] sc ON d.ScaleId = sc.SlNo
            LEFT JOIN [Master].[TblStrata] st ON d.StrataId = st.SlNo
            LEFT JOIN [Master].[TblDepthSlab] ds ON d.DepthSlabId = ds.SlNo
            WHERE d.IsDelete = 0${dateFilter}
            ORDER BY d.SlNo DESC
        `;

        const result = await pool.request().query(query);

        return NextResponse.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Drilling Dropdown List Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
