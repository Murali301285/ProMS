CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportMISBlasting]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Common CTE to fetch raw data and perform basic calculations
    WITH RawData AS (
        SELECT 
            B.SlNo,
            B.[Date],
            mt.MaterialName,
            B.BlastingPatchId,
            l.LocationName,
            sm.Name AS SMESupplier,
            D.NoofHoles,
            D.TotalMeters AS BlastedMeters, -- Using TotalMeters from Drilling
            D.Spacing,
            D.Burden,
            D.AverageDepth AS AvgDepthMtr,
            
            -- Volume (BCM) = Holes * Spacing * Burden * AverageDepth
            (ISNULL(D.NoofHoles, 0) * ISNULL(D.Spacing, 0) * ISNULL(D.Burden, 0) * ISNULL(D.AverageDepth, 0)) AS VolumeBCM,
            
            B.SMEQty AS SMEQuantityKg
        FROM [Trans].[TblBlasting] AS B
        LEFT JOIN [Trans].[TblDrilling] AS D ON B.BlastingPatchId = D.DrillingPatchId
        LEFT JOIN [Master].[TblMaterial] AS mt ON D.MaterialId = mt.SlNo
        LEFT JOIN [Master].[TblLocation] AS l ON D.LocationId = l.SlNo
        LEFT JOIN [Master].[TblSMESupplier] AS sm ON B.SMESupplierId = sm.SlNo
        WHERE B.IsDelete = 0 
          AND CAST(B.[Date] AS DATE) = @Date
    ),
    CalculatedData AS (
        SELECT
            *,
            -- Powder Factor = Volume / SMEQty
            CASE WHEN SMEQuantityKg > 0 THEN VolumeBCM / SMEQuantityKg ELSE 0 END AS PowderFactor,
            
            -- Avg Qty per Hole = SMEQty / NoofHoles
            CASE WHEN NoofHoles > 0 THEN SMEQuantityKg / NoofHoles ELSE 0 END AS AvgQtyPerHole,

            -- Depth Factor Logic
            -- If Supplier 'Solar' -> AvgQtyPerHole / 18, else / 22
            CASE 
                WHEN SMESupplier LIKE '%Solar%' THEN 
                    (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 18.0
                ELSE 
                    (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 22.0
            END AS DepthFactor
        FROM RawData
    )
    
    -- 1. ROM COAL Result Set
    SELECT 
        ROW_NUMBER() OVER(ORDER BY SlNo) as SlNo,
        *,
        (AvgDepthMtr - DepthFactor) AS AvgDepthFinal
    FROM CalculatedData
    WHERE MaterialName = 'ROM COAL';

    -- 2. OVER BURDEN Result Set
    -- Re-run CTE Logic or just select from same source? 
    -- CTE scope is only for the next statement. So better to use temp table or repeats.
    -- Let's rewrite without CTEs for multi-result sets to be safe/simple in one batch or use temp table.
    -- Using Temp Table approach for clearer code.

    SELECT 
        B.SlNo,
        B.[Date],
        mt.MaterialName,
        B.BlastingPatchId,
        l.LocationName,
        sm.Name AS SMESupplier,
        D.NoofHoles,
        D.TotalMeters AS BlastedMeters,
        D.Spacing,
        D.Burden,
        D.AverageDepth AS AvgDepthMtr,
        (ISNULL(D.NoofHoles, 0) * ISNULL(D.Spacing, 0) * ISNULL(D.Burden, 0) * ISNULL(D.AverageDepth, 0)) AS VolumeBCM,
        B.SMEQty AS SMEQuantityKg
    INTO #TempBlasting
    FROM [Trans].[TblBlasting] AS B
    LEFT JOIN [Trans].[TblDrilling] AS D ON B.BlastingPatchId = D.DrillingPatchId
    LEFT JOIN [Master].[TblMaterial] AS mt ON D.MaterialId = mt.SlNo
    LEFT JOIN [Master].[TblLocation] AS l ON D.LocationId = l.SlNo
    LEFT JOIN [Master].[TblSMESupplier] AS sm ON B.SMESupplierId = sm.SlNo
    WHERE B.IsDelete = 0 
      AND CAST(B.[Date] AS DATE) = @Date;

    -- Add Calculated Columns
    SELECT 
        ROW_NUMBER() OVER(ORDER BY SlNo) as SlNo,
        *,
        CASE WHEN SMEQuantityKg > 0 THEN VolumeBCM / SMEQuantityKg ELSE 0 END AS PowderFactor,
        CASE WHEN NoofHoles > 0 THEN SMEQuantityKg / NoofHoles ELSE 0 END AS AvgQtyPerHole,
        
        -- Depth Factor
        CASE 
            WHEN SMESupplier LIKE '%Solar%' THEN 
                (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 18.0
            ELSE 
                (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 22.0
        END AS DepthFactor,

        -- Final Avg Depth
        AvgDepthMtr - (
            CASE 
                WHEN SMESupplier LIKE '%Solar%' THEN 
                    (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 18.0
                ELSE 
                    (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 22.0
            END
        ) AS AvgDepthFinal
    FROM #TempBlasting
    WHERE MaterialName = 'ROM COAL';

    SELECT 
        ROW_NUMBER() OVER(ORDER BY SlNo) as SlNo,
        *,
        CASE WHEN SMEQuantityKg > 0 THEN VolumeBCM / SMEQuantityKg ELSE 0 END AS PowderFactor,
        CASE WHEN NoofHoles > 0 THEN SMEQuantityKg / NoofHoles ELSE 0 END AS AvgQtyPerHole,
        
         -- Depth Factor
        CASE 
            WHEN SMESupplier LIKE '%Solar%' THEN 
                (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 18.0
            ELSE 
                (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 22.0
        END AS DepthFactor,

        -- Final Avg Depth
        AvgDepthMtr - (
            CASE 
                WHEN SMESupplier LIKE '%Solar%' THEN 
                    (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 18.0
                ELSE 
                    (CASE WHEN NoofHoles > 0 THEN (SMEQuantityKg / NoofHoles) ELSE 0 END) / 22.0
            END
        ) AS AvgDepthFinal

    FROM #TempBlasting
    WHERE MaterialName = 'OVER BURDEN';

    DROP TABLE #TempBlasting;
END
