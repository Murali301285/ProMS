IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblMaterialRehandling]') AND name = 'ShiftInchargeId')
BEGIN
    ALTER TABLE [Trans].[TblMaterialRehandling] ADD ShiftInchargeId INT NULL;
    PRINT 'ShiftInchargeId column added';
End

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblMaterialRehandling]') AND name = 'MidScaleInchargeId')
BEGIN
    ALTER TABLE [Trans].[TblMaterialRehandling] ADD MidScaleInchargeId INT NULL;
    PRINT 'MidScaleInchargeId column added';
End
