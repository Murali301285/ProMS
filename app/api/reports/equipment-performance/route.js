import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { date } = await req.json();

        if (!date) {
            return NextResponse.json({ message: 'Date is required' }, { status: 400 });
        }

        // Note: This report runs for a single date (Daily Performance), 
        // so we don't need the bulk "range > 30 days" logic here typically.
        // However, the SQL is heavy, so we keep direct fetch for now.

        const query = `
            DECLARE @SelectedDate DATE = @dateInput;
            DECLARE @ToDate DATE = @SelectedDate; -- User selected date acts as "To Date" (Current Day)
            DECLARE @FromDate DATE; 
            
            -- Set FromDate to 1st of the month (MTD Logic)
            SET @FromDate = DATEFROMPARTS(YEAR(@ToDate), MONTH(@ToDate), 1);

            -- Constants & Defaults
            DECLARE @ShiftAId INT = 1;
            DECLARE @ShiftBId INT = 2;
            DECLARE @ShiftCId INT = 3;
            DECLARE @ObMatrialId INT = 1; 
            DECLARE @CoalMatrialId INT = 8;
            DECLARE @EquipmentId INT = 0; -- Default All
            DECLARE @ActivityId INT = 0; -- Default All

            -- CTE MainData (Source Logic)
            WITH MainData AS (
                select T0.SlNo,Convert(date,T0.Date) as Date,T0.EquipmentId,T0.ShiftId,
                ISNULL(T7.OBTRIPS,0.00) as ObTrips,ISNULL(T7.QuantityBcm,0.00) as ObQuantity,ISNULL(T8.CoalTrips,0.00) as CoalTrips,ISNULL(T8.QuantityMt,0.00) as  CoalQuantity,
                ISNULL(T9.RehandlingOBTRIPS,0.00) as RehandlingOBTrips,ISNULL(T9.RehandlingOBQty,0.00) as RehandlingOBQty,ISNULL(T10.RehandlingCoalQty,0.00) as RehandlingCoalQty,ISNULL(T10.RehandlingCoalTrips,0.00) as RehandlingCoalTrips,
                ISNULL(T11.RehandlingOtherTrips,0.00) as RehandlingOtherTrips,ISNULL(T11.RehandlingOtherQty,0.00) as RehandlingOtherQty,
                ISNULL(T0.TotalWorkingHr,0.00) as TotalWorkingHr,ISNULL(T0.NetKMR,0.00) as NetKMR
                from [Trans].TblEquipmentReading T0
                Join [Master].TblShift T1 on T1.SlNo=T0.ShiftId
                Join [Master].TblEquipment T2 on T2.SlNo=T0.EquipmentId
                outer apply (select SUM(NoofTrip) as OBTRIPS,SUM(TotalQty) as QuantityBcm  from [Trans].TblLoading where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T7
                outer apply (select SUM(NoofTrip) as CoalTrips,SUM(TotalQty) as QuantityMt  from [Trans].TblLoading where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,LoadingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T8
                outer apply (select SUM(NoofTrip) as RehandlingOBTRIPS,SUM(TotalQty) as RehandlingOBQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@ObMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T9
                outer apply (select SUM(NoofTrip) as RehandlingCoalTrips,SUM(TotalQty) as RehandlingCoalQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId=@CoalMatrialId and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T10
                outer apply (select SUM(NoofTrip) as RehandlingOtherTrips,SUM(TotalQty) as RehandlingOtherQty  from [Trans].TblMaterialRehandling where IsDelete=0 and MaterialId not  in (@ObMatrialId,@CoalMatrialId) and CONVERT(date,RehandlingDate)=CONVERT(date,T0.Date) and ShiftId=T0.ShiftId and LoadingMachineEquipmentId=T0.EquipmentId) as T11
                where T0.IsDelete=0 AND (CONVERT(date,T0.Date) BETWEEN @FromDate AND @ToDate)
                AND (@EquipmentId = 0 OR T0.EquipmentId = @EquipmentId )
                AND (@ActivityId = 0 OR T0.ActivityId = @ActivityId )
            )

            -- Final Select
            select T0.SlNo,
            format(t0.SlNo, '2000000') as PMSCode,
            T0.CostCenter,T0.EquipmentName as Equipment,T1.Name as Activity, -- Alias EquipmentName to Equipment

            FORMAT(ISNULL(T2.ShiftATotalTrips,0),'0') as [Shift ATotal Trips],
            FORMAT(ISNULL(T2.ShiftATotalQty,0.00),'0.00') as [Shift ATotal Qty],
            FORMAT(ISNULL(T2.ShiftATotalHrs,0),'0.00') as [Shift ATotal Hrs],
            FORMAT(ISNULL(T2.ShiftATotalKms,0),'0.00') as [Shift ATotal Kms],
            FORMAT(ISNULL(ISNULL(T2.ShiftATotalTrips,0)/NULLIF(T2.ShiftATotalHrs,0),0.00),'0.00') as [Shift ATrips Per Hr],
            FORMAT(ISNULL(ISNULL(T2.ShiftATotalQty,0)/NULLIF(T2.ShiftATotalHrs,0),0.00),'0.00') as [Shift AQty Per Hr],
            
            FORMAT(ISNULL(T3.ShiftBTotalTrips,0),'0') as [Shift BTotal Trips],
            FORMAT(ISNULL(T3.ShiftBTotalQty,0.00),'0.00') as [Shift BTotal Qty],
            FORMAT(ISNULL(T3.ShiftBTotalHrs,0),'0.00') as [Shift BTotal Hrs],
            FORMAT(ISNULL(T3.ShiftBTotalKms,0),'0.00') as [Shift BTotal Kms],
            FORMAT(ISNULL(ISNULL(T3.ShiftBTotalTrips,0)/NULLIF(T3.ShiftBTotalHrs,0),0.00),'0.00') as [Shift BTrips Per Hr],
            FORMAT(ISNULL(ISNULL(T3.ShiftBTotalQty,0)/NULLIF(T3.ShiftBTotalHrs,0),0.00),'0.00') as [Shift BQty Per Hr], 
            
            FORMAT(ISNULL(T4.ShiftCTotalTrips,0),'0') as [Shift CTotal Trips],
            FORMAT(ISNULL(T4.ShiftCTotalQty,0.00),'0.00') as [Shift CTotal Qty],
            FORMAT(ISNULL(T4.ShiftCTotalHrs,0),'0.00') as [Shift CTotal Hrs],
            FORMAT(ISNULL(T4.ShiftCTotalKms,0),'0.00') as [Shift CTotal Kms],
            FORMAT(ISNULL(ISNULL(T4.ShiftCTotalTrips,0)/NULLIF(T4.ShiftCTotalHrs,0),0.00),'0.00') as [Shift CTrips Per Hr],
            FORMAT(ISNULL(ISNULL(T4.ShiftCTotalQty,0)/NULLIF(T4.ShiftCTotalHrs,0),0.00),'0.00') as [Shift CQty Per Hr],
            
            FORMAT(ISNULL(T5.MtdTotalTrips,0),'0') as [MTDTotal Trips],
            FORMAT(ISNULL(T5.MtdTotalQty,0.00),'0.00') as [MTDTotal Qty],
            FORMAT(ISNULL(T5.MtdTotalHrs,0),'0.00') as [MTDTotal Hrs],
            FORMAT(ISNULL(T5.MtdTotalKms,0),'0.00') as [MTDTotal Kms],
            FORMAT(ISNULL(ISNULL(T5.MtdTotalTrips,0)/NULLIF(T5.MtdTotalHrs,0),0.00),'0.00') as [MTDTrips Per Hr],
            FORMAT(ISNULL(ISNULL(T5.MtdTotalQty,0)/NULLIF(T5.MtdTotalHrs,0),0.00),'0.00') as [MTDQty Per Hr],
            '' as [MTDFuel Per Hr] ,'' as [MTDKMPL],'' as [MTDTotal Fuel],
            
            FORMAT(ISNULL(T2.ShiftATotalTrips,0)+ISNULL(T3.ShiftBTotalTrips,0)+ISNULL(T4.ShiftCTotalTrips,0),'0.00') as [FTDTotal Trips],
            FORMAT(ISNULL(T2.ShiftATotalQty,0)+ISNULL(T3.ShiftBTotalQty,0)+ISNULL(T4.ShiftCTotalQty,0),'0.00') as [FTDTotal Qty],
            FORMAT(ISNULL(T2.ShiftATotalHrs,0)+ISNULL(T3.ShiftBTotalHrs,0)+ISNULL(T4.ShiftCTotalHrs,0),'0.00') as [FTDTotal Hrs],
            FORMAT(ISNULL(T2.ShiftATotalKms,0)+ISNULL(T3.ShiftBTotalKms,0)+ISNULL(T4.ShiftCTotalKms,0),'0.00') as [FTDTotal Kms],
            '' as [FTDTotal Fuel],
            
            FORMAT(((ISNULL(ISNULL(T2.ShiftATotalTrips,0)/NULLIF(T2.ShiftATotalHrs,0),0.00))+(ISNULL(ISNULL(T3.ShiftBTotalTrips,0)/NULLIF(T3.ShiftBTotalHrs,0),0.00))+(ISNULL(ISNULL(T4.ShiftCTotalTrips,0)/NULLIF(T4.ShiftCTotalHrs,0),0.00)))/3,'0.00') as [FTDTrips Per Hr],
            FORMAT(((ISNULL(ISNULL(T2.ShiftATotalQty,0)/NULLIF(T2.ShiftATotalHrs,0),0.00))+(ISNULL(ISNULL(T3.ShiftBTotalQty,0)/NULLIF(T3.ShiftBTotalHrs,0),0.00))+(ISNULL(ISNULL(T4.ShiftCTotalQty,0)/NULLIF(T4.ShiftCTotalHrs,0),0.00)))/3,'0.00') as [FTDQty Per Hr],
            '' as [FTDFuel Per Hr],
            '' as [FTDKMPL],
            '' as Remarks

            from [Master].TblEquipment T0
            Join [Master].TblActivity T1 on T1.SlNo=T0.ActivityId
            outer apply (select SUM(ISNULL(ObTrips,0.00)+ISNULL(CoalTrips,0.00)+ISNULL(RehandlingCoalTrips,0.00)+ISNULL(RehandlingOBTrips,0.00)+ISNULL(RehandlingOtherTrips,0.00)) as ShiftATotalTrips,SUM((ISNULL(ObQuantity,0.00)+ISNULL(CoalQuantity,0.00)+ISNULL(RehandlingCoalQty,0.00)+ISNULL(RehandlingOBQty,0.00))/1.55) as ShiftATotalQty,SUM(Isnull(TotalWorkingHr,0.00)) as ShiftATotalHrs,SUM(Isnull(NetKMR,0.00)) as ShiftATotalKms from MainData where EquipmentId=T0.SlNo and ShiftId=@ShiftAId and Date=@ToDate) T2
            outer apply (select SUM(ISNULL(ObTrips,0.00)+ISNULL(CoalTrips,0.00)+ISNULL(RehandlingCoalTrips,0.00)+ISNULL(RehandlingOBTrips,0.00)+ISNULL(RehandlingOtherTrips,0.00)) as ShiftBTotalTrips,SUM((ISNULL(ObQuantity,0.00)+ISNULL(CoalQuantity,0.00)+ISNULL(RehandlingCoalQty,0.00)+ISNULL(RehandlingOBQty,0.00))/1.55) as ShiftBTotalQty,SUM(Isnull(TotalWorkingHr,0.00)) as ShiftBTotalHrs,SUM(Isnull(NetKMR,0.00)) as ShiftBTotalKms from MainData where EquipmentId=T0.SlNo and ShiftId=@ShiftBId and Date=@ToDate) T3
            outer apply (select SUM(ISNULL(ObTrips,0.00)+ISNULL(CoalTrips,0.00)+ISNULL(RehandlingCoalTrips,0.00)+ISNULL(RehandlingOBTrips,0.00)+ISNULL(RehandlingOtherTrips,0.00)) as ShiftCTotalTrips,SUM((ISNULL(ObQuantity,0.00)+ISNULL(CoalQuantity,0.00)+ISNULL(RehandlingCoalQty,0.00)+ISNULL(RehandlingOBQty,0.00))/1.55) as ShiftCTotalQty,SUM(Isnull(TotalWorkingHr,0.00)) as ShiftCTotalHrs,SUM(Isnull(NetKMR,0.00)) as ShiftCTotalKms from MainData where EquipmentId=T0.SlNo and ShiftId=@ShiftCId and Date=@ToDate) T4
            outer apply (select SUM(ISNULL(ObTrips,0.00)+ISNULL(CoalTrips,0.00)+ISNULL(RehandlingCoalTrips,0.00)+ISNULL(RehandlingOBTrips,0.00)+ISNULL(RehandlingOtherTrips,0.00)) as MtdTotalTrips,SUM((ISNULL(ObQuantity,0.00)+ISNULL(CoalQuantity,0.00)+ISNULL(RehandlingCoalQty,0.00)+ISNULL(RehandlingOBQty,0.00))/1.55) as MtdTotalQty,SUM(Isnull(TotalWorkingHr,0.00)) as MtdTotalHrs,SUM(Isnull(NetKMR,0.00)) as MtdTotalKms from MainData where EquipmentId=T0.SlNo and Date BETWEEN @FromDate AND @ToDate) T5
            where T0.IsDelete=0
            
            order by T0.EquipmentName asc
        `;

        const data = await executeQuery(query, [
            { name: 'dateInput', type: 'VarChar', value: date }
        ]);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
