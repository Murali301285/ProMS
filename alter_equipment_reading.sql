
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblEquipmentReading]') AND name = 'ShiftInchargeId')
BEGIN
    ALTER TABLE [Trans].[TblEquipmentReading] ADD ShiftInchargeId INT NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblEquipmentReading]') AND name = 'MidScaleInchargeId')
BEGIN
    ALTER TABLE [Trans].[TblEquipmentReading] ADD MidScaleInchargeId INT NULL;
END
