CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportOperatorPerformanceLoading]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Logic: Base on Equipment Reading to get Hours and Operators, then join Loading for Prod.
    -- This handles the case where multiple operators might exist (we concat them)
    -- and ensures we don't duplicate Loading rows.

    SELECT 
        Cast(R.[Date] as Date) as [Date],
        
        op.OperatorName, -- Split Operator Rows
        
        s.ShiftName,
        Eq.EquipmentName as VehicleNo,
        eg.Name as VehicleModel,
        sec.SectorName as Sector,
        rel.Name as Relay,
        
        -- Hours from Reading
        -- Using SUM as per user logic (assuming one entry per shift/eq or total hours)
        SUM(R.OHMR) as EHStart,
        SUM(R.CHMR) as EHClose,
        SUM(R.TotalWorkingHr) as WHr,

        -- Production (Coal)
        COAL.CoalTrips,
        COAL.CoalQty,
        
        -- Production (OB/Waste)
        OB.OBTrips,
        OB.OBQty as OBQtyBCM

    FROM [Trans].[TblEquipmentReading] R
    LEFT JOIN [Master].[TblEquipment] as Eq on R.EquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblEquipmentGroup as eg on Eq.EquipmentGroupId = eg.SlNo
    LEFT JOIN [Master].TblShift as s on R.ShiftId = s.SlNo
    LEFT JOIN [Master].TblSector as sec on R.SectorId = sec.SlNo
    LEFT JOIN [Master].TblRelay as rel on R.RelayId = rel.SlNo
    
    -- Operator Join
    LEFT JOIN [Trans].[TblEquipmentReadingShiftIncharge] as si on si.[EquipmentReadingId] = R.SlNo
    LEFT JOIN [Master].TblOperator as op on si.OperatorId = op.SlNo 

    -- Production Joins (Pre-aggregated to prevent duplication)
    LEFT JOIN (
        SELECT 
            LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date) as LDate,
            SUM(CASE WHEN MaterialId = 7 THEN 1 ELSE 0 END) as CoalTrips, -- 7=ROM COAL
            SUM(CASE WHEN MaterialId = 7 THEN TotalQty ELSE 0 END) as CoalQty
        FROM [Trans].[TblLoading]
        WHERE IsDelete=0 AND MaterialId = 7
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date)
    ) AS COAL ON COAL.LoadingMachineEquipmentId = R.EquipmentId AND COAL.ShiftId = R.ShiftId AND COAL.LDate = Cast(R.[Date] as Date)

    LEFT JOIN (
        SELECT 
            LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date) as LDate,
            SUM(1) as OBTrips,
            SUM(TotalQty) as OBQty
        FROM [Trans].[TblLoading] L
        JOIN [Master].TblMaterial M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete=0 AND (M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN'))
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date)
    ) AS OB ON OB.LoadingMachineEquipmentId = R.EquipmentId AND OB.ShiftId = R.ShiftId AND OB.LDate = Cast(R.[Date] as Date)

    WHERE R.IsDelete=0 
      AND Cast(R.[Date] as Date) = @Date
      AND R.ActivityId = 3 -- FLITER FOR ACTIVITY = 3

    GROUP BY Cast(R.[Date] as Date), op.OperatorName, s.ShiftName, Eq.EquipmentName, eg.Name, sec.SectorName, rel.Name,
             COAL.CoalTrips, COAL.CoalQty, OB.OBTrips, OB.OBQty

    ORDER BY op.OperatorName, s.ShiftName;
END
