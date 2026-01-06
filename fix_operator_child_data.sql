-- One-time migration to fix missing Child Table records
-- caused by the temporary Single-Column save logic.

INSERT INTO [Trans].[TblEquipmentReadingOperator] (EquipmentReadingId, OperatorId)
SELECT SlNo, OperatorId
FROM [Trans].[TblEquipmentReading] T
WHERE OperatorId IS NOT NULL 
  AND IsDelete = 0
  AND NOT EXISTS (
      SELECT 1 
      FROM [Trans].[TblEquipmentReadingOperator] C 
      WHERE C.EquipmentReadingId = T.SlNo
  );

PRINT 'Migration Completed: Syncing OperatorId to Child Table';
