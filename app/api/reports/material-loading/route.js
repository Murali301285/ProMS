import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range is required' }, { status: 400 });
        }

        // Note: The user provided query has many optional filters (@ShiftId, @DestinationId etc.)
        // For now, we only bind @FromDate and @ToDate. Other variables are hardcoded to 0/empty to fetch all.
        const query = `
            DECLARE @FromDate DATE = @fromDateInput;
            DECLARE @ToDate DATE = @toDateInput;
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
            DECLARE @ActivityId INT = 3; -- CORRECTED: ActivityId 3 for Loading

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

        const data = await executeQuery(query, [
            { name: 'fromDateInput', value: fromDate },
            { name: 'toDateInput', value: toDate }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Material Loading Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
