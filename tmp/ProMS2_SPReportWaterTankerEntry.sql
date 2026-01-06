
CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportWaterTankerEntry]
    @Date DATE,
    @ShiftId INT = NULL -- Optional, if 0 or NULL show all shifts for the date
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        -- Row Number not needed if frontend handles it, but good to have
        ROW_NUMBER() OVER(ORDER BY Eq.EquipmentName) as SlNo,
        CAST(W.EntryDate AS DATE) as Date,
        S.ShiftName,
        Eq.EquipmentName as WaterTankerEquipment,
        CAST(W.Capacity as DECIMAL(18,0)) as TankerCapacity, -- User screenshot says "Tanke Capecity"
        
        -- Aggregates
        CAST(ISNULL(SUM(W.NoOfTrip), 0) AS INT) as Trip, -- 0 decimal places
        CAST(ISNULL(SUM(W.TotalQty), 0) AS DECIMAL(18, 3)) as Qty, -- 3 decimal places
        
        -- Dimensions
        FP.FillingPoint as FillingPoint,
        P.FillingPump as FillingPump,
        D.FillingPoint as Destination,
        W.Remarks -- Grouping by remarks implies different rows for different remarks
        
    FROM [Transaction].[TblWaterTankerEntry] as W
    LEFT JOIN [Master].[TblShift] as S ON W.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblEquipment] as Eq ON W.HaulerId = Eq.SlNo
    LEFT JOIN [Master].[tblFillingPoint] as FP ON W.FillingPointId = FP.SlNo -- Source Filling Point
    LEFT JOIN [Master].[tblFillingPump] as P ON W.FillingPumpId = P.SlNo
    LEFT JOIN [Master].[tblFillingPoint] as D ON W.DestinationId = D.SlNo -- Destination

    WHERE W.IsDelete = 0 
    AND CAST(W.EntryDate AS DATE) = @Date
    AND (@ShiftId IS NULL OR @ShiftId = 0 OR W.ShiftId = @ShiftId)

    GROUP BY 
        CAST(W.EntryDate AS DATE),
        S.ShiftName,
        Eq.EquipmentName,
        W.Capacity,
        FP.FillingPoint,
        P.FillingPump,
        D.FillingPoint,
        W.Remarks

    ORDER BY 
        Eq.EquipmentName;
END
