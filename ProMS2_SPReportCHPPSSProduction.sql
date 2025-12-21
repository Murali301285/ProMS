CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportCHPPSSProduction]
    @Month DATE, -- Pass first day of month e.g., '2025-12-01'
    @PlantId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATE = @Month;
    DECLARE @EndDate DATE = EOMONTH(@Month);

    -- 1. Get Plant Name
    DECLARE @PlantName NVARCHAR(100);
    SELECT @PlantName = Name FROM [Master].[TblPlant] WHERE SlNo = @PlantId;

    -- 2. Production Data Set
    SELECT 
        Cast(C.[Date] as Date) as WorkDate,
        @PlantName as PlantName,
        SUM(C.ProductionQty) as ProductionQty,
        
        CASE 
             WHEN SUM(C.ProductionQty) > 0 THEN SUM(C.ProductionQty) / 18.9 
             ELSE 0 
        END as TPH_Calculated,
        
        SUM(C.RunningHr) as RunningHr,
        SUM(C.PowerKWH) as PowerKWH,
        
        STRING_AGG(C.Remarks, CHAR(10)) WITHIN GROUP (ORDER BY C.SlNo) as CrusherRemarks
        
    FROM [Trans].[TblCrusher] C
    WHERE C.IsDelete = 0 
      AND C.PlantId = @PlantId
      AND Cast(C.[Date] as Date) BETWEEN @StartDate AND @EndDate
    GROUP BY Cast(C.[Date] as Date);

    -- 3. Stoppage Data Set
    SELECT 
        Cast(C.[Date] as Date) as WorkDate, 
        
        BD.BDReasonName as ReasonName,
        SUM(CS.StoppageHours) as StoppageHours, 
        STRING_AGG(CS.Remarks, CHAR(10)) WITHIN GROUP (ORDER BY CS.SlNo) as StoppageRemarks

    FROM [Trans].[TblCrusher] C
    JOIN [Trans].[TblCrusherStoppage] CS ON CS.CrusherId = C.SlNo
    LEFT JOIN [Master].[TblBDReason] BD ON CS.StoppageId = BD.SlNo
    WHERE C.IsDelete = 0 
      AND CS.IsDelete = 0
      AND C.PlantId = @PlantId
      AND Cast(C.[Date] as Date) BETWEEN @StartDate AND @EndDate
    GROUP BY Cast(C.[Date] as Date), BD.BDReasonName;

    -- 4. All Active Stoppage Reasons (For Table Headers)
    SELECT 
        BDReasonName 
    FROM [Master].[TblBDReason] 
    WHERE IsDelete = 0 
      AND IsActive = 1
    ORDER BY SlNo;

END
