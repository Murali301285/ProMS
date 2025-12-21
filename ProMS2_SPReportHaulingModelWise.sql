CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportHaulingModelWise]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @ReportEnd DATE = @Date; 

    -- 1. Get Readings (Hours)
    WITH CTE_Reading AS (
        SELECT 
            Cast(R.[Date] as Date) as WorkDate,
            R.EquipmentId,
            SUM(R.TotalWorkingHr) as WorkingHr
        FROM [Trans].[TblEquipmentReading] R
        JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
        WHERE R.IsDelete = 0 
          AND Eq.ActivityId = 4 -- Hauling
          AND Cast(R.[Date] as Date) BETWEEN @MonthStart AND @ReportEnd
        GROUP BY Cast(R.[Date] as Date), R.EquipmentId
    ),

    -- 2. Get Loading (Trips/Qty) - USING HAULER ID
    CTE_Loading AS (
        SELECT 
            Cast(L.LoadingDate as Date) as LDate,
            L.HaulerEquipmentId as EquipmentId, -- FIXED: Use Hauler ID for Dumper Report
            CASE 
                WHEN M.MaterialName IN ('ROM COAL') THEN 'Coal'
                WHEN M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN') THEN 'OB'
                ELSE 'Other'
            END as MaterialCategory,
            
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty

        FROM [Trans].[TblLoading] L
        LEFT JOIN [Master].[TblMaterial] M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) BETWEEN @MonthStart AND @ReportEnd
          -- Only include rows where we have a valide Hauler? Or just group all. 
          -- If HaulerId is null, it's irrelevant for this report.
        GROUP BY Cast(L.LoadingDate as Date), L.HaulerEquipmentId, 
                 CASE 
                    WHEN M.MaterialName IN ('ROM COAL') THEN 'Coal'
                    WHEN M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN') THEN 'OB'
                    ELSE 'Other'
                 END
    )

    -- 3. Combine
    SELECT 
        R.WorkDate as Date,
        EG.Name as ModelName,
        ISNULL(L.MaterialCategory, 'Sort_Unmapped') as MaterialCategory,
        SUM(L.Trips) as TotalTrips,
        SUM(L.Qty) as TotalQty,
        SUM(R.WorkingHr) as TotalHrs

    FROM CTE_Reading R
    JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
    JOIN [Master].[TblEquipmentGroup] EG ON Eq.EquipmentGroupId = EG.SlNo
    LEFT JOIN CTE_Loading L ON R.EquipmentId = L.EquipmentId AND R.WorkDate = L.LDate
    
    WHERE Eq.ActivityId = 4 
    AND (L.MaterialCategory IN ('Coal', 'OB')) -- Filter mainly to drop unmapped
    
    GROUP BY R.WorkDate, EG.Name, L.MaterialCategory
    ORDER BY EG.Name, R.WorkDate;
END
