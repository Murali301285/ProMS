
SELECT 
    s.name AS SchemaName,
    f.name AS ForeignKeyName,
    OBJECT_NAME(f.parent_object_id) AS TableName
FROM 
    sys.foreign_keys AS f
INNER JOIN 
    sys.schemas AS s ON f.schema_id = s.schema_id
WHERE 
    f.name IN ('FK_TblCrusher_TblUser_New', 'FK_TblCrusher_TblUser_New1', 'FK_TblBlasting_TblUser', 'FK_TblBlasting_TblUser1');
