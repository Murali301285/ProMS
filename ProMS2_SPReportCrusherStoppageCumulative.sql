CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportCrusherStoppageCumulative]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Plant Metrics (HMR, Running, Units)
    -- Group by Plant to get one row per plant for the day
    -- Note: If multiple shifts exist, we sum RunningHr, but OHMR/CHMR need logic.
    -- Usually OHMR is Min(OHMR) of first shift, CHMR is Max(CHMR) of last shift.
    
    ;WITH StoppageSummary AS (
        SELECT 
            CS.CrusherId,
            STRING_AGG(CS.Remarks, ', ') WITHIN GROUP (ORDER BY CS.SlNo) as AggStoppageRemarks
        FROM [Trans].[TblCrusherStoppage] CS
        WHERE CS.Remarks IS NOT NULL AND CS.Remarks <> ''
        GROUP BY CS.CrusherId
    ),
    DailyData AS (
        SELECT 
            C.PlantId,
            MIN(C.OHMR) as StartingHour,
            MAX(C.CHMR) as ClosingHour,
            SUM(C.RunningHr) as RunningHr,
            SUM(C.PowerKWH) as TotalUnit,
            STRING_AGG(
                ISNULL(NULLIF(C.Remarks, ''), '') + 
                CASE WHEN SS.AggStoppageRemarks IS NOT NULL THEN ' [Stop: ' + SS.AggStoppageRemarks + ']' ELSE '' END
            , ' | ') WITHIN GROUP (ORDER BY C.SlNo) as AllRemarks
        FROM [Trans].[TblCrusher] C
        LEFT JOIN StoppageSummary SS ON C.SlNo = SS.CrusherId
        WHERE C.IsDelete = 0 
          AND CAST(C.Date AS DATE) = @Date
        GROUP BY C.PlantId
    )
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        ISNULL(D.StartingHour, 0) as StartingHour,
        ISNULL(D.ClosingHour, 0) as ClosingHour,
        ISNULL(D.RunningHr, 0) as RunningHr,
        ISNULL(D.TotalUnit, 0) as TotalUnit,
        24.00 as TotalShiftHour,
        ISNULL(D.AllRemarks, '') as Remarks
    FROM [Master].[TblPlant] P
    LEFT JOIN DailyData D ON P.SlNo = D.PlantId
    WHERE P.IsDPRReport = 1 AND P.IsActive = 1
    ORDER BY P.SlNo;

    -- 2. Stoppage Details (Pivot Ready)
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        BD.BDReasonName as StoppageReason,
        SUM(ISNULL(CS.StoppageHours, 0)) as Hrs
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblBDReason] BD ON CS.StoppageId = BD.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND P.IsDPRReport = 1
    GROUP BY P.SlNo, P.Name, BD.BDReasonName
    ORDER BY P.Name, BD.BDReasonName;

    -- 3. Detailed Remarks List
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        'Main' as Source,
        NULL as FromTime,
        NULL as ToTime,
        NULL as DurationHours,
        C.Remarks
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date 
      AND LEN(ISNULL(C.Remarks, '')) > 0
    
    UNION ALL
    
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        'Stop' as Source,
        CS.FromTime,
        CS.ToTime,
        CS.StoppageHours as DurationHours,
        CS.Remarks
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date 
      -- Include even if remarks are empty if there is a time? User said "time... - Reason". Maybe filter by time? 
      -- But let's stick to generic: only if interesting. 
      -- Actually, user requirement: "time 12:30 to 12:45 total 15 minutes - No feed". 
      -- So we should include it if StoppageHours > 0 OR Remarks exist.
      AND (LEN(ISNULL(CS.Remarks, '')) > 0 OR CS.StoppageHours > 0)

    ORDER BY PlantName, Source;

END
