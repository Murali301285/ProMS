
-- Drop Constraints for Crusher (Explicit Schema)
IF OBJECT_ID('[Trans].[FK_TblCrusher_TblUser_New]', 'F') IS NOT NULL
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_TblUser_New];

IF OBJECT_ID('[Trans].[FK_TblCrusher_TblUser_New1]', 'F') IS NOT NULL
    ALTER TABLE [Trans].[TblCrusher] DROP CONSTRAINT [FK_TblCrusher_TblUser_New1];

-- Alter Columns for Crusher
ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN CreatedBy VARCHAR(50);
ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN UpdatedBy VARCHAR(50);

-- Drop Constraints for Blasting (Explicit Schema)
IF OBJECT_ID('[Trans].[FK_TblBlasting_TblUser]', 'F') IS NOT NULL
    ALTER TABLE [Trans].[TblBlasting] DROP CONSTRAINT [FK_TblBlasting_TblUser];

IF OBJECT_ID('[Trans].[FK_TblBlasting_TblUser1]', 'F') IS NOT NULL
    ALTER TABLE [Trans].[TblBlasting] DROP CONSTRAINT [FK_TblBlasting_TblUser1];

-- Alter Columns for Blasting
ALTER TABLE [Trans].[TblBlasting] ALTER COLUMN CreatedBy VARCHAR(50);
ALTER TABLE [Trans].[TblBlasting] ALTER COLUMN UpdatedBy VARCHAR(50);
