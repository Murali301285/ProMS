import { executeQuery } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// This function runs in the background
export async function generateReportBackground(requestId, reportType, fromDate, toDate, dbName) {
    try {
        console.log(`[ReportWorker] Starting Request #${requestId} for ${reportType} on DB: ${dbName}`);

        let query = '';
        const params = [
            { name: 'FromDate', value: fromDate },
            { name: 'ToDate', value: toDate }
        ];

        // 1. Select Query based on Type
        if (reportType === 'MaterialLoading') {
            // Reusing the Optimized Query Logic
            // Note: repeated code, but efficient for isolation. 
            // In a larger app, we'd extract the SQL string to a shared constant.
            query = `
            DECLARE @ShiftId INT = 0;
            DECLARE @DestinationId INT = 0;
            DECLARE @HaulerEquipmentId INT = 0;
            DECLARE @LoadingMachineEquipmentId INT = 0;
            DECLARE @MaterialIds NVARCHAR(MAX) = '';
            DECLARE @RelayId INT = 0;
            DECLARE @SourceId INT = 0;
            DECLARE @ScaleId INT = 0;
            DECLARE @SectorId INT = 0;
            DECLARE @PatchId INT = 0;
            DECLARE @ActivityId INT = 3;

            SELECT 
                T0.SlNo, 
                FORMAT(T0.LoadingDate,'yyyy') as Year, 
                FORMAT(T0.LoadingDate,'MMMM-yy') as Month,
                FORMAT(T0.LoadingDate,'dd/MM/yyyy') as Date,
                T1.ShiftName,
                T2.Name as SourceName,
                T3.Name as Destination,
                T4.CostCenter as CostCenterHauler,
                T4.EquipmentName as HaulerEquipment,
                T5.CostCenter as CostCenterLoading,
                T5.EquipmentName as LoadingMachine,
                T6.MaterialName,
                T0.NtpcQtyTrip,
                T0.QtyTrip as ManagQtyTrip,
                '' as TripNtpc,
                T0.NoofTrip as TripManagement,
                T0.TotalQty as ManagTotalQty,
                T0.TotalNtpcQty,
                T10.Name as LoadingModel,
                T9.Name as HaulingModel,
                T7.Name as ScaleName,
                T12.SectorName as Sector,
                T13.Name as Patch,
                T8.Name as Relay,
                T0.Remarks as LoadingRemarks,
                dbo.GetShiftInchargeName(T0.SlNo,'Loading') as ShiftIncharge
            FROM [Trans].TblLoading T0 WITH(NOLOCK)
            JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=T0.ShiftId
            JOIN [Master].TblSource T2 WITH(NOLOCK) on T2.SlNo=T0.SourceId
            JOIN [Master].TblDestination T3 WITH(NOLOCK) on T3.SlNo=T0.DestinationId
            JOIN [Master].TblEquipment T4 WITH(NOLOCK) on T4.SlNo=T0.HaulerEquipmentId
            JOIN [Master].TblEquipment T5 WITH(NOLOCK) on T5.SlNo=T0.LoadingMachineEquipmentId
            JOIN [Master].TblMaterial T6 WITH(NOLOCK) on T6.SlNo=T0.MaterialId
            JOIN [Master].TblScale T7 WITH(NOLOCK) on T7.SlNo=T4.ScaleId
            JOIN [Master].TblRelay T8 WITH(NOLOCK) on T8.SlNo=T0.RelayId
            JOIN [Master].TblEquipmentGroup T9 WITH(NOLOCK) on T9.SlNo=T4.EquipmentGroupId
            JOIN [Master].TblEquipmentGroup T10 WITH(NOLOCK) on T10.SlNo=T5.EquipmentGroupId
            LEFT JOIN [Trans].TblEquipmentReading T11 WITH(NOLOCK) on T11.ActivityId=@ActivityId 
                AND CONVERT(date,T11.Date)=CONVERT(date,T0.LoadingDate) 
                AND T11.ShiftId=T0.ShiftId 
                AND T11.EquipmentId=T0.LoadingMachineEquipmentId 
                AND T11.IsDelete=0
            LEFT JOIN [Master].TblSector T12 WITH(NOLOCK) on T12.SlNo=T11.SectorId 
            LEFT JOIN [Master].TblPatch T13 WITH(NOLOCK) ON T13.SlNo=T11.PatchId
            WHERE T0.IsDelete = 0
            AND (CONVERT(date,T0.LoadingDate) BETWEEN @FromDate AND @ToDate)
            ORDER BY T0.LoadingDate ASC
            `;
        } else if (reportType === 'MaterialRehandling') {
            query = `
            -- Params @FromDate and @ToDate are available directly
            DECLARE @ActivityId INT = 0; -- Not required

            SELECT 
                T0.SlNo, 
                FORMAT(T0.RehandlingDate,'yyyy') as Year, 
                FORMAT(T0.RehandlingDate,'MMMM-yy') as Month,
                FORMAT(T0.RehandlingDate,'dd-MMM-yy') as Date,
                T1.ShiftName,
                T2.Name as SourceName,
                T3.Name as Destination,
                T4.CostCenter as CostCenterHauler,
                
                format(T0.HaulerEquipmentId, '2000000') as ProdsysCodeHauling,

                T4.EquipmentName as HaulerEquipment,
                T5.CostCenter as CostCenterLoading,
                
                format(T0.LoadingMachineEquipmentId, '2000000') as ProdsysCodeLoading,
                
                T5.EquipmentName as LoadingMachine,
                T6.MaterialName,
                T0.NtpcQtyTrip,
                T0.QtyTrip as ManagQtyTrip,
                '' as TripNtpc,
                T0.NoofTrip as TripManagement,
                T0.TotalQty as ManagTotalQty,
                T0.TotalNtpcQty,
                T10.Name as LoadingModel,
                T9.Name as HaulingModel,
                T7.Name as ScaleName,
                T12.SectorName as Sector,
                T13.Name as Patch,
                T8.Name as Relay,
                dbo.GetShiftInchargeName(T0.SlNo,'MaterialRehandling') as ShiftIncharge,
                T0.Remarks
            FROM [Trans].TblMaterialRehandling T0
            JOIN [Master].TblShift T1 on T1.SlNo=T0.ShiftId
            JOIN [Master].TblSource T2 on T2.SlNo=T0.SourceId
            JOIN [Master].TblDestination T3 on T3.SlNo=T0.DestinationId
            JOIN [Master].TblEquipment T4 on T4.SlNo=T0.HaulerEquipmentId
            JOIN [Master].TblEquipment T5 on T5.SlNo=T0.LoadingMachineEquipmentId
            JOIN [Master].TblMaterial T6 on T6.SlNo=T0.MaterialId
            JOIN [Master].TblScale T7 on T7.SlNo=T4.ScaleId
            JOIN [Master].TblRelay T8 on T8.SlNo=T0.RelayId
            join [Master].TblEquipmentGroup T9 on T9.SlNo=T4.EquipmentGroupId
            join [Master].TblEquipmentGroup T10 on T10.SlNo=T5.EquipmentGroupId
            left join [Trans].TblEquipmentReading T11 on T11.ActivityId=@ActivityId and CONVERT(date,T11.Date)=CONVERT(date,T0.RehandlingDate) and T11.ShiftId=T0.ShiftId and T11.EquipmentId=T0.LoadingMachineEquipmentId and T11.IsDelete=0
            left join [Master].TblSector T12 on T12.SlNo=T11.SectorId 
            Left Join [Master].TblPatch T13 ON T13.SlNo=T11.PatchId
            WHERE T0.IsDelete = 0
            AND (CONVERT(date,T0.RehandlingDate) BETWEEN @FromDate AND @ToDate)
            ORDER BY T0.RehandlingDate ASC
            `;
        } else if (reportType === 'LoadingMaster') {
            query = `
            DECLARE @FromDateVar DATE = @FromDate;
            DECLARE @ToDateVar DATE = @ToDate;
            
            DECLARE @ActivityId INT = 4; 
            DECLARE @ObMatrialId INT = 1; 
            DECLARE @CoalMatrialId INT = 8;

            WITH MainData AS (
                SELECT 
                    T0.SlNo,
                    T2.CostCenter,
                    format(t0.EquipmentId, '2000000') as PMSCode,
                    FORMAT(T0.Date,'yyyy') as Year, 
                    FORMAT(T0.Date,'MMMM-yy') as Month,
                    FORMAT(T0.Date,'dd-MMM-yy') as Date,
                    dbo.GetOperatorName(T0.SlNo,'EquipmentReading') as [Operator's Name],
                    T1.ShiftName as Shift, 
                    T2.EquipmentName as [Loading Machine],
                    EG.Name as [Loading Model],
                    T3.Name as Relay,
                    T0.OHMR,
                    T0.CHMR,
                    T0.NetHMR as [Net HMR],
                    T0.TotalWorkingHr as [Total Working Hr],
                    
                    FORMAT(CASE WHEN ISNULL(T8.CoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T8.CoalTrips,0.00)) ELSE 0.00 END,'0.00') as [Coal Hrs],
                    FORMAT(CASE WHEN ISNULL(T7.OBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T7.OBTRIPS,0.00)) ELSE 0.00 END,'0.00') as [OB Hrs],
                    
                    FORMAT(CASE WHEN ISNULL(T10.RehandlingCoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T10.RehandlingCoalTrips,0.00)) ELSE 0.00 END,'0.00') as [Coal Rehandling Hrs],
                    FORMAT(CASE WHEN ISNULL(T9.RehandlingOBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T9.RehandlingOBTRIPS,0.00)) ELSE 0.00 END,'0.00') as [OB Rehandling Hrs],
                    
                    ISNULL(T7.OBTRIPS,0.00) as [OB Trips],
                    ISNULL(T7.QuantityBcm,0.00) as [Quantity (BCM)],
                    ISNULL(T8.CoalTrips,0.00) as [Coal Trips],
                    ISNULL(T8.QuantityMt,0.00) as [Quantity (MT)],
                    
                    NULL as [Trip/Hrs],
                    NULL as [BCM/Hrs],

                    T0.DevelopmentHrMining as [Development Hr (Mining)],
                    T0.FaceMarchingHr as [Face Marching Hr],
                    T0.DevelopmentHrNonMining as [Development Hr (Non-Mining)],
                    T0.BlastingMarchingHr as [Blasting Marching Hr],
                    T0.RunningBDMaintenanceHr as [Running BD/Maintenance Hr],
                    T0.BDHr as [BD Hr.],
                    T0.MaintenanceHr as [Maintenance Hr.],
                    
                    ISNULL(T10.RehandlingCoalTrips,0.00) as [Coal Rehandling Trips],
                    ISNULL(T9.RehandlingOBTRIPS,0.00) as [OB Rehandling Trips],
                    ISNULL(T11.RehandlingOtherTrips,0.00) as [Other Rehandling Trips],

                    T4.SectorName as Sector,
                    T5.Name as Patch,
                    T6.Name as Method,
                    T0.Remarks

                FROM [Trans].TblEquipmentReading T0
                JOIN [Master].TblShift T1 on T1.SlNo=T0.ShiftId
                JOIN [Master].TblEquipment T2 on T2.SlNo=T0.EquipmentId
                JOIN [Master].TblEquipmentGroup EG on EG.SlNo=T2.EquipmentGroupId
                JOIN [Master].TblRelay T3 on T3.SlNo=T0.RelayId
                LEFT JOIN [Master].TblSector T4 on T4.SlNo=T0.SectorId
                LEFT JOIN [Master].TblPatch T5 on T5.SlNo=T0.PatchId
                LEFT JOIN [Master].TblMethod T6 on T6.SlNo=T0.MethodId
                
                OUTER APPLY (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T7
                OUTER APPLY (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T8
                OUTER APPLY (select SUM(NoofTrip) as RehandlingOBTRIPS,SUM(TotalQty) as RehandlingOBQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T9
                OUTER APPLY (select SUM(NoofTrip) as RehandlingCoalTrips,SUM(TotalQty) as RehandlingCoalQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T10
                OUTER APPLY (select SUM(NoofTrip) as RehandlingOtherTrips,SUM(TotalQty) as RehandlingOtherQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId not  in (@ObMatrialId,@CoalMatrialId) and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T11
                
                WHERE T0.IsDelete=0 AND T0.ActivityId != @ActivityId
                AND (CONVERT(date,T0.Date) BETWEEN @FromDateVar AND @ToDateVar)
            )
            SELECT * FROM MainData ORDER BY Date DESC
            `;
        } else if (reportType === 'HaulingMaster') {
            query = `
            DECLARE @FromDateVar DATE = @FromDate;
            DECLARE @ToDateVar DATE = @ToDate;
            DECLARE @ActivityId INT = 4;
            DECLARE @ShiftId INT = 0;
            DECLARE @EquipmentId INT = 0;
            DECLARE @RelayId INT = 0;
            DECLARE @SectorId INT = 0;
            DECLARE @ObMatrialId INT = 1; 
            DECLARE @CoalMatrialId INT = 8;

            WITH MainData AS (
                select T0.SlNo,T0.Date as MainDate, FORMAT(T0.Date,'yyyy') as Year, FORMAT(T0.Date,'MMMM-yy') as Month,FORMAT(T0.Date,'dd-MMM-yy') as Date,
                dbo.GetOperatorName(T0.SlNo,'EquipmentReading') as Operator,T1.ShiftName, T2.CostCenter,
                
                format(T0.EquipmentId, '2000000') as ProdsysCode,
                
                T2.EquipmentName as Equipment,EG.Name as EquipmentModel,
                T3.Name as Relay,T0.OHMR,T0.CHMR,T0.NetHMR,T0.TotalWorkingHr,
                FORMAT(CASE WHEN ISNULL(T8.CoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T8.CoalTrips,0.00)) ELSE 0.00 END,'0.00') as CoalHrs,
                FORMAT(CASE WHEN ISNULL(T7.OBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T7.OBTRIPS,0.00)) ELSE 0.00 END,'0.00') as OBHrs,
                FORMAT(CASE WHEN ISNULL(T10.RehandlingCoalTrips,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T10.RehandlingCoalTrips,0.00)) ELSE 0.00 END,'0.00') as MainCoalRehandlingHrs,
                FORMAT(CASE WHEN ISNULL(T9.RehandlingOBTRIPS,0.00)>0 THEN (ISNULL(T0.TotalWorkingHr,0.00)/(ISNULL(T8.CoalTrips,0.00)+ISNULL(T7.OBTRIPS,0.00)+ISNULL(T9.RehandlingOBTRIPS,0.00)+ISNULL(T10.RehandlingCoalTrips,0.00)+ISNULL(T11.RehandlingOtherTrips,0.00))*ISNULL(T9.RehandlingOBTRIPS,0.00)) ELSE 0.00 END,'0.00') as MainOBRehandlingHrs,
                ISNULL(T7.OBTRIPS,0.00) as OBTRIPS,ISNULL(T7.QuantityBcm,0.00) as QuantityBcm,ISNULL(T8.CoalTrips,0.00) as CoalTrips,ISNULL(T8.QuantityMt,0.00) as QuantityMt,
                T0.DevelopmentHrMining,T0.FaceMarchingHr,T0.DevelopmentHrNonMining,T0.BlastingMarchingHr,T0.RunningBDMaintenanceHr,
                T0.BDHr,T0.MaintenanceHr,T4.SectorName,T5.Name as Patch,T6.Name as Method,ISNULL(T9.RehandlingOBTRIPS,0.00) as RehandlingOBTRIPS,ISNULL(T9.RehandlingOBQty,0.00) as RehandlingOBQty,ISNULL(T10.RehandlingCoalQty,0.00) as RehandlingCoalQty,ISNULL(T10.RehandlingCoalTrips,0.00) as RehandlingCoalTrips,
                ISNULL(T11.RehandlingOtherTrips,0.00) as RehandlingOtherTrips,ISNULL(T11.RehandlingOtherQty,0.00) as RehandlingOtherQty,'' as Speed,'' as RouteLength,'' as strLead,T0.OKMR,T0.CKMR,T0.NetKMR,T0.Remarks
                from [Trans].TblEquipmentReading T0
                Join [Master].TblShift T1 on T1.SlNo=T0.ShiftId
                Join [Master].TblEquipment T2 on T2.SlNo=T0.EquipmentId
                Join [Master].TblEquipmentGroup EG on EG.SlNo=T2.EquipmentGroupId
                Join [Master].TblRelay T3 on T3.SlNo=T0.RelayId
                left join [Master].TblSector T4 on T4.SlNo=T0.SectorId
                left join [Master].TblPatch T5 on T5.SlNo=T0.PatchId
                left join [Master].TblMethod T6 on T6.SlNo=T0.MethodId
                outer apply (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T7
                outer apply (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T8
                outer apply (select SUM(NoofTrip) as RehandlingOBTRIPS,SUM(TotalQty) as RehandlingOBQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T9
                outer apply (select SUM(NoofTrip) as RehandlingCoalTrips,SUM(TotalQty) as RehandlingCoalQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T10
                outer apply (select SUM(NoofTrip) as RehandlingOtherTrips,SUM(TotalQty) as RehandlingOtherQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId not  in (@ObMatrialId,@CoalMatrialId) and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and HaulerEquipmentId=T0.EquipmentId) as T11
                where T0.IsDelete=0 and T0.ActivityId=@ActivityId
                AND (CONVERT(date,T0.Date) BETWEEN @FromDateVar AND @ToDateVar)
                AND (@ShiftId = 0 OR T0.ShiftId = @ShiftId )
                AND (@EquipmentId = 0 OR T0.EquipmentId = @EquipmentId )
                AND (@RelayId = 0 OR T0.RelayId = @RelayId )
                AND (@SectorId = 0 OR T0.SectorId = @SectorId )
            )
            SELECT 
                SlNo as [Sl.No],
                CostCenter as [Cost Center],
                ProdsysCode as [PMS Code],
                Year, Month, Date,
                Operator as [Operator's Name],
                ShiftName as [Shift],
                Equipment as [Hauler],
                EquipmentModel as [Hauling Model],
                Relay, OHMR, CHMR, NetHMR as [Net HMR], TotalWorkingHr as [Total Working Hr],
                CoalHrs as [Coal Hrs],
                OBHrs as [OB Hrs],
                MainCoalRehandlingHrs as [Coal Rehandling Hrs],
                MainOBRehandlingHrs as [OB Rehandling Hrs],
                OBTRIPS as [OB Trips],
                QuantityBcm as [Quantity (BCM)],
                CoalTrips as [Coal Trips],
                QuantityMt as [Quantity (MT)],
                OKMR, CKMR, NetKMR as [Net KMR],
                FORMAT(CASE WHEN (CAST(OBHrs AS FLOAT) + CAST(CoalHrs AS FLOAT)) = 0 THEN 0.00
                ELSE (CAST(OBTRIPS AS FLOAT) + CAST(CoalTrips AS FLOAT)) / NULLIF((CAST(CoalHrs AS FLOAT) + CAST(OBHrs AS FLOAT)), 0)
                END, '0.00') AS [Trip/Hrs],
                FORMAT(CASE WHEN (CAST(CoalHrs AS FLOAT) + CAST(OBHrs AS FLOAT)) = 0 THEN 0.00
                ELSE (CAST(QuantityBcm AS FLOAT) + (CAST(QuantityMt AS FLOAT) / 1.55)) / NULLIF(CAST(TotalWorkingHr AS FLOAT), 0)
                END, '0.00') AS [BCM/Hrs],
                RehandlingCoalTrips as [Coal Rehandling Trips],
                RehandlingCoalQty as [Coal Rehandling Qty],
                RehandlingOBTRIPS as [OB Rehandling Trips],
                RehandlingOBQty as [OB Rehandling Qty],
                RehandlingOtherTrips as [Other Rehandling Trips],
                RehandlingOtherQty as [Other Rehandling Qty],
                Speed, RouteLength as [Route Length], strLead as [Lead], Remarks
            FROM MainData
            ORDER BY MainDate, ShiftName ASC;
            `;
        }

        // 2. Execute
        const data = await executeQuery(query, params, dbName);

        // 3. Save to File
        const fileName = `${reportType}_${requestId}_${Date.now()}.json`;
        // Save to 'reports' folder in ROOT (not public) to avoid Next.js static confusion
        const uploadDir = path.join(process.cwd(), 'reports');

        // Ensure dir exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(data));

        // 4. Update Status to COMPLETED
        await executeQuery(`
            UPDATE [Trans].[TblReportRequest]
            SET Status = 'COMPLETED', 
                ArtifactPath = @Path,
                CompletedDate = GETDATE()
            WHERE SlNo = @SlNo
        `, [
            { name: 'Path', value: `/api/reports/download?file=${fileName}` }, // Point to our new API
            { name: 'SlNo', value: requestId }
        ], dbName);

        console.log(`[ReportWorker] Request #${requestId} Completed. Rows: ${data.length}`);

    } catch (error) {
        console.error(`[ReportWorker] Request #${requestId} Failed:`, error);

        // Update Status to FAILED
        await executeQuery(`
            UPDATE [Trans].[TblReportRequest]
            SET Status = 'FAILED', 
                ErrorMessage = @Msg,
                CompletedDate = GETDATE()
            WHERE SlNo = @SlNo
        `, [
            { name: 'Msg', value: error.message },
            { name: 'SlNo', value: requestId }
        ], dbName);
    }
}
