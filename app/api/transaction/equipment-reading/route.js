
import { NextResponse } from 'next/server';
import { getDbConnection, executeQuery, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    // Pagination
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filters
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search'); // Global Search

    try {
        const pool = await getDbConnection();
        const request = pool.request();

        let whereClause = "WHERE T.IsDelete = 0";

        // Date Filter
        if (fromDate) {
            whereClause += " AND CAST(T.[Date] AS DATE) >= @fromDate";
            request.input('fromDate', sql.Date, fromDate);
        }
        if (toDate) {
            whereClause += " AND CAST(T.[Date] AS DATE) <= @toDate";
            request.input('toDate', sql.Date, toDate);
        }

        // Global Search
        if (search) {
            const term = `%${search}%`;
            whereClause += ` AND (
                S.ShiftName LIKE @search OR 
                R.Name LIKE @search OR 
                Act.Name LIKE @search OR 
                Eq.EquipmentName LIKE @search OR
                T.Remarks LIKE @search
            )`;
            request.input('search', sql.NVarChar, term);
        }

        let query = "SELECT ";
        // Basic Columns
        query += "T.SlNo, T.[Date], ";

        // Shift Logic: Name + (From - To)
        query += "(S.ShiftName + ' (' + LEFT(CAST(S.FromTime AS VARCHAR), 5) + ' to ' + LEFT(CAST(S.ToTime AS VARCHAR), 5) + ')') as ShiftDisplay, ";

        // Join TblOperator twice for Incharges
        query += "SI1.OperatorName + ' (' + CAST(SI1.OperatorId AS VARCHAR) + ')' AS ShiftInchargeName, ";
        query += "SI2.OperatorName + ' (' + CAST(SI2.OperatorId AS VARCHAR) + ')' AS MidScaleInchargeName, "; // Added MidScale Column

        query += "R.Name AS RelayName, ";
        query += "Act.Name AS ActivityName, ";
        query += "Eq.EquipmentName AS EquipmentName, ";

        // Complex Multi-Select: Operator/Driver
        query += "(SELECT STUFF((SELECT ', ' + O.OperatorName + ' (' + CAST(O.OperatorId AS VARCHAR) + ')' FROM [Trans].[TblEquipmentReadingOperator] ERO JOIN [Master].[TblOperator] O ON ERO.OperatorId = O.SlNo WHERE ERO.EquipmentReadingId = T.SlNo FOR XML PATH('')), 1, 2, '')) AS OperatorName, ";

        // Readings & Hours
        query += "T.OHMR, T.CHMR, T.NetHMR, ";
        query += "T.OKMR, T.CKMR, T.NetKMR, ";
        query += "T.DevelopmentHrMining, T.FaceMarchingHr, T.DevelopmentHrNonMining, ";
        query += "T.BlastingMarchingHr, T.RunningBDMaintenanceHr, T.TotalWorkingHr, ";
        query += "T.BDHr, T.MaintenanceHr, T.IdleHr, ";

        // Extended Masters
        query += "Sec.SectorName, ";
        query += "P.Name AS PatchName, ";
        query += "M.Name AS MethodName, ";

        // Metadata
        // Metadata
        query += "T.Remarks, T.CreatedDate, T.UpdatedDate, ";
        query += "CU.EmpName AS CreatedByName, UU.EmpName AS UpdatedByName ";

        query += "FROM [Trans].[TblEquipmentReading] T ";

        // Joins
        query += "LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo ";
        query += "LEFT JOIN [Master].[TblOperator] SI1 ON T.ShiftInchargeId = SI1.SlNo "; // Join 1
        query += "LEFT JOIN [Master].[TblOperator] SI2 ON T.MidScaleInchargeId = SI2.SlNo "; // Join 2
        query += "LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo ";
        query += "LEFT JOIN [Master].[TblActivity] Act ON T.ActivityId = Act.SlNo ";
        query += "LEFT JOIN [Master].[TblEquipment] Eq ON T.EquipmentId = Eq.SlNo ";

        // Assumption: SectorId exists in TblEquipmentReading
        query += "LEFT JOIN [Master].[TblSector] Sec ON T.SectorId = Sec.SlNo ";
        query += "LEFT JOIN [Master].[TblPatch] P ON T.PatchId = P.SlNo ";
        query += "LEFT JOIN [Master].[TblMethod] M ON T.MethodId = M.SlNo ";

        query += "LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo ";
        query += "LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo ";

        query += whereClause;
        query += " ORDER BY T.[Date] DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);

        const result = await request.query(query);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error('Error fetching Equipment Reading list:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const user = await authenticateUser(request);
        const UserId = user ? user.id : 1;

        const body = await request.json();
        const {
            Date: date, ShiftId, ShiftInchargeId, MidScaleInchargeId, RelayId,
            ActivityId, EquipmentId, OperatorId,
            OHMR, CHMR, NetHMR, OKMR, CKMR, NetKMR,
            DevelopmentHrMining, FaceMarchingHr, DevelopmentHrNonMining, BlastingMarchingHr,
            RunningBDMaintenanceHr, TotalWorkingHr, BDHr, MaintenanceHr, IdleHr,
            SectorId, PatchId, MethodId, Remarks,
        } = body;

        // Insert Query
        const query = `
            INSERT INTO [Trans].[TblEquipmentReading] (
                [Date], ShiftId, ShiftInchargeId, MidScaleInchargeId, RelayId, ActivityId, EquipmentId, OperatorId,
                OHMR, CHMR, NetHMR, OKMR, CKMR, NetKMR,
                DevelopmentHrMining, FaceMarchingHr, DevelopmentHrNonMining, BlastingMarchingHr,
                RunningBDMaintenanceHr, TotalWorkingHr, BDHr, MaintenanceHr, IdleHr,
                SectorId, PatchId, MethodId, Remarks,
                CreatedBy, CreatedDate, IsDelete
            )
            OUTPUT INSERTED.SlNo
            VALUES (
                @date, @ShiftId, @ShiftInchargeId, @MidScaleInchargeId, @RelayId, @ActivityId, @EquipmentId, @OperatorId,
                @OHMR, @CHMR, @NetHMR, @OKMR, @CKMR, @NetKMR,
                @DevelopmentHrMining, @FaceMarchingHr, @DevelopmentHrNonMining, @BlastingMarchingHr,
                @RunningBDMaintenanceHr, @TotalWorkingHr, @BDHr, @MaintenanceHr, @IdleHr,
                @SectorId, @PatchId, @MethodId, @Remarks,
                @UserId, GETDATE(), 0
            )
        `;

        const pool = await getDbConnection();
        const req = pool.request();
        // Bind all inputs
        req.input('date', sql.Date, date);
        req.input('ShiftId', sql.Int, ShiftId);
        req.input('ShiftInchargeId', sql.Int, ShiftInchargeId);
        req.input('MidScaleInchargeId', sql.Int, MidScaleInchargeId);
        req.input('RelayId', sql.Int, RelayId);
        req.input('ActivityId', sql.Int, ActivityId);
        req.input('EquipmentId', sql.Int, EquipmentId);
        req.input('OperatorId', sql.Int, OperatorId);

        req.input('OHMR', sql.Decimal(18, 2), OHMR || null);
        req.input('CHMR', sql.Decimal(18, 2), CHMR || null);
        req.input('NetHMR', sql.Decimal(18, 2), NetHMR || null);
        req.input('OKMR', sql.Decimal(18, 2), OKMR || null);
        req.input('CKMR', sql.Decimal(18, 2), CKMR || null);
        req.input('NetKMR', sql.Decimal(18, 2), NetKMR || null);

        req.input('DevelopmentHrMining', sql.Decimal(18, 2), DevelopmentHrMining || null);
        req.input('FaceMarchingHr', sql.Decimal(18, 2), FaceMarchingHr || null);
        req.input('DevelopmentHrNonMining', sql.Decimal(18, 2), DevelopmentHrNonMining || null);
        req.input('BlastingMarchingHr', sql.Decimal(18, 2), BlastingMarchingHr || null);

        req.input('RunningBDMaintenanceHr', sql.Decimal(18, 2), RunningBDMaintenanceHr || null);
        req.input('TotalWorkingHr', sql.Decimal(18, 2), TotalWorkingHr || null);
        req.input('BDHr', sql.Decimal(18, 2), BDHr || null);
        req.input('MaintenanceHr', sql.Decimal(18, 2), MaintenanceHr || null);
        req.input('IdleHr', sql.Decimal(18, 2), IdleHr || null);

        req.input('SectorId', sql.Int, SectorId || null);
        req.input('PatchId', sql.Int, PatchId || null);
        req.input('MethodId', sql.Int, MethodId || null);

        req.input('Remarks', sql.NVarChar, Remarks);
        req.input('UserId', sql.Int, UserId);

        const result = await req.query(query);
        const newId = result.recordset[0].SlNo;

        // Child Table Insert Logic Removed (Now Single Column)

        return NextResponse.json({ success: true, message: 'Saved Successfully', id: newId });

    } catch (error) {
        console.error("Create Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
