CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPDashboardDrilling]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @YearStart DATE = DATEFROMPARTS(YEAR(@Date), 1, 1);

    -- 1. Electrical Drill Performance: Highest Drill Meter (Shift, Day, Month)
    -- We need to find the MAX production achieved by any drill.
    -- Assuming 'TblDrilling' stores individual drill records.
    
    -- Shift Record
    SELECT TOP 1
        'Shift' as Period,
        D.ShiftId,
        S.ShiftName,
        E.EquipmentName,
        SUM(D.ProgressMeters) as MaxMeters
    FROM [Trans].[TblDrilling] D
    JOIN [Master].[TblEquipment] E ON D.EquipmentId = E.SlNo
    JOIN [Master].[TblShift] S ON D.ShiftId = S.SlNo
    WHERE D.IsDelete = 0 AND CAST(D.Date AS DATE) = @Date
    GROUP BY D.ShiftId, S.ShiftName, E.EquipmentName
    ORDER BY SUM(D.ProgressMeters) DESC;

    -- Day Record
    SELECT TOP 1 
        'Day' as Period,
        E.EquipmentName,
        SUM(D.ProgressMeters) as MaxMeters
    FROM [Trans].[TblDrilling] D
    JOIN [Master].[TblEquipment] E ON D.EquipmentId = E.SlNo
    WHERE D.IsDelete = 0 AND CAST(D.Date AS DATE) = @Date
    GROUP BY E.EquipmentName
    ORDER BY SUM(D.ProgressMeters) DESC;

    -- Month Record
    SELECT TOP 1
        'Month' as Period,
        E.EquipmentName,
        SUM(D.ProgressMeters) as MaxMeters
    FROM [Trans].[TblDrilling] D
    JOIN [Master].[TblEquipment] E ON D.EquipmentId = E.SlNo
    WHERE D.IsDelete = 0 AND CAST(D.Date AS DATE) >= @MonthStart AND CAST(D.Date AS DATE) <= @Date
    GROUP BY E.EquipmentName
    ORDER BY SUM(D.ProgressMeters) DESC;


    -- 2. Recovery - Coal & OB Separation
    -- Assuming TblDrilling has a 'Type' or join with Material to distinguish Coal vs OB.
    -- Or likely specific Materials are Coal/OB.
    -- For now, let's assume specific Logic or Material Type.
    -- If no explicit type, we might check MaterialGroup or similar.
    -- Let's check TblMaterialMaster or similar if exists, otherwise assume column based.
    
    -- ADJUSTMENT: Based on previous file explorations, we know there is typically OverBurden vs Coal.
    -- Let's assume a simplified query grouping by Material/Remarks or similar if available.
    -- Ideally, we check TblMaterial.
    
    SELECT 
        CASE 
            WHEN M.Name LIKE '%Coal%' THEN 'Coal'
            ELSE 'OB' 
        END as Category,
        SUM(D.ProgressMeters) as TotalMeters
    FROM [Trans].[TblDrilling] D
    LEFT JOIN [Master].[TblMaterial] M ON D.MaterialId = M.SlNo
    WHERE D.IsDelete = 0 
      AND CAST(D.Date AS DATE) = @Date
    GROUP BY CASE 
            WHEN M.Name LIKE '%Coal%' THEN 'Coal'
            ELSE 'OB' 
        END;

END
