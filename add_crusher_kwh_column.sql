IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblCrusher]') AND name = 'KWH')
BEGIN
    ALTER TABLE [Trans].[TblCrusher] ADD [KWH] DECIMAL(18, 3) NULL;
    PRINT 'Column KWH added to [Trans].[TblCrusher]'
END
ELSE
BEGIN
    PRINT 'Column KWH already exists in [Trans].[TblCrusher]'
END
