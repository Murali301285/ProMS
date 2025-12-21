CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportSectorWiseProduction]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE: Aggregate Loading first (Production)
    -- Grouped by Eq, Shift, Date to match Reading granularity
    WITH CTE_Loading AS (
        SELECT 
            L.LoadingMachineEquipmentId,
            L.ShiftId,
            Cast(L.LoadingDate as Date) as LDate,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty,
            L.MaterialId -- Need to ensure we only get OB? 
                         -- If we group by Eq/Shift, we might mix materials if we aren't careful.
                         -- But user query filtered (MaterialName ='TOP SOIL' etc).
        FROM [Trans].[TblLoading] L
        JOIN [Master].[TblMaterial] M ON L.MaterialId = M.SlNo
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) = @Date
          AND M.MaterialName IN ('TOP SOIL', 'OVER BURDEN', 'INTER BURDEN', 'OB', 'TS', 'IB') -- OB Variations
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, Cast(L.LoadingDate as Date), L.MaterialId
    ),
    -- Consolidate Loading (in case multiple OB materials for same shift/eq)
    CTE_Loading_Agg AS (
        SELECT 
            LoadingMachineEquipmentId, ShiftId, LDate,
            SUM(Trips) as TotalTrips,
            SUM(Qty) as TotalQty
        FROM CTE_Loading
        GROUP BY LoadingMachineEquipmentId, ShiftId, LDate
    )

    SELECT 
        -- Grouping Keys
        ISNULL(sec.SectorName, 'Unknown Sector') as SectorName,
        Eq.EquipmentName,
        pa.Name as PatchName,
        me.Name as MethodName,

        -- Metrics
        SUM(ISNULL(LA.TotalTrips, 0)) as Trips,
        SUM(ISNULL(LA.TotalQty, 0)) as QtyBCM,
        SUM(ISNULL(R.TotalWorkingHr, 0)) as OBHrs, -- Using TotalWorkingHr from Reading
        
        -- Derived
        0 as TargetBCMHr, -- Placeholder as per plan
        CASE WHEN SUM(ISNULL(R.TotalWorkingHr, 0)) > 0 
             THEN SUM(ISNULL(LA.TotalQty, 0)) / SUM(ISNULL(R.TotalWorkingHr, 0)) 
             ELSE 0 
        END as BCMHr

    FROM [Trans].[TblEquipmentReading] R
    
    -- Join Masters for R
    LEFT JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblSector] sec ON R.SectorId = sec.SlNo
    LEFT JOIN [Master].[TblPatch] pa ON R.PatchId = pa.SlNo
    LEFT JOIN [Master].[TblMethod] me ON R.MethodId = me.SlNo

    -- Join Loading Agg (Only matching Date/Shift/Eq)
    -- We use INNER JOIN if we only want machines that produced OB? 
    -- Or LEFT JOIN if we want machines that *worked* (Hours) even if 0 Prod?
    -- User query used "FROM TblLoading Left Join ...". So it was Loading centric.
    -- If a machine works but has 0 trips, it won't show in Loading-centric query.
    -- I will follow User's Loading-Centric approach but safe join.
    RIGHT JOIN CTE_Loading_Agg LA ON LA.LoadingMachineEquipmentId = R.EquipmentId 
                                  AND LA.ShiftId = R.ShiftId 
                                  AND LA.LDate = Cast(R.[Date] as Date)

    WHERE R.IsDelete = 0 
      AND Cast(R.[Date] as Date) = @Date
      -- Note: If we use RIGHT JOIN, R could be NULL if Loading exists but no Reading?
      -- That denotes data error. But better to use Inner Join or map properly.
      -- If I stick to the user's "FROM Loading", I start with CTE_Loading_Agg.
    
    GROUP BY sec.SectorName, Eq.EquipmentName, pa.Name, me.Name
    
    ORDER BY sec.SectorName, Eq.EquipmentName;
END
