-- Migration to convert User columns to INT and add Foreign Keys for TblCrusher

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Alter CreatedBy to INT
    ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN [CreatedBy] INT NULL;
    PRINT 'Altered CreatedBy to INT';

    -- 2. Alter UpdatedBy to INT
    ALTER TABLE [Trans].[TblCrusher] ALTER COLUMN [UpdatedBy] INT NULL;
    PRINT 'Altered UpdatedBy to INT';

    -- 3. Add Foreign Key for CreatedBy
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblCrusher_CreatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblCrusher]'))
    BEGIN
        ALTER TABLE [Trans].[TblCrusher] WITH CHECK ADD CONSTRAINT [FK_TblCrusher_CreatedBy] FOREIGN KEY([CreatedBy])
        REFERENCES [Master].[TblUser_New] ([SlNo]);
        
        ALTER TABLE [Trans].[TblCrusher] CHECK CONSTRAINT [FK_TblCrusher_CreatedBy];
        PRINT 'Added FK_TblCrusher_CreatedBy';
    END

    -- 4. Add Foreign Key for UpdatedBy
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblCrusher_UpdatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblCrusher]'))
    BEGIN
        ALTER TABLE [Trans].[TblCrusher] WITH CHECK ADD CONSTRAINT [FK_TblCrusher_UpdatedBy] FOREIGN KEY([UpdatedBy])
        REFERENCES [Master].[TblUser_New] ([SlNo]);
        
        ALTER TABLE [Trans].[TblCrusher] CHECK CONSTRAINT [FK_TblCrusher_UpdatedBy];
        PRINT 'Added FK_TblCrusher_UpdatedBy';
    END

    COMMIT TRANSACTION;
    PRINT 'Migration Successful';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Migration Failed';
    PRINT ERROR_MESSAGE();
END CATCH;
