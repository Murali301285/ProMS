CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportDailyProgress]
	@date DATE = NULL
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

   


DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
DECLARE @StartOfNextMonth DATE = DATEADD(month, 1, @StartOfMonth);
DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@Date), 1, 1);

------------------------------------------------------------------------------------
-- Production Details 
------------------------------------------------------------------------------------

DROP TABLE IF EXISTS #TempProduction;
CREATE TABLE #TempProduction ( SlNo INT, MaterialName VARCHAR(100), Unit VARCHAR(50), DayTrip INT DEFAULT(0), DayQty DECIMAL(18, 2) DEFAULT(0), MonthTrip INT DEFAULT(0), MonthQty DECIMAL(18, 2) DEFAULT(0), YearTrip INT DEFAULT(0), YearQty DECIMAL(18, 2) DEFAULT(0), orderno INT );
INSERT INTO #TempProduction (SlNo, MaterialName, Unit, orderno) VALUES (7, 'ROM COAL', 'MT', 1), (1, 'TOP SOIL', 'BCM', 2), (2, 'OVER BURDEN', 'BCM', 3), (3, 'INTER BURDEN', 'BCM', 4);

WITH ProductionTotals AS (
    SELECT MaterialId,
        SUM(CASE WHEN CAST(LoadingDate AS DATE) = @Date THEN [NoofTrip] ELSE 0 END) AS DayTrip,
        SUM(CASE WHEN CAST(LoadingDate AS DATE) = @Date THEN [TotalQty] ELSE 0 END) AS DayQty,
        SUM(CASE WHEN LoadingDate >= @StartOfMonth AND LoadingDate < @StartOfNextMonth THEN [NoofTrip] ELSE 0 END) AS MonthTrip,
        SUM(CASE WHEN LoadingDate >= @StartOfMonth AND LoadingDate < @StartOfNextMonth THEN [TotalQty] ELSE 0 END) AS MonthQty,
        SUM([NoofTrip]) AS YearTrip, SUM([TotalQty]) AS YearQty
    FROM  [Trans].[TblLoading] WHERE LoadingDate >= @StartOfYear AND IsDelete = 0 GROUP BY MaterialId
)
UPDATE T SET T.DayTrip = ISNULL(S.DayTrip, 0), T.DayQty = ISNULL(S.DayQty, 0), T.MonthTrip = ISNULL(S.MonthTrip, 0), T.MonthQty = ISNULL(S.MonthQty, 0), T.YearTrip = ISNULL(S.YearTrip, 0), T.YearQty = ISNULL(S.YearQty, 0)
FROM #TempProduction T LEFT JOIN ProductionTotals S ON T.SlNo = S.MaterialId;

INSERT INTO #TempProduction SELECT 0, 'TOTAL WASTE', 'BCM', SUM(DayTrip), SUM(DayQty), SUM(MonthTrip), SUM(MonthQty), SUM(YearTrip), SUM(YearQty), 6 FROM #TempProduction WHERE Unit = 'BCM';

WITH FinalCalcs AS (
    SELECT SUM(CASE WHEN Unit = 'MT' THEN DayQty ELSE 0 END) / 1.55 AS CoalDayQty, SUM(CASE WHEN Unit = 'MT' THEN MonthQty ELSE 0 END) / 1.55 AS CoalMonthQty, SUM(CASE WHEN Unit = 'MT' THEN YearQty ELSE 0 END) / 1.55 AS CoalYearQty,
        SUM(CASE WHEN Unit = 'BCM' AND orderno < 5 THEN DayQty ELSE 0 END) AS WasteDayQty, SUM(CASE WHEN Unit = 'BCM' AND orderno < 5 THEN MonthQty ELSE 0 END) AS WasteMonthQty, SUM(CASE WHEN Unit = 'BCM' AND orderno < 5 THEN YearQty ELSE 0 END) AS WasteYearQty,
        SUM(CASE WHEN orderno < 5 THEN DayTrip END) AS TotalDayTrip, SUM(CASE WHEN orderno < 5 THEN MonthTrip END) AS TotalMonthTrip, SUM(CASE WHEN orderno < 5 THEN YearTrip END) AS TotalYearTrip
    FROM #TempProduction
)
INSERT INTO #TempProduction (SlNo, MaterialName, Unit, DayTrip, DayQty, MonthTrip, MonthQty, YearTrip, YearQty, orderno)
SELECT 0, 'TOTAL EXCAVATION', 'BCM (MT/1.55)', TotalDayTrip, CoalDayQty + WasteDayQty, TotalMonthTrip, CoalMonthQty + WasteMonthQty, TotalYearTrip, CoalYearQty + WasteYearQty, 7 FROM FinalCalcs;

SELECT ROW_NUMBER() OVER (ORDER BY orderno) AS SlNo, MaterialName, Unit,
    FORMAT(DayTrip, 'N0', 'en-IN') AS DayTrip, FORMAT(DayQty, 'N2', 'en-IN') AS DayQty,
    FORMAT(MonthTrip, 'N0', 'en-IN') AS MonthTrip, FORMAT(MonthQty, 'N2', 'en-IN') AS MonthQty,
    FORMAT(YearTrip, 'N0', 'en-IN') AS YearTrip, FORMAT(YearQty, 'N2', 'en-IN') AS YearQty
FROM #TempProduction;

------------------------------------------------------------------------------------
-- Drilling Details
------------------------------------------------------------------------------------

DROP TABLE IF EXISTS #TempDrilling;
CREATE TABLE #TempDrilling ( SlNo INT, MaterialName VARCHAR(100), Unit VARCHAR(50), Holes_FTD INT DEFAULT(0), Holes_MTD INT DEFAULT(0), Holes_YTD INT DEFAULT(0), Drilling_FTD DECIMAL(18, 2) DEFAULT(0), Drilling_MTD DECIMAL(18, 2) DEFAULT(0), Drilling_YTD DECIMAL(18, 2) DEFAULT(0), Hrs_FTD DECIMAL(18, 2) DEFAULT(0), Hrs_MTD DECIMAL(18, 2) DEFAULT(0), Hrs_YTD DECIMAL(18, 2) DEFAULT(0) );

WITH DrillingData AS (
    SELECT D.MaterialId,
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.NoofHoles ELSE 0 END) AS Holes_FTD,
        SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN D.NoofHoles ELSE 0 END) AS Holes_MTD,
        SUM(D.NoofHoles) AS Holes_YTD,
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.TotalMeters ELSE 0 END) AS Drilling_FTD,
        SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN D.TotalMeters ELSE 0 END) AS Drilling_MTD,
        SUM(D.TotalMeters) AS Drilling_YTD,
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN ER.TotalWorkingHr ELSE 0 END) AS Hrs_FTD,
        SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN ER.TotalWorkingHr ELSE 0 END) AS Hrs_MTD,
        SUM(ER.TotalWorkingHr) AS Hrs_YTD
    FROM  [Trans].[TblDrilling] AS D
    LEFT JOIN  [Trans].[TblEquipmentReading] AS ER
        ON D.EquipmentId = ER.EquipmentId AND ER.ActivityId = 7 AND ER.IsDelete = 0
    WHERE D.Date >= @StartOfYear AND D.IsDelete = 0 GROUP BY D.MaterialId
)
INSERT INTO #TempDrilling (SlNo, MaterialName, Unit, Holes_FTD, Holes_MTD, Holes_YTD, Drilling_FTD, Drilling_MTD, Drilling_YTD, Hrs_FTD, Hrs_MTD, Hrs_YTD)
SELECT DD.MaterialId, M.MaterialName, U.Name,
    ISNULL(DD.Holes_FTD, 0), ISNULL(DD.Holes_MTD, 0), ISNULL(DD.Holes_YTD, 0),
    ISNULL(DD.Drilling_FTD, 0), ISNULL(DD.Drilling_MTD, 0), ISNULL(DD.Drilling_YTD, 0),
    ISNULL(DD.Hrs_FTD, 0), ISNULL(DD.Hrs_MTD, 0), ISNULL(DD.Hrs_YTD, 0)
FROM DrillingData DD JOIN [Master].[TblMaterial] AS M ON DD.MaterialId = M.SlNo JOIN [Master].[tblunit] AS U ON M.UnitId = U.SlNo;

SELECT ROW_NUMBER() OVER (ORDER BY MaterialName DESC) AS SlNo, MaterialName AS MaterialType,
    FORMAT(Holes_FTD, 'N0', 'en-IN') AS Holes_FTD, FORMAT(Holes_MTD, 'N0', 'en-IN') AS Holes_MTD, FORMAT(Holes_YTD, 'N0', 'en-IN') AS Holes_YTD,
    FORMAT(Drilling_FTD, 'N2', 'en-IN') AS Drilling_FTD, FORMAT(Drilling_MTD, 'N2', 'en-IN') AS Drilling_MTD, FORMAT(Drilling_YTD, 'N2', 'en-IN') AS Drilling_YTD,
    FORMAT(Hrs_FTD, 'N2', 'en-IN') AS Hrs_FTD, FORMAT(Hrs_MTD, 'N2', 'en-IN') AS Hrs_MTD, FORMAT(Hrs_YTD, 'N2', 'en-IN') AS Hrs_YTD
FROM #TempDrilling;

------------------------------------------------------------------------------------
-- Blasting Details 
------------------------------------------------------------------------------------

DROP TABLE IF EXISTS #TempDrillingBlasting;
CREATE TABLE #TempDrillingBlasting ( SlNo INT, MaterialName VARCHAR(100), Holes_FTD INT DEFAULT(0), Holes_MTD INT DEFAULT(0), Holes_YTD INT DEFAULT(0), Exp_FTD DECIMAL(18, 2) DEFAULT(0), Exp_MTD DECIMAL(18, 2) DEFAULT(0), Exp_YTD DECIMAL(18, 2) DEFAULT(0), TotalVolume_FTD DECIMAL(18, 2) DEFAULT(0), TotalVolume_MTD DECIMAL(18, 2) DEFAULT(0), TotalVolume_YTD DECIMAL(18, 2) DEFAULT(0), PowderFactor_FTD DECIMAL(18, 2) DEFAULT(0), PowderFactor_MTD DECIMAL(18, 2) DEFAULT(0), PowderFactor_YTD DECIMAL(18, 2) DEFAULT(0) );

WITH BlastingData AS (
    SELECT D.MaterialId, M.MaterialName,
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.NoofHoles ELSE 0 END) AS Holes_FTD, SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN D.NoofHoles ELSE 0 END) AS Holes_MTD, SUM(D.NoofHoles) AS Holes_YTD,
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_FTD, SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_MTD, SUM(B.TotalExplosiveUsed) AS Exp_YTD,
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN (D.[TotalMeters] * D.[Spacing] * D.[Burden] * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS TotalVolume_FTD,
        SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN (D.[TotalMeters] * D.[Spacing] * D.[Burden] * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS TotalVolume_MTD,
        SUM(D.[TotalMeters] * D.[Spacing] * D.[Burden] * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) AS TotalVolume_YTD
    FROM  [Trans].[TblDrilling] D JOIN [Master].[TblMaterial] AS M ON D.MaterialId = M.SlNo LEFT JOIN [Trans].[TblBlasting] AS B ON D.DrillingPatchId = B.BlastingPatchId AND B.IsDelete = 0
    WHERE D.Date >= @StartOfYear AND D.IsDelete = 0 GROUP BY D.MaterialId, M.MaterialName
)
INSERT INTO #TempDrillingBlasting ( SlNo, MaterialName, Holes_FTD, Holes_MTD, Holes_YTD, Exp_FTD, Exp_MTD, Exp_YTD, TotalVolume_FTD, TotalVolume_MTD, TotalVolume_YTD, PowderFactor_FTD, PowderFactor_MTD, PowderFactor_YTD )
SELECT MaterialId, MaterialName, Holes_FTD, Holes_MTD, Holes_YTD, Exp_FTD, Exp_MTD, Exp_YTD, TotalVolume_FTD, TotalVolume_MTD, TotalVolume_YTD,
    IIF(Exp_FTD > 0, TotalVolume_FTD / Exp_FTD, 0) AS PowderFactor_FTD, IIF(Exp_MTD > 0, TotalVolume_MTD / Exp_MTD, 0) AS PowderFactor_MTD, IIF(Exp_YTD > 0, TotalVolume_YTD / Exp_YTD, 0) AS PowderFactor_YTD
FROM BlastingData;

SELECT ROW_NUMBER() OVER (ORDER BY MaterialName DESC) AS SlNo,
    FORMAT(Holes_FTD, 'N0', 'en-IN') AS Holes_FTD, FORMAT(Holes_MTD, 'N0', 'en-IN') AS Holes_MTD, FORMAT(Holes_YTD, 'N0', 'en-IN') AS Holes_YTD,
    FORMAT(Exp_FTD, 'N2', 'en-IN') AS Exp_FTD, FORMAT(Exp_MTD, 'N2', 'en-IN') AS Exp_MTD, FORMAT(Exp_YTD, 'N2', 'en-IN') AS Exp_YTD,
    FORMAT(TotalVolume_FTD, 'N2', 'en-IN') AS TotalVolume_FTD, FORMAT(TotalVolume_MTD, 'N2', 'en-IN') AS TotalVolume_MTD, FORMAT(TotalVolume_YTD, 'N2', 'en-IN') AS TotalVolume_YTD,
    FORMAT(PowderFactor_FTD, 'N2', 'en-IN') AS PowderFactor_FTD, FORMAT(PowderFactor_MTD, 'N2', 'en-IN') AS PowderFactor_MTD, FORMAT(PowderFactor_YTD, 'N2', 'en-IN') AS PowderFactor_YTD
FROM #TempDrillingBlasting;

------------------------------------------------------------------------------------
-- Crusher Details
------------------------------------------------------------------------------------

DROP TABLE IF EXISTS #TempCrusher;
CREATE TABLE #TempCrusher ( plantid INT, plantname VARCHAR(50), Hrs_FTD DECIMAL(18, 2) DEFAULT(0), Hrs_MTD DECIMAL(18, 2) DEFAULT(0), Hrs_YTD DECIMAL(18, 2) DEFAULT(0), Qty_FTD DECIMAL(18, 2) DEFAULT(0), Qty_MTD DECIMAL(18, 2) DEFAULT(0), Qty_YTD DECIMAL(18, 2) DEFAULT(0), KWH_FTD DECIMAL(18, 2) DEFAULT(0), KWH_MTD DECIMAL(18, 2) DEFAULT(0), KWH_YTD DECIMAL(18, 2) DEFAULT(0), KWH_HR_FTD DECIMAL(18, 2) DEFAULT(0), KWH_HR_MTD DECIMAL(18, 2) DEFAULT(0), KWH_HR_YTD DECIMAL(18, 2) DEFAULT(0) );

WITH CrusherData AS (
    SELECT PlantId,
        SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN [RunningHr] ELSE 0 END) AS Hrs_FTD,
        SUM(CASE WHEN Date >= @StartOfMonth AND Date < @StartOfNextMonth THEN [RunningHr] ELSE 0 END) AS Hrs_MTD, SUM([RunningHr]) AS Hrs_YTD,
        SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN [TotalQty] ELSE 0 END) AS Qty_FTD,
        SUM(CASE WHEN Date >= @StartOfMonth AND Date < @StartOfNextMonth THEN [TotalQty] ELSE 0 END) AS Qty_MTD, SUM([TotalQty]) AS Qty_YTD,
        SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN [PowerKWH] ELSE 0 END) AS KWH_FTD,
        SUM(CASE WHEN Date >= @StartOfMonth AND Date < @StartOfNextMonth THEN [PowerKWH] ELSE 0 END) AS KWH_MTD, SUM([PowerKWH]) AS KWH_YTD
    FROM  [Trans].[TblCrusher] WHERE Date >= @StartOfYear AND IsDelete = 0 GROUP BY PlantId
)
INSERT INTO #TempCrusher ( plantid, plantname, Hrs_FTD, Hrs_MTD, Hrs_YTD, Qty_FTD, Qty_MTD, Qty_YTD, KWH_FTD, KWH_MTD, KWH_YTD, KWH_HR_FTD, KWH_HR_MTD, KWH_HR_YTD )
SELECT P.SlNo, P.Name,
    ISNULL(CD.Hrs_FTD, 0), ISNULL(CD.Hrs_MTD, 0), ISNULL(CD.Hrs_YTD, 0),
    ISNULL(CD.Qty_FTD, 0), ISNULL(CD.Qty_MTD, 0), ISNULL(CD.Qty_YTD, 0),
    ISNULL(CD.KWH_FTD, 0), ISNULL(CD.KWH_MTD, 0), ISNULL(CD.KWH_YTD, 0),
    
    IIF(ISNULL(CD.Hrs_FTD, 0) > 0, ISNULL(CD.KWH_FTD, 0) / CD.Hrs_FTD, 0),
    IIF(ISNULL(CD.Hrs_MTD, 0) > 0, ISNULL(CD.KWH_MTD, 0) / CD.Hrs_MTD, 0),
    IIF(ISNULL(CD.Hrs_YTD, 0) > 0, ISNULL(CD.KWH_YTD, 0) / CD.Hrs_YTD, 0)
FROM Master.TblPlant P
LEFT JOIN CrusherData CD ON P.SlNo = CD.PlantId
WHERE P.IsDelete = 0 AND P.IsDPRReport = 1;

SELECT ROW_NUMBER() OVER (ORDER BY plantname DESC) AS SlNo, plantname AS Plant,
    FORMAT(Hrs_FTD, 'N2', 'en-IN') AS Hrs_FTD, FORMAT(Hrs_MTD, 'N2', 'en-IN') AS Hrs_MTD, FORMAT(Hrs_YTD, 'N2', 'en-IN') AS Hrs_YTD,
   
    FORMAT(Qty_FTD, 'N0', 'en-IN') AS Qty_FTD, FORMAT(Qty_MTD, 'N0', 'en-IN') AS Qty_MTD, FORMAT(Qty_YTD, 'N0', 'en-IN') AS Qty_YTD,
    FORMAT(KWH_FTD, 'N2', 'en-IN') AS KWH_FTD, FORMAT(KWH_MTD, 'N2', 'en-IN') AS KWH_MTD, FORMAT(KWH_YTD, 'N2', 'en-IN') AS KWH_YTD,
    FORMAT(KWH_HR_FTD, 'N2', 'en-IN') AS KWH_HR_FTD, FORMAT(KWH_HR_MTD, 'N2', 'en-IN') AS KWH_HR_MTD, FORMAT(KWH_HR_YTD, 'N2', 'en-IN') AS KWH_HR_YTD
FROM #TempCrusher;

SELECT 'PRODUCTION DETAILS' AS ProductionHeading,'DRILLING DETAILS' AS DrillingHeading,'BLASTING DETAILS' AS BlastingHeading,'CRUSHER PRODUCTION' AS CrusherHeading,FORMAT(@date,'dd-MM-yyyy') as Date,'' as Logo;


END
