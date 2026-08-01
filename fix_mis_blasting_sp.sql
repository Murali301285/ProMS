-- =========================================================================================
-- Script to fix duplicate ROM COAL recordset output in MIS Blasting Stored Procedure
-- Database: ProMS2_2026
-- Execute this on your SQL Server instance.
-- =========================================================================================

USE [ProMS2_2026];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

ALTER PROCEDURE [dbo].[ProMS2_SPReportMISBlasting]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Query drilling and blasting entries for the date into a temp table
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

    -- 1. ROM COAL Result Set (Recordset 0)
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

    -- 2. OVER BURDEN Result Set (Recordset 1)
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
GO
