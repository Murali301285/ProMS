
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TblCrusher_ShiftInChargeId' AND parent_object_id = OBJECT_ID('Trans.TblCrusher'))
BEGIN
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_ShiftInChargeId];
END

-- Also check for auto-generated FK names if any (generic approach)
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT ' + QUOTENAME(CONSTRAINT_NAME) + ';'
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
AND EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
    WHERE kcu.CONSTRAINT_NAME = INFORMATION_SCHEMA.TABLE_CONSTRAINTS.CONSTRAINT_NAME 
    AND kcu.COLUMN_NAME = 'ShiftInChargeId'
);
EXEC sp_executesql @sql;

-- Alter column to VARCHAR to support CSV
ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN [ShiftInChargeId] VARCHAR(MAX);
