
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(req) {
    try {
        const user = await authenticateUser(req);
        const { Date: LoadDate, skip = 0, take = 50 } = await req.json(); // Only Date filter usually for "Recent"

        const pool = await getDbConnection();
        const request = pool.request();

        let query = `
            SELECT 
                T.SlNo, 
                T.Date,
                sh.ShiftName,
                -- Incharges
                -- Incharges
                incL.OperatorName as ShiftInchargeName,
                incM.OperatorName as MidScaleInchargeName,
                
                -- Operator/Driver (Multiple)
                (SELECT STUFF((SELECT ', ' + O.OperatorName + ' (' + CAST(O.OperatorId AS VARCHAR) + ')' 
                 FROM [Trans].[TblEquipmentReadingOperator] ERO 
                 JOIN [Master].[TblOperator] O ON ERO.OperatorId = O.SlNo 
                 WHERE ERO.EquipmentReadingId = T.SlNo 
                 FOR XML PATH('')), 1, 2, '')) AS OperatorName,
                
                -- Master Names (Fixing Aliases)
                r.Name as RelayName,
                e.EquipmentName,
                a.Name as ActivityName,
                
                -- Extended Masters
                sec.SectorName,
                p.Name as PatchName,
                m.Name as MethodName,

                -- Data Columns
                T.OHMR, T.CHMR, T.NetHMR,
                T.OKMR, T.CKMR, T.NetKMR,
                
                T.DevelopmentHrMining, 
                T.FaceMarchingHr, 
                T.DevelopmentHrNonMining, 
                T.BlastingMarchingHr, 
                T.RunningBDMaintenanceHr, 
                
                T.TotalWorkingHr,
                T.BDHr, 
                T.MaintenanceHr, 
                T.IdleHr,

                T.Remarks,
                T.CreatedDate
            FROM [Trans].[TblEquipmentReading] T
            LEFT JOIN [Master].[TblShift] sh ON T.ShiftId = sh.SlNo
            LEFT JOIN [Master].[TblOperator] incL ON T.ShiftInchargeId = incL.SlNo
            LEFT JOIN [Master].[TblOperator] incM ON T.MidScaleInchargeId = incM.SlNo

            -- LEFT JOIN [Master].[TblOperator] op ON T.OperatorId = op.SlNo (Removed for Multi-Select)
            
            LEFT JOIN [Master].[TblRelay] r ON T.RelayId = r.SlNo
            LEFT JOIN [Master].[TblEquipment] e ON T.EquipmentId = e.SlNo
            LEFT JOIN [Master].[TblActivity] a ON T.ActivityId = a.SlNo
            
            LEFT JOIN [Master].[TblSector] sec ON T.SectorId = sec.SlNo
            LEFT JOIN [Master].[TblPatch] p ON T.PatchId = p.SlNo
            LEFT JOIN [Master].[TblMethod] m ON T.MethodId = m.SlNo
            
            WHERE T.IsDelete = 0
        `;

        // ... filters ...

        if (LoadDate) {
            query += ` AND T.Date = @LoadDate`;
            request.input('LoadDate', LoadDate);
        }

        if (user) {
            query += ` AND (T.CreatedBy = @UserId OR T.UpdatedBy = @UserId)`;
            request.input('UserId', user.id);
        }

        query += ` ORDER BY T.CreatedDate DESC OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`;
        request.input('skip', skip);
        request.input('take', take);

        console.log("🚀 [EqReading Recent] Query:", query);
        console.log("   Params:", { LoadDate, UserId: user?.id });

        const result = await request.query(query);

        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("❌ API Error (eq-reading/recent-list):", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
