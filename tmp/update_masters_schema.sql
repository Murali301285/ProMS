USE [ProdMS_live];
GO

-- Script to add [IsActive] column to master tables if it does not exist
-- Default value 1 (True)

DECLARE @TableName NVARCHAR(128);
DECLARE @Sql NVARCHAR(MAX);

-- List of tables to check
DECLARE @Tables TABLE (TableName NVARCHAR(128));
INSERT INTO @Tables (TableName) VALUES 
('TblActivity'), ('TblAuditLog'), ('TblBDReason'), ('TblBench'), 
('TblCompany'), ('TblDbConfig'), ('TblDepthSlab'), ('TblDestination'), 
('TblDestinationMaterialMapping'), ('TblEntryType'), ('TblEquipment'), 
('TblEquipmentGroup'), ('TblIdleReason'), ('TblLocation'), ('TblMaterial'), 
('TblMenuAllocation'), ('TblMenuMaster'), ('TblMethod'), ('TblModule'), 
('TblOperator'), ('TblOperatorCategory'), ('TblOperatorSubCategory'), 
('TblPage'), ('TblPatch'), ('TblPlant'), ('TblQtyTripMapping'), 
('TblRelay'), ('TblRemarks'), ('TblRole'), ('TblRoleAuthorization'), 
('TblScale'), ('TblSector'), ('TblShift'), ('TblShiftIncharge'), 
('TblShiftInchargeUser'), ('TblSMESupplier'), ('TblSource'), 
('TblStoppageReason'), ('TblStrata'), ('TblSubGroup'), ('TblUnit'), ('TblUser');

DECLARE TableCursor CURSOR FOR SELECT TableName FROM @Tables;

OPEN TableCursor;
FETCH NEXT FROM TableCursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = '
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID(N''[Master].[' + @TableName + ']'') 
        AND name = ''IsActive''
    )
    BEGIN
        PRINT ''Adding IsActive to ' + @TableName + ''';
        ALTER TABLE [Master].[' + @TableName + '] ADD IsActive BIT NOT NULL DEFAULT 1;
    END
    ';

    EXEC sp_executesql @Sql;
    FETCH NEXT FROM TableCursor INTO @TableName;
END

CLOSE TableCursor;
DEALLOCATE TableCursor;
print 'Schema update complete.';
GO
