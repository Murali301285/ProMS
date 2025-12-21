CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportShiftProduction]
    @Date DATE,
    @ShiftId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- SECTION 0: Incharge Details
    -- Concatenate Unique Incharge Names per Scale for the selected Shift
    -- Fix: Use CTE to get DISTINCT names first to avoid massive repetition, and cast to NVARCHAR(MAX) to prevent overflow
    ;WITH UniqueIncharges AS (
        SELECT DISTINCT 
            sl.Name as scalename,
            op.OperatorName
        FROM [Trans].[TblEquipmentReading] as er
        LEFT JOIN [Master].[TblEquipment] as Eq on er.EquipmentId = eq.SlNo
        LEFT JOIN [Master].TblScale as sl on eq.ScaleId = sl.SlNo
        LEFT JOIN [Trans].[TblEquipmentReadingShiftIncharge] as si on si.[EquipmentReadingId] = er.SlNo
        LEFT JOIN [Master].TblOperator as op on si.OperatorId = op.SlNo 
        WHERE eq.IsDelete=0 
          AND Cast(er.[Date] as Date) = @Date
          AND er.ShiftId = @ShiftId
          AND op.OperatorName IS NOT NULL
    )
    SELECT 
        scalename,
        STRING_AGG(CAST(OperatorName AS NVARCHAR(MAX)), ', ') as ShiftInchare
    FROM UniqueIncharges
    GROUP BY scalename;

    -- SECTION A: TRIP-QUANTITY DETAILS (COAL)
    -- Shift Production vs FTD (For The Day)
    SELECT
        MAX(s.ShiftName) as ShiftName,
        sl.Name as Scale,
        'ROM COAL' as MaterialName,
        
        -- Shift Production (@ShiftId)
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN 1 ELSE 0 END) AS Shift_Trips,
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN L.TotalQty ELSE 0 END) AS Shift_Qty,
        
        -- FTD Production (All Shifts for @Date)
        COUNT(L.SlNo) AS FTD_Trips,
        SUM(L.TotalQty) AS FTD_Qty

    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblShift as s on s.SlNo = @ShiftId -- Use param shift name for display
    LEFT JOIN [Master].TblScale as sl on eq.ScaleId = sl.SlNo
    LEFT JOIN [Master].TblMaterial as mt on l.MaterialId = mt.SlNo

    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.MaterialId = 7 -- ROM COAL
    GROUP BY sl.Name;

    -- SECTION A: TRIP-QUANTITY DETAILS (WASTE)
    SELECT
        MAX(s.ShiftName) as ShiftName,
        sl.Name as Scale,
        'WASTE' as MaterialName,
        
        -- Shift Production
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN 1 ELSE 0 END) AS Shift_Trips,
        SUM(CASE WHEN L.ShiftId = @ShiftId THEN L.TotalQty ELSE 0 END) AS Shift_Qty,
        
        -- FTD Production
        COUNT(L.SlNo) AS FTD_Trips,
        SUM(L.TotalQty) AS FTD_Qty

    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblShift as s on s.SlNo = @ShiftId
    LEFT JOIN [Master].TblScale as sl on eq.ScaleId = sl.SlNo
    LEFT JOIN [Master].TblMaterial as mt on l.MaterialId = mt.SlNo

    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND mt.MaterialName NOT IN ('ROM COAL', 'CRUSHED COAL')
    GROUP BY sl.Name;

    -- SECTION B: LOADING EQUIPMENT'S TRIP DETAILS (Only for Selected Shift)
    -- Materials: OB/IB, Top Soil, Coal.
    -- We need columns: Equipment, OB/IB Trip, Top Soil Trip, Coal Trip, Total Trip, BCM, MT, W.Hr, Location
    -- BCM = Waste Qty, MT = Coal Qty
    SELECT
        Eq.EquipmentName as LoadingEquipment,
        
        -- A: OB/IB Trips
        SUM(CASE WHEN mt.MaterialName IN ('OVER BURDEN', 'INTER BURDEN') THEN 1 ELSE 0 END) as OBIB_Trip,
        
        -- B: Top Soil Trips
        SUM(CASE WHEN mt.MaterialName = 'TOP SOIL' THEN 1 ELSE 0 END) as TopSoil_Trip,
        
        -- C: Coal Trips
        SUM(CASE WHEN mt.MaterialName = 'ROM COAL' THEN 1 ELSE 0 END) as Coal_Trip,
        
        -- D: Total Trips
        COUNT(L.SlNo) as Total_Trip,
        
        -- E: BCM (Waste Qty)
        SUM(CASE WHEN mt.MaterialName IN ('OVER BURDEN', 'INTER BURDEN', 'TOP SOIL') THEN L.TotalQty ELSE 0 END) as BCM,
        
        -- F: MT (Coal Qty)
        SUM(CASE WHEN mt.MaterialName = 'ROM COAL' THEN L.TotalQty ELSE 0 END) as MT,
        
        -- G: Working Hours (From Equipment Reading? Or Loading Table? User query used EquipmentReading via join)
        -- User Query Logic: sum(TotalWorkingHr) from TblEquipmentReading.
        -- Need to join TblEquipmentReading carefully on EquipmentId and Date and Shift.
        -- Note: L.LoadingMachineEquipmentId joins to Eq.SlNo. Then Read.EquipmentId = Eq.SlNo.
        MAX(er.TotalWorkingHr) as WHr, -- Taking Max because Group By Eq.Name, assuming 1 reading per shift per eq
        
        -- L: Location (Source)
        MAX(so.Name) as Location

    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblMaterial as mt on L.MaterialId = mt.SlNo
    LEFT JOIN [Master].TblSource as so on L.SourceId = so.SlNo
    -- Join Reading for Hours
    LEFT JOIN [Trans].[TblEquipmentReading] er 
        ON er.EquipmentId = Eq.SlNo 
        AND Cast(er.[Date] as Date) = @Date 
        AND er.ShiftId = @ShiftId
        AND er.IsDelete = 0

    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
    GROUP BY Eq.EquipmentName
    ORDER BY Eq.EquipmentName;

    -- SECTION C.1: Loading Equipment (in Coal) Summary
    SELECT
        Eg.Name as EquipmentModel,
        COUNT(L.SlNo) as Trips,
        SUM(L.TotalQty) as MT,
        
        -- For "No's" (Count of Equipment active)
        COUNT(DISTINCT L.LoadingMachineEquipmentId) as EqCount,
        -- Working hours
        SUM(DISTINCT er.TotalWorkingHr) as TotalHrs -- Approximate if multiple eq
        
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblEquipmentGroup as Eg on Eq.EquipmentGroupId = Eg.SlNo
    LEFT JOIN [Trans].[TblEquipmentReading] er ON er.EquipmentId = Eq.SlNo AND er.ShiftId = @ShiftId AND Cast(er.Date as Date) = @Date

    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId = 7 -- ROM COAL
    GROUP BY Eg.Name;

    -- SECTION C.2: Loading Equipment (in Waste) Summary
    SELECT
        Eg.Name as EquipmentModel,
        COUNT(L.SlNo) as Trips,
        SUM(L.TotalQty) as BCM,
         -- For "No's" (Count of Equipment active)
        COUNT(DISTINCT L.LoadingMachineEquipmentId) as EqCount,
        SUM(DISTINCT er.TotalWorkingHr) as TotalHrs

    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.LoadingMachineEquipmentId = Eq.SlNo
    LEFT JOIN [Master].TblEquipmentGroup as Eg on Eq.EquipmentGroupId = Eg.SlNo
    LEFT JOIN [Trans].[TblEquipmentReading] er ON er.EquipmentId = Eq.SlNo AND er.ShiftId = @ShiftId AND Cast(er.Date as Date) = @Date

    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId <> 7 -- Waste
    GROUP BY Eg.Name;

    -- SECTION D: Hauling Equipment (Coal)
    SELECT
        Eq.EquipmentName as Equip,
        COUNT(L.SlNo) as Trip,
        SUM(L.TotalQty) as MT
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.HaulerEquipmentId = Eq.SlNo
    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId = 7
    GROUP BY Eq.EquipmentName;

    -- SECTION D: Hauling Equipment (Waste)
    SELECT
        Eq.EquipmentName as Equip,
        COUNT(L.SlNo) as Trip,
        SUM(L.TotalQty) as BCM
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].[TblEquipment] as Eq on L.HaulerEquipmentId = Eq.SlNo
    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId <> 7
    GROUP BY Eq.EquipmentName;

    -- SECTION E: Dump Wise (Coal)
    SELECT
        de.Name as DumpWise,
        COUNT(L.SlNo) as Trips,
        SUM(L.TotalQty) as MT
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].TblDestination as de on L.DestinationId = de.SlNo
    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId = 7
    GROUP BY de.Name;

    -- SECTION E: Dump Wise (Waste)
    SELECT
        de.Name as DumpWise,
        COUNT(L.SlNo) as Trips,
        SUM(L.TotalQty) as BCM
    FROM [Trans].[TblLoading] L
    LEFT JOIN [Master].TblDestination as de on L.DestinationId = de.SlNo
    WHERE L.IsDelete=0 
      AND Cast(L.[LoadingDate] as Date) = @Date
      AND L.ShiftId = @ShiftId
      AND L.MaterialId <> 7
    GROUP BY de.Name;

END
