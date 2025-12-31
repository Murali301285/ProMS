IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Trans].[TblEquipmentReading]') AND name = 'OperatorId')
BEGIN
    ALTER TABLE [Trans].[TblEquipmentReading] ADD OperatorId INT;
    ALTER TABLE [Trans].[TblEquipmentReading] WITH CHECK ADD CONSTRAINT [FK_TblEquipmentReading_OperatorId] FOREIGN KEY([OperatorId]) REFERENCES [Master].[TblOperator] ([SlNo]);
    PRINT 'Added OperatorId column and Foreign Key';
END
ELSE
BEGIN
    PRINT 'OperatorId column already exists';
END
