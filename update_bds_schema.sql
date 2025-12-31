-- Truncate Table
TRUNCATE TABLE [Trans].[TblBDSEntry];

-- Alter Columns
ALTER TABLE [Trans].[TblBDSEntry] ALTER COLUMN CreatedBy INT NOT NULL;
ALTER TABLE [Trans].[TblBDSEntry] ALTER COLUMN UpdatedBy INT NULL;

-- Optional: Add Foreign Keys (Good practice if User table is stable)
-- ALTER TABLE [Trans].[TblBDSEntry] ADD CONSTRAINT FK_BDSEntry_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES [Master].[TblUser_New](SlNo);
-- ALTER TABLE [Trans].[TblBDSEntry] ADD CONSTRAINT FK_BDSEntry_UpdatedBy FOREIGN KEY (UpdatedBy) REFERENCES [Master].[TblUser_New](SlNo);
