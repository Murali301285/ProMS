import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { fromDate, toDate } = await req.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range is required' }, { status: 400 });
        }

        const query = `
            DECLARE @FromDate DATE = @fromDateInput;
            DECLARE @ToDate DATE = @toDateInput;
            DECLARE @ActivityId INT = 3; -- Loading Activity ID (as Rehandling machines log readings under Loading)

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

        const data = await executeQuery(query, [
            { name: 'fromDateInput', value: fromDate },
            { name: 'toDateInput', value: toDate }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Material Rehandling Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
