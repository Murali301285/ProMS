USE [ProdMS_Test];
GO

-- 1. Rename ActivityName -> Name
IF EXISTS(SELECT * FROM sys.columns WHERE Name = N'ActivityName' AND Object_ID = Object_ID(N'[Master].[TblActivity]'))
BEGIN
    EXEC sp_rename 'Master.TblActivity.ActivityName', 'Name', 'COLUMN';
    PRINT 'Renamed ActivityName to Name';
END
ELSE
BEGIN
    PRINT 'Column ActivityName not found or already renamed.';
END
GO

-- 2. Add IsDetail Column
IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'IsDetail' AND Object_ID = Object_ID(N'[Master].[TblActivity]'))
BEGIN
    ALTER TABLE [Master].[TblActivity] ADD [IsDetail] [bit] DEFAULT 0;
    PRINT 'Added IsDetail column';
END
ELSE
BEGIN
    PRINT 'Column IsDetail already exists.';
END
GO
