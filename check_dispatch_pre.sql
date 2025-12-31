-- Check for non-numeric values
SELECT DISTINCT CreatedBy 
FROM [Trans].[TblDispatchEntry] 
WHERE ISNUMERIC(CreatedBy) = 0
UNION
SELECT DISTINCT UpdatedBy 
FROM [Trans].[TblDispatchEntry] 
WHERE ISNUMERIC(UpdatedBy) = 0 AND UpdatedBy IS NOT NULL;

-- Check Schema
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TblDispatchEntry' AND TABLE_SCHEMA = 'Trans'
AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy');
