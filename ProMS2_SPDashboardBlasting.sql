CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPDashboardBlasting]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. SME Supplier Wise: Qty, Powder Factor (Coal & OB)
    -- Assuming TblBlasting / TblBlastingDetails
    -- Powder Factor = Total Explosive / Total Volume (Coal or OB)
    
    SELECT 
        Supp.AgencyName as SupplierName,
        CASE WHEN M.Name LIKE '%Coal%' THEN 'Coal' ELSE 'OB' END as MaterialType,
        SUM(B.TotalExplosiveQty) as TotalExplosive,
        SUM(B.TotalVolume) as TotalVolume, -- Assuming Volume is stored or calculated
        CASE WHEN SUM(B.TotalVolume) > 0 THEN SUM(B.TotalExplosiveQty) / SUM(B.TotalVolume) ELSE 0 END as PowderFactor
    FROM [Trans].[TblBlasting] B
    LEFT JOIN [Master].[TblAgency] Supp ON B.AgencyId = Supp.SlNo
    LEFT JOIN [Master].[TblMaterial] M ON B.MaterialId = M.SlNo
    WHERE B.IsDelete = 0 AND CAST(B.Date AS DATE) = @Date
    GROUP BY Supp.AgencyName, CASE WHEN M.Name LIKE '%Coal%' THEN 'Coal' ELSE 'OB' END;

    -- 2. Explosive Type Wise Usage %
    -- SME, LDE, ANFO (Columns in TblBlasting usually)
    SELECT 
        SUM(B.SMEQty) as TotalSME,
        SUM(B.LDEQty) as TotalLDE, -- Assuming column exists
        SUM(B.ANFOQty) as TotalANFO, -- Assuming column exists
        SUM(B.TotalExplosiveQty) as GrandTotal
    FROM [Trans].[TblBlasting] B
    WHERE B.IsDelete = 0 AND CAST(B.Date AS DATE) = @Date;

END
