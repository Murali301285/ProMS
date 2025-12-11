USE [ProdMS_live]
GO

IF EXISTS(SELECT 1 FROM sys.columns 
          WHERE Name = N'CostCenter'
          AND Object_ID = Object_ID(N'[Master].[TblMaterial]'))
BEGIN
    ALTER TABLE [Master].[TblMaterial]
    DROP COLUMN CostCenter;
    PRINT 'Column CostCenter dropped successfully form [Master].[TblMaterial]';
END
ELSE
BEGIN
    PRINT 'Column CostCenter does not exist in [Master].[TblMaterial]';
END
GO
