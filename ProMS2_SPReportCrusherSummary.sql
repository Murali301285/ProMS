CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportCrusherSummary]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Calculate Date Ranges
    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @FyYear INT = CASE WHEN MONTH(@Date) < 4 THEN YEAR(@Date) - 1 ELSE YEAR(@Date) END;
    DECLARE @FyStart DATE = DATEFROMPARTS(@FyYear, 4, 1);

    -- 2. Result Set 1: Daily Production (Details per Plant & Shift)
    SELECT 
        CAST(C.Date AS DATE) as Date,
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.ShiftName,
        ISNULL(SUM(C.ProductionQty), 0) as ProductionQty,
        ISNULL(SUM(C.RunningHr), 0) as RunningHr
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND P.IsDPRReport = 1
    GROUP BY C.Date, P.SlNo, P.Name, S.ShiftName, S.SlNo
    ORDER BY P.SlNo, S.SlNo;

    -- 3. Result Set 2: Cumulative Production (FTM & YTD)
    SELECT 
        P.SlNo as PlantId,
        ISNULL(SUM(CASE WHEN CAST(C.Date AS DATE) BETWEEN @MonthStart AND @Date THEN C.ProductionQty ELSE 0 END), 0) as ProdFTM,
        ISNULL(SUM(CASE WHEN CAST(C.Date AS DATE) BETWEEN @FyStart AND @Date THEN C.ProductionQty ELSE 0 END), 0) as ProdYTD
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) <= @Date
      AND CAST(C.Date AS DATE) >= @FyStart
      AND P.IsDPRReport = 1
    GROUP BY P.SlNo;

    -- 4. Result Set 3: Stoppages for the Day
    SELECT 
        P.SlNo as PlantId,
        ISNULL(SUM(CS.StoppageHours), 0) as TotalStopHrs,
        STRING_AGG(CS.StoppageRemarks, ' | ') as StopRemarks
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND P.IsDPRReport = 1
    GROUP BY P.SlNo;

    -- 5. Result Set 4: HMR & BSR Metrics (Optimized CTE)
    ;WITH MonthData AS (
        SELECT 
            PlantId, 
            OHMR, 
            CHMR, 
            BeltScaleOHMR, 
            BeltScaleCHMR,
            ROW_NUMBER() OVER(PARTITION BY PlantId ORDER BY Date ASC, ShiftId ASC) as AscRow,
            ROW_NUMBER() OVER(PARTITION BY PlantId ORDER BY Date DESC, ShiftId DESC) as DescRow
        FROM [Trans].[TblCrusher]
        WHERE IsDelete = 0 
          AND CAST(Date AS DATE) >= @MonthStart 
          AND CAST(Date AS DATE) <= @Date
    )
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        
        -- Start of Month (First Record)
        ISNULL(MIN(CASE WHEN M.AscRow = 1 THEN M.OHMR END), 0) as MonthStartingHMR,
        ISNULL(MIN(CASE WHEN M.AscRow = 1 THEN M.BeltScaleOHMR END), 0) as MonthStartingBSR,
        
        -- End of Period (Last Record)
        ISNULL(MAX(CASE WHEN M.DescRow = 1 THEN M.CHMR END), 0) as AsonDateClosingHMR,
        ISNULL(MAX(CASE WHEN M.DescRow = 1 THEN M.BeltScaleCHMR END), 0) as AsonDateClosingBSR,
        
        0 as BudgetFTM

    FROM [Master].[TblPlant] P
    LEFT JOIN MonthData M ON P.SlNo = M.PlantId
    WHERE P.IsDPRReport = 1 AND P.IsActive = 1
    GROUP BY P.SlNo, P.Name;

END
