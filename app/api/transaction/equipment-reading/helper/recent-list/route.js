export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(req) {
    try {
        const user = await authenticateUser(req);
        const {
            Date: LoadDate,
            shiftId,
            shiftInchargeId,
            midScaleInchargeId,
            activityId,
            equipmentId,
            skip = 0, take = 50
        } = await req.json();

        const pool = await getDbConnection();
        const request = pool.request();

        let query = `
            SELECT 
                T.SlNo, 
                T.Date,
                sh.ShiftName as ShiftDisplay,
                -- Incharges
                incL.OperatorName as ShiftInchargeName,
                incM.OperatorName as MidScaleInchargeName,
                
               -- Operator/Driver (Multiple) with Fallback
               COALESCE((SELECT STUFF((SELECT ', ' + O.OperatorName + ' (' + CAST(O.OperatorId AS VARCHAR) + ')' 
                FROM [Trans].[TblEquipmentReadingOperator] ERO 
                JOIN [Master].[TblOperator] O ON ERO.OperatorId = O.SlNo 
                WHERE ERO.EquipmentReadingId = T.SlNo 
                FOR XML PATH('')), 1, 2, '')), OMain.OperatorName + ' (' + CAST(OMain.OperatorId AS VARCHAR) + ')') AS OperatorName,
               
                -- Master Names
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
                CU.EmpName AS CreatedByName,
                T.CreatedDate,
                UU.EmpName AS UpdatedByName,
                T.UpdatedDate
            FROM [Trans].[TblEquipmentReading] T
            LEFT JOIN [Master].[TblShift] sh ON T.ShiftId = sh.SlNo
            LEFT JOIN [Master].[TblOperator] incL ON T.ShiftInchargeId = incL.SlNo
            LEFT JOIN [Master].[TblOperator] incM ON T.MidScaleInchargeId = incM.SlNo
            LEFT JOIN [Master].[TblOperator] OMain ON T.OperatorId = OMain.SlNo
            
            LEFT JOIN [Master].[TblRelay] r ON T.RelayId = r.SlNo
            LEFT JOIN [Master].[TblEquipment] e ON T.EquipmentId = e.SlNo
            LEFT JOIN [Master].[TblActivity] a ON T.ActivityId = a.SlNo
            
            LEFT JOIN [Master].[TblSector] sec ON T.SectorId = sec.SlNo
            LEFT JOIN [Master].[TblPatch] p ON T.PatchId = p.SlNo
            LEFT JOIN [Master].[TblMethod] m ON T.MethodId = m.SlNo

            -- Audit Users
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            
            WHERE T.IsDelete = 0
        `;

        // --- Dynamic Filters ---

        if (LoadDate) {
            query += ` AND T.Date = @LoadDate`;
            request.input('LoadDate', LoadDate);
        }
        if (shiftId) {
            query += ` AND T.ShiftId = @shiftId`;
            request.input('shiftId', shiftId);
        }
        if (shiftInchargeId) {
            query += ` AND T.ShiftInchargeId = @shiftInchargeId`;
            request.input('shiftInchargeId', shiftInchargeId);
        }
        if (midScaleInchargeId) {
            query += ` AND T.MidScaleInchargeId = @midScaleInchargeId`;
            request.input('midScaleInchargeId', midScaleInchargeId);
        }
        if (activityId) {
            query += ` AND T.ActivityId = @activityId`;
            request.input('activityId', activityId);
        }
        if (equipmentId) {
            query += ` AND T.EquipmentId = @equipmentId`;
            request.input('equipmentId', equipmentId);
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
