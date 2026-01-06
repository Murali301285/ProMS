TRUNCATE TABLE [Trans].[TblCrusher];

ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN ShiftInChargeId INT;
ALTER TABLE [Trans].[TblCrusher] ADD MidScaleInchargeId INT;
