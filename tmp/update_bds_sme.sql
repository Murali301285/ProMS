-- Truncate Table first to ensure clean state
TRUNCATE TABLE [Trans].[TblBDSEntry];

-- Alter Table: Drop PartyId and Add SMECategoryId
ALTER TABLE [Trans].[TblBDSEntry] DROP COLUMN PartyId;
ALTER TABLE [Trans].[TblBDSEntry] ADD SMECategoryId INT NOT NULL;

-- Optional: Add FK if needed
-- ALTER TABLE [Trans].[TblBDSEntry] ADD CONSTRAINT FK_BDSEntry_SME FOREIGN KEY (SMECategoryId) REFERENCES [Master].[TblSMECategory](SlNo);
