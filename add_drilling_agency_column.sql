IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblDrilling]') AND name = 'DrillingAgencyId')
BEGIN
    ALTER TABLE [Trans].[TblDrilling] ADD [DrillingAgencyId] INT NULL;
    
    ALTER TABLE [Trans].[TblDrilling]  WITH CHECK ADD  CONSTRAINT [FK_TblDrilling_TblDrillingAgency] FOREIGN KEY([DrillingAgencyId])
    REFERENCES [Master].[TblDrillingAgency] ([SlNo])

    ALTER TABLE [Trans].[TblDrilling] CHECK CONSTRAINT [FK_TblDrilling_TblDrillingAgency]

    PRINT 'Column DrillingAgencyId added to [Trans].[TblDrilling]'
END
ELSE
BEGIN
    PRINT 'Column DrillingAgencyId already exists in [Trans].[TblDrilling]'
END
