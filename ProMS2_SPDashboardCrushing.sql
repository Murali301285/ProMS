CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPDashboardCrushing]
    @Date DATE,
    @ZoneId INT = NULL, -- Optional Filter
    @PSSId INT = NULL   -- Optional Filter
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);

    -- 1. Crusher Wise Highest Production (Shift, Day, Month)
    
    -- Shift Record
    SELECT TOP 1
        'Shift' as Period,
        C.ShiftId,
        S.ShiftName,
        P.Name as CrusherName,
        SUM(C.ProductionQty) as MaxQty
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND (@ZoneId IS NULL OR P.ZoneId = @ZoneId) -- Assuming Zone link
      AND (@PSSId IS NULL OR P.SlNo = @PSSId)
    GROUP BY C.ShiftId, S.ShiftName, P.Name
    ORDER BY SUM(C.ProductionQty) DESC;

    -- Day Record
    SELECT TOP 1
        'Day' as Period,
        P.Name as CrusherName,
        SUM(C.ProductionQty) as MaxQty
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND (@ZoneId IS NULL OR P.ZoneId = @ZoneId)
      AND (@PSSId IS NULL OR P.SlNo = @PSSId)
    GROUP BY P.Name
    ORDER BY SUM(C.ProductionQty) DESC;

    -- Month Record
    SELECT TOP 1
        'Month' as Period,
        P.Name as CrusherName,
        SUM(C.ProductionQty) as MaxQty
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) >= @MonthStart AND CAST(C.Date AS DATE) <= @Date
      AND (@ZoneId IS NULL OR P.ZoneId = @ZoneId)
      AND (@PSSId IS NULL OR P.SlNo = @PSSId)
    GROUP BY P.Name
    ORDER BY SUM(C.ProductionQty) DESC;

    -- 2. Stoppage Reason Wise Analysis
    SELECT 
        BD.BDReasonName as Reason,
        COUNT(*) as Frequency,
        SUM(CS.StoppageHours) as TotalDuration,
        P.Name as CrusherName
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblBDReason] BD ON CS.StoppageId = BD.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND (@ZoneId IS NULL OR P.ZoneId = @ZoneId)
      AND (@PSSId IS NULL OR P.SlNo = @PSSId)
    GROUP BY BD.BDReasonName, P.Name
    ORDER BY TotalDuration DESC;

END
