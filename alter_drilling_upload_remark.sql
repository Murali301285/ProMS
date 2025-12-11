
IF NOT EXISTS (
  SELECT * FROM sys.columns 
  WHERE object_id = OBJECT_ID(N'[Master].[TblDrillingRemarks]') 
  AND name = 'UploadRemark'
)
BEGIN
    ALTER TABLE [Master].[TblDrillingRemarks]
    ADD [UploadRemark] [nvarchar](255) NULL;
END
GO
