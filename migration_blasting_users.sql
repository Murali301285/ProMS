USE [ProMS_Dev]
GO

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Alter CreatedBy Column
    ALTER TABLE [Trans].[TblBlasting] ALTER COLUMN [CreatedBy] INT NULL;
    PRINT 'Altered CreatedBy to INT';

    -- 2. Alter UpdatedBy Column
    ALTER TABLE [Trans].[TblBlasting] ALTER COLUMN [UpdatedBy] INT NULL;
    PRINT 'Altered UpdatedBy to INT';

    -- 3. Add Foreign Key for CreatedBy
    -- Check if constraint exists first to avoid error (optional but good practice)
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblBlasting_CreatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblBlasting]'))
    BEGIN
        ALTER TABLE [Trans].[TblBlasting]  WITH CHECK ADD  CONSTRAINT [FK_TblBlasting_CreatedBy] FOREIGN KEY([CreatedBy])
        REFERENCES [Master].[TblUser_New] ([SlNo])
        ALTER TABLE [Trans].[TblBlasting] CHECK CONSTRAINT [FK_TblBlasting_CreatedBy]
        PRINT 'Added FK_TblBlasting_CreatedBy';
    END

    -- 4. Add Foreign Key for UpdatedBy
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblBlasting_UpdatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblBlasting]'))
    BEGIN
        ALTER TABLE [Trans].[TblBlasting]  WITH CHECK ADD  CONSTRAINT [FK_TblBlasting_UpdatedBy] FOREIGN KEY([UpdatedBy])
        REFERENCES [Master].[TblUser_New] ([SlNo])
        ALTER TABLE [Trans].[TblBlasting] CHECK CONSTRAINT [FK_TblBlasting_UpdatedBy]
        PRINT 'Added FK_TblBlasting_UpdatedBy';
    END

    COMMIT TRANSACTION;
    PRINT 'Migration Successful';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Migration Failed';
    PRINT ERROR_MESSAGE();
END CATCH
GO
