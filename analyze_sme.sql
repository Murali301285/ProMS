-- Check SME Category Table (Try strict name and user's likely typo name)
SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%SME%';

-- Select Top 1 from potential tables to verify columns
SELECT TOP 1 * FROM [Master].[TblSMECategory]; 
SELECT TOP 1 * FROM [Master].[TblTblSMECategory]; -- Just in case

-- Check BDS Entry Schema Again to be sure what to remove
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblBDSEntry' AND TABLE_SCHEMA = 'Trans';
