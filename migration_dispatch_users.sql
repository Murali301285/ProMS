BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Check if Foreign Key already exists and drop it if necessary (Clean slate)
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblDispatchEntry_CreatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblDispatchEntry]'))
        ALTER TABLE [Trans].[TblDispatchEntry] DROP CONSTRAINT [FK_TblDispatchEntry_CreatedBy];

    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblDispatchEntry_UpdatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblDispatchEntry]'))
        ALTER TABLE [Trans].[TblDispatchEntry] DROP CONSTRAINT [FK_TblDispatchEntry_UpdatedBy];

    -- 2. Alter CreatedBy Column
    -- First, ensure no invalid data exists (we checked this, but good practice to handle or assume clean)
    -- We assume data is clean numeric or NULL.
    ALTER TABLE [Trans].[TblDispatchEntry] ALTER COLUMN [CreatedBy] INT NULL;

    -- 3. Alter UpdatedBy Column
    ALTER TABLE [Trans].[TblDispatchEntry] ALTER COLUMN [UpdatedBy] INT NULL;

    -- 4. Add Foreign Keys
    ALTER TABLE [Trans].[TblDispatchEntry]  WITH CHECK ADD  CONSTRAINT [FK_TblDispatchEntry_CreatedBy] FOREIGN KEY([CreatedBy])
    REFERENCES [Master].[TblUser_New] ([SlNo]);

    ALTER TABLE [Trans].[TblDispatchEntry] CHECK CONSTRAINT [FK_TblDispatchEntry_CreatedBy];

    ALTER TABLE [Trans].[TblDispatchEntry]  WITH CHECK ADD  CONSTRAINT [FK_TblDispatchEntry_UpdatedBy] FOREIGN KEY([UpdatedBy])
    REFERENCES [Master].[TblUser_New] ([SlNo]);

    ALTER TABLE [Trans].[TblDispatchEntry] CHECK CONSTRAINT [FK_TblDispatchEntry_UpdatedBy];

    COMMIT TRANSACTION;
    PRINT 'Migration for TblDispatchEntry (CreatedBy, UpdatedBy) completed successfully.';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred: ' + ERROR_MESSAGE();
END CATCH;
