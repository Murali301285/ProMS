-- 1. Drop old constraints if they exist
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblCrusher_TblUser]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblCrusher]'))
BEGIN
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_TblUser];
    PRINT 'Dropped FK_TblCrusher_TblUser';
END

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblCrusher_TblUser1]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblCrusher]'))
BEGIN
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_TblUser1];
    PRINT 'Dropped FK_TblCrusher_TblUser1';
END

-- 2. Drop NEW constraints if they partially exist (re-run safety)
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblCrusher_TblUser_New]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblCrusher]'))
BEGIN
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_TblUser_New];
    PRINT 'Dropped existing FK_TblCrusher_TblUser_New';
END

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblCrusher_TblUser_New1]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblCrusher]'))
BEGIN
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_TblUser_New1];
    PRINT 'Dropped existing FK_TblCrusher_TblUser_New1';
END

-- 3. Data Cleanup: Update existing UserId refs to 1 (Admin in TblUser_New) so constraints pass
-- Only update if the value doesn't exist in TblUser_New.
UPDATE [Trans].[TblCrusher]
SET CreatedBy = 1
WHERE CreatedBy NOT IN (SELECT SlNo FROM [Master].[TblUser_New]);

UPDATE [Trans].[TblCrusher]
SET UpdatedBy = 1
WHERE UpdatedBy NOT IN (SELECT SlNo FROM [Master].[TblUser_New]);

PRINT 'Data Cleaned/Normalized.';

-- 4. Add new constraints referencing TblUser_New
IF OBJECT_ID(N'[Master].[TblUser_New]', N'U') IS NOT NULL
BEGIN
    ALTER TABLE [Trans].[TblCrusher] WITH CHECK ADD CONSTRAINT [FK_TblCrusher_TblUser_New] FOREIGN KEY([CreatedBy])
    REFERENCES [Master].[TblUser_New] ([SlNo]);
    
    ALTER TABLE [Trans].[TblCrusher] CHECK CONSTRAINT [FK_TblCrusher_TblUser_New];
    PRINT 'Added FK_TblCrusher_TblUser_New';

    ALTER TABLE [Trans].[TblCrusher] WITH CHECK ADD CONSTRAINT [FK_TblCrusher_TblUser_New1] FOREIGN KEY([UpdatedBy])
    REFERENCES [Master].[TblUser_New] ([SlNo]);
    
    ALTER TABLE [Trans].[TblCrusher] CHECK CONSTRAINT [FK_TblCrusher_TblUser_New1];
    PRINT 'Added FK_TblCrusher_TblUser_New1';
END
ELSE
BEGIN
    PRINT 'Error: [Master].[TblUser_New] does not exist.';
END
