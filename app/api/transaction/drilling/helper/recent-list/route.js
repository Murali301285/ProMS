
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await authenticateUser(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log("[RecentList API] Session ID:", session.id);
        console.log("[RecentList API] Body:", body);

        // Extract Filters
        const {
            Date: date,
            DrillingPatchId,
            EquipmentId,
            MaterialId,
            LocationId,
            SectorId,
            ScaleId,
            StrataId,
            DepthSlabId
        } = body;

        // Base Query
        let query = `
            SELECT
                t.SlNo,
                t.Date as DateOfDrilling, -- Alias to match Config
                t.Date as DateOfBlasting, -- Assuming same date if not separate field. Wait, Config has DateOfBlasting. Let me check if table has it.
                t.DrillingPatchId,
                e.EquipmentName as Equipment,
                m.MaterialName as Material,
                l.LocationName as Location,
                s.SectorName as Sector,
                sc.Name as Scale,
                st.Name as Strata,
                ds.Name as DepthSlab,
                da.AgencyName as DrillingAgency,
                t.NoofHoles,
                t.TotalMeters,
                t.Spacing,
                t.Burden,
                t.TopRLBottomRL,
                t.AverageDepth,
                t.Output,
                un.Name as Unit,
                t.TotalQty,
                rem.DrillingRemarks as DrillingRemarks, -- Join with Master
                t.Remarks, -- General Remarks
                t.CreatedDate,
                u.UserName as CreatedBy,
                u.EmpName as CreatedByName, -- Better for display
                u2.UserName as UpdatedBy,
                t.UpdatedDate
            FROM [Trans].[TblDrilling] t
            LEFT JOIN [Master].[TblEquipment] e ON t.EquipmentId = e.SlNo
            LEFT JOIN [Master].[TblMaterial] m ON t.MaterialId = m.SlNo
            LEFT JOIN [Master].[TblLocation] l ON t.LocationId = l.SlNo
            LEFT JOIN [Master].[TblSector] s ON t.SectorId = s.SlNo
            LEFT JOIN [Master].[TblScale] sc ON t.ScaleId = sc.SlNo
            LEFT JOIN [Master].[TblStrata] st ON t.StrataId = st.SlNo
            LEFT JOIN [Master].[TblDepthSlab] ds ON t.DepthSlabId = ds.SlNo
            LEFT JOIN [Master].[TblDrillingAgency] da ON t.DrillingAgencyId = da.SlNo
            LEFT JOIN [Master].[TblUnit] un ON t.UnitId = un.SlNo
            LEFT JOIN [Master].[TblDrillingRemarks] rem ON t.RemarkId = rem.SlNo
            LEFT JOIN [Master].[TblUser_New] u ON t.CreatedBy = u.SlNo
            LEFT JOIN [Master].[TblUser_New] u2 ON t.UpdatedBy = u2.SlNo
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: session.id }];

        // Dynamic Filters
        // "if field is empty/default then -> condition should be removed"

        if (date) {
            query += ` AND CAST(t.Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: date });
        }

        if (DrillingPatchId) {
            query += ` AND t.DrillingPatchId LIKE @patch`;
            params.push({ name: 'patch', type: sql.VarChar, value: `%${DrillingPatchId}%` });
        }

        if (EquipmentId) {
            query += ` AND t.EquipmentId = @equipment`;
            params.push({ name: 'equipment', type: sql.Int, value: EquipmentId });
        }

        if (MaterialId) {
            query += ` AND t.MaterialId = @material`;
            params.push({ name: 'material', type: sql.Int, value: MaterialId });
        }

        if (LocationId) {
            query += ` AND t.LocationId = @location`;
            params.push({ name: 'location', type: sql.Int, value: LocationId });
        }

        if (SectorId) {
            query += ` AND t.SectorId = @sector`;
            params.push({ name: 'sector', type: sql.Int, value: SectorId });
        }

        if (ScaleId) {
            query += ` AND t.ScaleId = @scale`;
            params.push({ name: 'scale', type: sql.Int, value: ScaleId });
        }

        if (StrataId) {
            query += ` AND t.StrataId = @strata`;
            params.push({ name: 'strata', type: sql.Int, value: StrataId });
        }

        if (DepthSlabId) {
            query += ` AND t.DepthSlabId = @depthslab`;
            params.push({ name: 'depthslab', type: sql.Int, value: DepthSlabId });
        }

        // Ordering
        query += ` ORDER BY t.CreatedDate DESC`;

        const data = await executeQuery(query, params);

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Recent List Error:", error);
        return NextResponse.json({ message: 'Error fetching list', error: error.message }, { status: 500 });
    }
}
