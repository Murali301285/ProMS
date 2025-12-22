-- Drop existing constraints referencing TblUser
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

-- Add new constraints referencing TblUser_New
-- Ensure TblUser_New exists
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
