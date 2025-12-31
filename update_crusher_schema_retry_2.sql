-- Delete data from ALL child tables
DELETE FROM [Trans].[TblCrusherShiftIncharge];
DELETE FROM [Trans].[TblCrusherStoppage];

-- Delete data from parent table
DELETE FROM [Trans].[TblCrusher];

-- Now safe to alter columns
ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN ShiftInChargeId INT;
ALTER TABLE [Trans].[TblCrusher] ADD MidScaleInchargeId INT;
