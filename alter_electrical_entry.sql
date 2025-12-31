IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblElectricalEntry]') AND name = 'PlantId')
BEGIN
    ALTER TABLE [Trans].[TblElectricalEntry] ADD PlantId INT NULL;
END
GO

ALTER TABLE [Trans].[TblElectricalEntry] ALTER COLUMN EquipmentId INT NULL;
GO
