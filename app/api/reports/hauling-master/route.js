import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        // 1. Validate Input
        if (!fromDate || !toDate) {
            return NextResponse.json({ message: 'From Date and To Date are required' }, { status: 400 });
        }

        // 2. Calculate Date Difference (Native JS)
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 3. Bulk Logic (> 30 Days)
        if (diffDays > 30) {
            await executeQuery(`
                INSERT INTO [Trans].[TblBulkReportRequest] 
                (ReportType, FromDate, ToDate, Status, RequestedBy, RequestedDate)
                VALUES ('HaulingMaster', @from, @to, 'Pending', 1, GETDATE())
            `, [
                { name: 'from', type: 'Date', value: fromDate },
                { name: 'to', type: 'Date', value: toDate }
            ]);
            return NextResponse.json({ message: 'Date range > 30 days. Report request submitted (Check "Generated Reports").' });
        }

        // 4. Direct Fetch Logic (Mirrors Report Generator SQL)
        const query = `
            DECLARE @FromDate DATE = @fromDateInput;
            DECLARE @ToDate DATE = @toDateInput;
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
                AND (CONVERT(date,T0.Date) BETWEEN @FromDate AND @ToDate)
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

        const data = await executeQuery(query, [
            { name: 'fromDateInput', type: 'VarChar', value: fromDate },
            { name: 'toDateInput', type: 'VarChar', value: toDate }
        ]);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
