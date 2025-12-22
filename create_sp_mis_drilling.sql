CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportMISDrilling]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. ROM COAL Result Set
    SELECT 
        ROW_NUMBER() OVER(ORDER BY D.SlNo) as SlNo,
        D.Date,
        mt.MaterialName as Material,
        D.DrillingPatchId,
        l.LocationName as Location,
        da.AgencyName as Agency,
        D.Remarks, -- Added Remarks
        D.NoofHoles,
        D.TopRLBottomRL,
        D.Spacing,
        D.Burden,
        D.AverageDepth,
        D.TotalMeters
    FROM [Trans].[TblDrilling] as D
    LEFT JOIN [Master].[TblMaterial] as mt on D.MaterialId = mt.SlNo
    LEFT JOIN [Master].[TblLocation] as l on D.LocationId = l.SlNo
    LEFT JOIN [Master].[TblDrillingAgency] as da on D.DrillingAgencyId = da.SlNo
    WHERE D.IsDelete=0 
      AND CAST(D.[Date] as DATE) = @Date
      AND mt.MaterialName = 'ROM COAL';

    -- 2. OVER BURDEN Result Set
    SELECT 
        ROW_NUMBER() OVER(ORDER BY D.SlNo) as SlNo,
        D.Date,
        mt.MaterialName as Material,
        D.DrillingPatchId,
        l.LocationName as Location,
        da.AgencyName as Agency,
        D.Remarks, -- Added Remarks
        D.NoofHoles,
        D.TopRLBottomRL,
        D.Spacing,
        D.Burden,
        D.AverageDepth,
        D.TotalMeters
    FROM [Trans].[TblDrilling] as D
    LEFT JOIN [Master].[TblMaterial] as mt on D.MaterialId = mt.SlNo
    LEFT JOIN [Master].[TblLocation] as l on D.LocationId = l.SlNo
    LEFT JOIN [Master].[TblDrillingAgency] as da on D.DrillingAgencyId = da.SlNo
    WHERE D.IsDelete=0 
      AND CAST(D.[Date] as DATE) = @Date
      AND mt.MaterialName = 'OVER BURDEN';

END
