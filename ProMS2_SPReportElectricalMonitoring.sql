CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportElectricalMonitoring]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @DayOfMonth INT = DAY(@Date);

    -- Pre-aggregate Reading (Hours) - Filtered for Sector 4 (Fixed)
    WITH CTE_Daily_Eq AS (
        SELECT 
            R.EquipmentId,
            R.ShiftId,
            Cast(R.[Date] as Date) as WorkDate,
            SUM(R.TotalWorkingHr) as WorkingHr,
            R.SectorId,
            Eq.EquipmentGroupId
        FROM [Trans].[TblEquipmentReading] R
        JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
        WHERE R.IsDelete = 0 
          AND Cast(R.[Date] as Date) BETWEEN @MonthStart AND @Date
          AND R.SectorId = 4 -- FIXED SECTOR = 4 as per request
          AND Eq.ActivityId IN (3, 4, 5) 
        GROUP BY R.EquipmentId, R.ShiftId, Cast(R.[Date] as Date), R.SectorId, Eq.EquipmentGroupId
    ),
    
    -- Pre-aggregate Loading (Trips/Qty) - Filtered for OVER BURDEN
    CTE_Daily_Loading AS (
        SELECT 
            L.LoadingMachineEquipmentId,
            L.ShiftId,
            Cast(L.LoadingDate as Date) as LDate,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty
        FROM [Trans].[TblLoading] L
        LEFT JOIN [Master].[TblMaterial] M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) BETWEEN @MonthStart AND @Date
          AND M.MaterialName = 'OVER BURDEN'
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, Cast(L.LoadingDate as Date)
    ),

    CTE_Combined AS (
        SELECT 
            D.WorkDate,
            D.EquipmentId,
            D.SectorId,
            D.WorkingHr,
            ISNULL(L.Trips, 0) as Trips,
            ISNULL(L.Qty, 0) as Qty
        FROM CTE_Daily_Eq D
        LEFT JOIN CTE_Daily_Loading L ON D.EquipmentId = L.LoadingMachineEquipmentId 
                                      AND D.ShiftId = L.ShiftId 
                                      AND D.WorkDate = L.LDate
    )

    SELECT 
        eq.EquipmentName,
        ISNULL(sec.SectorName, 'Unknown') as SectorName,
        
        -- FTD (For The Day)
        SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) as FTD_WorkingHr,
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) as FTD_Trips,
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) as FTD_Qty,

        -- FTM (For The Month)
        SUM(C.WorkingHr) as FTM_WorkingHr,
        SUM(C.Trips) as FTM_Trips,
        SUM(C.Qty) as FTM_Qty,
        
        @DayOfMonth as DayOfMonth

    FROM CTE_Combined C
    LEFT JOIN [Master].[TblEquipment] eq ON C.EquipmentId = eq.SlNo
    LEFT JOIN [Master].[TblSector] sec ON C.SectorId = sec.SlNo

    GROUP BY eq.EquipmentName, sec.SectorName
    
    ORDER BY eq.EquipmentName;
END
