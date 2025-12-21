CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportEqGroupPerformance]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);

    -- Pre-aggregate Reading (Hours) and Loading (Trips/Qty) by Date/Shift/Eq
    -- We need this level because Loading joins to Reading on Date/Shift/Eq
    WITH CTE_Daily_Eq AS (
        SELECT 
            R.EquipmentId,
            R.ShiftId,
            Cast(R.[Date] as Date) as WorkDate,
            SUM(R.TotalWorkingHr) as WorkingHr,
            Eq.EquipmentGroupId,
            Eq.ActivityId
        FROM [Trans].[TblEquipmentReading] R
        JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
        WHERE R.IsDelete = 0 
          AND Cast(R.[Date] as Date) BETWEEN @MonthStart AND @Date
          AND Eq.ActivityId IN (3, 4, 5) -- Filter specific activities as per user request (Loading etc)
          -- Or should we include all? Sample said "ActivityId=3 or 4 or 5"
        GROUP BY R.EquipmentId, R.ShiftId, Cast(R.[Date] as Date), Eq.EquipmentGroupId, Eq.ActivityId
    ),
    
    CTE_Daily_Loading AS (
        SELECT 
            L.LoadingMachineEquipmentId,
            L.ShiftId,
            Cast(L.LoadingDate as Date) as LDate,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty
        FROM [Trans].[TblLoading] L
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) BETWEEN @MonthStart AND @Date
          AND (L.MaterialId IN (SELECT SlNo FROM [Master].[TblMaterial] WHERE MaterialName IN ('ROM COAL', 'OVER BURDEN', 'TOP SOIL', 'INTER BURDEN'))) -- Filter Materials
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, Cast(L.LoadingDate as Date)
    ),

    CTE_Combined AS (
        SELECT 
            D.WorkDate,
            D.ActivityId,
            D.EquipmentGroupId,
            D.EquipmentId,
            D.WorkingHr,
            ISNULL(L.Trips, 0) as Trips,
            ISNULL(L.Qty, 0) as Qty
        FROM CTE_Daily_Eq D
        LEFT JOIN CTE_Daily_Loading L ON D.EquipmentId = L.LoadingMachineEquipmentId 
                                      AND D.ShiftId = L.ShiftId 
                                      AND D.WorkDate = L.LDate
    )

    SELECT 
        ac.Name as ActivityName,
        eg.Name as EquipmentGroupName,

        -- FTD (For The Date)
        COUNT(DISTINCT CASE WHEN C.WorkDate = @Date AND C.WorkingHr > 0 THEN C.EquipmentId END) as FTD_NoOfEqRn,
        
        SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) as FTD_TotalHrs,
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) as FTD_TotalTrips,
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) as FTD_TotalQty,

        -- FTM (For The Month)
        SUM(C.WorkingHr) as FTM_TotalHrs,
        SUM(C.Trips) as FTM_TotalTrips,
        SUM(C.Qty) as FTM_TotalQty

    FROM CTE_Combined C
    LEFT JOIN [Master].[TblActivity] ac ON C.ActivityId = ac.SlNo
    LEFT JOIN [Master].[TblEquipmentGroup] eg ON C.EquipmentGroupId = eg.SlNo

    GROUP BY ac.Name, eg.Name, ac.SlNo -- added SlNo for deterministic ordering if needed
    
    ORDER BY ac.Name, eg.Name;
END
