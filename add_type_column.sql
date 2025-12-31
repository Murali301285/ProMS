IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[Trans].[TblElectricalEntry]') 
    AND name = 'Type'
)
BEGIN
    ALTER TABLE [Trans].[TblElectricalEntry]
    ADD [Type] VARCHAR(20) NULL;
END
GO

-- Backfill existing data
UPDATE [Trans].[TblElectricalEntry]
SET [Type] = CASE 
    WHEN PlantId IS NOT NULL THEN 'Plant' 
    ELSE 'Equipment' 
END
WHERE [Type] IS NULL;
