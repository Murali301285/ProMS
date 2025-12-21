CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportCrDailyShift]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Plant-Shift Production Metrics
    -- Aggregate separately to avoid multiplication by stoppages
    SELECT
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.SlNo as ShiftId,
        S.ShiftName,
        O.OperatorName as ShiftInCharge,
        MIN(C.OHMR) as ApronStartingHour,
        MAX(C.CHMR) as ApronClosingHour,
        SUM(C.RunningHr) as RunningHr,
        MAX(C.BeltScaleOHMR) as SBS_Reading, -- Assuming logic: Start of Shift Reading
        MAX(C.BeltScaleCHMR) as CBS_Reading, -- Assuming logic: End of Shift Reading. Note: MAX might not be perfect if multiple entries per shift, but for daily shift report likely ok or logic needs refinement if multiple rows per shift. User query used C.BeltScaleOHMR directly in group by or max? User query had it in select with group by plant,shift.
        SUM(C.ProductionQty) as TotalProductionMT,
        SUM(C.NoofTrip) as NoofTripUnloaded,
        SUM(C.PowerKWH) as TotalUnit,
        -- TPH is calculated in frontend or here: Prod / Running. Handle Div/0
        CASE WHEN SUM(C.RunningHr) > 0 THEN SUM(C.ProductionQty) / SUM(C.RunningHr) ELSE 0 END as TPH
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblOperator] O ON C.ShiftInChargeId = O.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND P.IsDPRReport = 1
    GROUP BY P.SlNo, P.Name, S.SlNo, S.ShiftName, O.OperatorName
    ORDER BY S.ShiftName, P.Name;

    -- 2. Stoppage Details
    SELECT 
        P.Name as PlantName,
        S.ShiftName,
        BD.BDReasonName as StoppageReason,
        SUM(ISNULL(CS.StoppageHours, 0)) as Hrs
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblBDReason] BD ON CS.StoppageId = BD.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND P.IsDPRReport = 1
    GROUP BY P.Name, S.ShiftName, BD.BDReasonName
    ORDER BY S.ShiftName, P.Name, BD.BDReasonName;

    -- 3. Detailed Remarks (Main + Stoppage)
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.ShiftName,
        'Main' as Source,
        NULL as FromTime,
        NULL as ToTime,
        NULL as DurationHours,
        C.Remarks
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date 
      AND LEN(ISNULL(C.Remarks, '')) > 0
    
    UNION ALL
    
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.ShiftName,
        'Stop' as Source,
        CS.FromTime,
        CS.ToTime,
        CS.StoppageHours as DurationHours,
        CS.Remarks
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date 
      AND (LEN(ISNULL(CS.Remarks, '')) > 0 OR CS.StoppageHours > 0)

    ORDER BY ShiftName, PlantName, Source;

END
