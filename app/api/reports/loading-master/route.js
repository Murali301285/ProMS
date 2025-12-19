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
                VALUES ('LoadingMaster', @from, @to, 'Pending', 1, GETDATE())
            `, [
                { name: 'from', type: 'Date', value: fromDate },
                { name: 'to', type: 'Date', value: toDate }
            ]);
            return NextResponse.json({ message: 'Date range > 30 days. Report request submitted (Check "Generated Reports").' });
        }

        // 4. Direct Fetch Logic (SQL Aligned with Frontend Columns)
        const query = `
            DECLARE @FromDate DATE = @fromDateInput;
            DECLARE @ToDate DATE = @toDateInput;
            
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
                AND (CONVERT(date,T0.Date) BETWEEN @FromDate AND @ToDate)
            )
            SELECT * FROM MainData ORDER BY Date DESC
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
