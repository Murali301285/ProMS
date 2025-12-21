CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportDayWiseProduction]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @MonthEnd DATE = EOMONTH(@Date);

    -- 1. Generate Calendar for the Month
    WITH DateRange(WorkDate) AS 
    (
        SELECT @MonthStart
        UNION ALL
        SELECT DATEADD(d, 1, WorkDate)
        FROM DateRange
        WHERE WorkDate < @MonthEnd
    ),

    -- 2. Coal Production
    CTE_Coal AS (
        SELECT 
            Cast([LoadingDate] as Date) as LDate,
            SUM([TotalQty]) as Qty
        FROM [Trans].[TblLoading] L
        LEFT JOIN [Master].[TblMaterial] M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) BETWEEN @MonthStart AND @MonthEnd
          AND M.MaterialName = 'ROM COAL'
        GROUP BY Cast([LoadingDate] as Date)
    ),

    -- 3. OB Production
    CTE_OB AS (
        SELECT 
            Cast([LoadingDate] as Date) as LDate,
            SUM([TotalQty]) as Qty
        FROM [Trans].[TblLoading] L
        LEFT JOIN [Master].[TblMaterial] M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) BETWEEN @MonthStart AND @MonthEnd
          AND M.MaterialName = 'OVER BURDEN'
        GROUP BY Cast([LoadingDate] as Date)
    ),

    -- 4. Dispatch
    CTE_Dispatch AS (
        SELECT 
            Cast([Date] as Date) as DDate,
            SUM([TotalQty]) as Qty
        FROM [Trans].[TblDispatchEntry] D
        WHERE D.IsDelete = 0 
          AND Cast(D.[Date] as Date) BETWEEN @MonthStart AND @MonthEnd
        GROUP BY Cast([Date] as Date)
    )

    -- 5. Final Join
    SELECT 
        D.WorkDate as Date,
        ISNULL(C.Qty, 0) as Coal_MT,
        ISNULL(O.Qty, 0) as OB_BCM,
        ISNULL(DP.Qty, 0) as Dispatch_MT,
        
        -- Total Production = OB + (Coal * 0.65)
        (ISNULL(O.Qty, 0) + (ISNULL(C.Qty, 0) * 0.65)) as TotalProduction_BCM

    FROM DateRange D
    LEFT JOIN CTE_Coal C ON D.WorkDate = C.LDate
    LEFT JOIN CTE_OB O ON D.WorkDate = O.LDate
    LEFT JOIN CTE_Dispatch DP ON D.WorkDate = DP.DDate

    ORDER BY D.WorkDate
    OPTION (MAXRECURSION 31); -- Handle up to 31 days recursion
END
