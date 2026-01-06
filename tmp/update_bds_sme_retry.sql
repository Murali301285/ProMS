-- Drop Constraint
ALTER TABLE [Trans].[TblBDSEntry] DROP CONSTRAINT FK__TblBDSEnt__Party__1EC48A19;

-- Then Drop Column
ALTER TABLE [Trans].[TblBDSEntry] DROP COLUMN PartyId;

-- Add New Column
ALTER TABLE [Trans].[TblBDSEntry] ADD SMECategoryId INT NOT NULL;
