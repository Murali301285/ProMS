CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPGetShifts]
AS
BEGIN
    SELECT SlNo, ShiftName FROM [Master].[TblShift] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY ShiftName
END
