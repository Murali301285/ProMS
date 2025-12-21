CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportDailyProduction]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Date Definitions
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@Date), 1, 1);
    DECLARE @StartOfNextMonth DATE = DATEADD(MONTH, 1, @StartOfMonth);
    DECLARE @RefDate DATE = @Date;

    -- SECTION A: Shift Production (COAL)
    -- Using Management Qty (TotalQty)
    SELECT
        CAST([LoadingDate] AS DATE) AS Date,
        MAX(s.ShiftName) as ShiftName,
        MAX(mt.MaterialName) as MaterialName,
        sl.Name as Scale,
        SUM([NoofTrip]) as Trip,
        SUM([QtyTrip]) as mngTripQty, -- Not strictly used in pivot but good for ref
        SUM([TotalQty]) as mngQty,    -- Management Qty
        SUM([NtpcQtyTrip]) as ntpcTrip,
        SUM([TotalNtpcQty]) as ntpcTotalQty
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] AS Eq ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblShift] AS s ON L.ShiftId = s.SlNo
    LEFT JOIN [Master].[TblMaterial] AS mt ON L.MaterialId = mt.SlNo
    LEFT JOIN [Master].TblScale AS sl ON eq.ScaleId = sl.SlNo
    WHERE L.IsDelete = 0 
      AND L.MaterialId = 7 -- ROM COAL
      AND CAST([LoadingDate] AS DATE) = @RefDate
    GROUP BY CAST([LoadingDate] AS DATE), sl.Name, s.ShiftName;

    -- SECTION A: Shift Production (WASTE)
    SELECT
        CAST([LoadingDate] AS DATE) AS Date,
        MAX(s.ShiftName) as ShiftName,
        'WASTE' as MaterialName,
        sl.Name as Scale,
        SUM([NoofTrip]) as Trip,
        SUM([QtyTrip]) as mngTripQty,
        SUM([TotalQty]) as mngQty, -- Management Qty
        SUM([NtpcQtyTrip]) as ntpcTrip,
        SUM([TotalNtpcQty]) as ntpcTotalQty
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] AS Eq ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblShift] AS s ON L.ShiftId = s.SlNo
    LEFT JOIN [Master].[TblMaterial] AS mt ON L.MaterialId = mt.SlNo
    LEFT JOIN [Master].TblScale AS sl ON eq.ScaleId = sl.SlNo
    WHERE L.IsDelete = 0 
      AND mt.MaterialName NOT IN ('ROM COAL', 'CRUSHED COAL')
      AND CAST([LoadingDate] AS DATE) = @RefDate
    GROUP BY CAST([LoadingDate] AS DATE), sl.Name, s.ShiftName;

    -- SECTION B: TRIP-QUANTITY DETAILS (FTD / MTD / YTD) - COAL
    -- Group by Material Name (e.g. ROM Coal) or Breakdown if needed. 
    -- User image shows breakdown by Scale (Large Scale / Mid Scale) for Coal section B?
    -- Actually user image for Section B Coal shows: "Large Scale", "Mid Scale".
    -- Let's group by Scale for Coal as well in Section B, similar to Waste.
    
    WITH CoalData AS (
        SELECT 
            sl.Name as Scale, -- Grouping by Scale to match 'Large Scale', 'Mid Scale' rows
            -- FTD
            SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_FTD,
            SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_FTD,
            -- MTD
            SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_MTD,
            SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_MTD,
            -- YTD
            SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_YTD,
            SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_YTD
        FROM [Trans].[TblLoading] L
        LEFT JOIN [Master].[TblEquipment] AS Eq ON L.HaulerEquipmentId = Eq.SlNo
        LEFT JOIN [Master].TblScale AS sl ON eq.ScaleId = sl.SlNo
        WHERE L.IsDelete = 0 
          AND L.MaterialId = 7 -- ROM COAL only
          AND L.LoadingDate >= @StartOfYear 
          AND CAST(L.LoadingDate AS DATE) <= @RefDate
        GROUP BY sl.Name
    )
    SELECT * FROM CoalData 
    WHERE (Trip_YTD > 0 OR Qty_YTD > 0)
    ORDER BY Scale;

    -- SECTION B: TRIP-QUANTITY DETAILS (FTD / MTD / YTD) - WASTE
    WITH WasteData AS (
        SELECT 
            sl.Name as Scale,
            -- FTD
            SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_FTD,
            SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_FTD,
            -- MTD
            SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_MTD,
            SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_MTD,
            -- YTD
            SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_YTD,
            SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_YTD
        FROM [Trans].[TblLoading] L
        LEFT JOIN [Master].[TblEquipment] AS Eq ON L.HaulerEquipmentId = Eq.SlNo
        LEFT JOIN [Master].[TblMaterial] AS mt ON L.MaterialId = mt.SlNo
        LEFT JOIN [Master].TblScale AS sl ON eq.ScaleId = sl.SlNo
        WHERE L.IsDelete = 0 
          AND mt.MaterialName NOT IN ('ROM COAL', 'CRUSHED COAL')
          AND L.LoadingDate >= @StartOfYear
          AND CAST(L.LoadingDate AS DATE) <= @RefDate
        GROUP BY sl.Name
    )
    SELECT * FROM WasteData 
    WHERE (Trip_YTD > 0 OR Qty_YTD > 0)
    ORDER BY Scale;

    -- SECTION C: CRUSHED COAL SECTION
    -- Need FTD/MTD/YTD for Crushed Coal as well (based on user image logic which shows FTD/MTD/YTD columns)
    -- Grouping by Source Name (e.g. Chepa, Stock Pile, etc.)
    SELECT
        so.Name as sourceName,
        -- FTD
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_FTD,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_FTD,
        -- MTD
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_MTD,
        -- YTD
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_YTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_YTD
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblMaterial] AS mt ON L.MaterialId = mt.SlNo
    LEFT JOIN [Master].TblSource AS so ON L.SourceId = so.SlNo
    WHERE L.IsDelete = 0 
      AND mt.MaterialName = 'CRUSHED COAL'
      AND L.LoadingDate >= @StartOfYear
      AND CAST(L.LoadingDate AS DATE) <= @RefDate
    GROUP BY so.Name;


    -- SECTION D: COAL CRUSHING DETAILS (Keeping as is for now, user focus was on A/B)
    SELECT 
        CAST(c.[Date] AS DATE) as Date,
        p.Name as PlantName,
        MAX(s.ShiftName) as ShiftName,
        ISNULL(SUM([ProductionQty]),0) as EstQty,
        ISNULL(SUM([RunningHr]),0) as Hr
    FROM [Trans].[TblCrusher] as c
    LEFT JOIN [Master].[TblShift] as s on c.ShiftId =s.SlNo
    LEFT JOIN [Master].[TblPlant] as p on c.PlantId =p.SlNo
    WHERE c.IsDelete=0 
      AND CAST([Date] AS DATE) = @RefDate
    GROUP BY s.ShiftName, p.Name, CAST([Date] AS DATE);

    -- SECTION E: CRUSHER COAL QTY (Summary FTD/MTD/YTD)
    SELECT 
        -- FTD
        ISNULL(SUM(CASE WHEN CAST(c.[Date] AS DATE) = @RefDate THEN c.TotalQty ELSE 0 END),0) as Qty_FTD,
        -- MTD
        ISNULL(SUM(CASE WHEN c.[Date] >= @StartOfMonth AND CAST(c.[Date] AS DATE) <= @RefDate THEN c.TotalQty ELSE 0 END),0) as Qty_MTD,
        -- YTD
        ISNULL(SUM(CASE WHEN c.[Date] >= @StartOfYear AND CAST(c.[Date] AS DATE) <= @RefDate THEN c.TotalQty ELSE 0 END),0) as Qty_YTD
    FROM [Trans].[TblCrusher] as c
    WHERE c.IsDelete=0 
      AND c.[Date] >= @StartOfYear;


    -- SECTION F: BLASTING DETAILS
    SELECT 
        CAST(c.[Date] AS DATE) as date,
        SUM(d.TotalMeters) as TotalMetersDrilled,
        SUM([NoofHolesDeckCharged]) as Noofholesblasted,
        SUM([TotalExplosiveUsed]) as ExplosiveCosumed
    FROM [Trans].[TblBlasting] as c
    LEFT JOIN [Trans].[TblDrilling] as d on c.BlastingPatchId = d.DrillingPatchId
    WHERE c.IsDelete=0 
      AND CAST(c.[Date] AS DATE) = @RefDate
    GROUP BY CAST(c.[Date] AS DATE);

    -- SECTION G: Itiz Dump-Rehandling
    SELECT 
        CAST(r.[RehandlingDate] AS DATE) as Date,
        SUM([TotalQty]) as mangQty,
        SUM([TotalNtpcQty]) as ntpcQty
    FROM [Trans].[TblMaterialRehandling] as r
    LEFT JOIN [Master].[TblMaterial] as mt on r.MaterialId = mt.SlNo
    WHERE r.IsDelete=0 
      AND CAST(r.[RehandlingDate] AS DATE) = @RefDate
      AND mt.MaterialName NOT IN ('ROM COAL', 'CRUSHED COAL')
    GROUP BY CAST(r.[RehandlingDate] AS DATE);

    -- SECTION H: DUMPER-LOADER TRIP DETAILS (New Cross-Tab)
    SELECT
      CAST([LoadingDate] AS DATE) AS Date,
      s.ShiftName,
      100 AS FACTOR, -- Hardcoded as per user request
      Eq.EquipmentName AS Dumper,
      Leq.EquipmentName AS Loader,
      SUM([NoofTrip]) AS Trip
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] AS Eq ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblEquipment] AS Leq ON L.LoadingMachineEquipmentId = Leq.SlNo
    LEFT JOIN [Master].TblShift AS s ON L.ShiftId = s.SlNo
    WHERE L.IsDelete = 0 
      AND CAST([LoadingDate] AS DATE) = @RefDate
      AND Eq.EquipmentGroupId = 24 -- Dumper Group ID
    GROUP BY CAST([LoadingDate] AS DATE), s.ShiftName, Eq.EquipmentName, Leq.EquipmentName
    ORDER BY Eq.EquipmentName ASC;

    -- SECTION I: SMASL Quantity (FTD) (Placeholder)
    SELECT 'SMASL' as Section, 0 as Qty WHERE 1=0;

    -- SECTION J: INPIT DUMPING (Placeholder)
    SELECT 'INPIT' as Section, 0 as Qty WHERE 1=0;

    -- SECTION K: WP-3 EXCAVATION DETAIL (Placeholder)
    SELECT 'WP-3' as Section, 0 as Qty WHERE 1=0;

    -- Remarks
    SELECT Remarks FROM [Trans].[TblLoading] L
    WHERE L.IsDelete = 0 
      AND CAST(L.[LoadingDate] AS DATE) = @RefDate
      AND L.Remarks IS NOT NULL AND L.Remarks <> ''
END
