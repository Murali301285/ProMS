
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblStrata]') AND type in (N'U'))
BEGIN
    CREATE TABLE [Master].[TblStrata](
        [SlNo] [bigint] IDENTITY(1,1) NOT NULL,
        [Strata] [nvarchar](100) NOT NULL,
        [Remarks] [nvarchar](max) NULL,
        [IsActive] [bit] NULL DEFAULT ((1)),
        [IsDelete] [bit] NULL DEFAULT ((0)),
        [CreatedBy] [bigint] NULL,
        [CreatedDate] [datetime] NULL DEFAULT (getdate()),
        [UpdatedBy] [bigint] NULL,
        [UpdatedDate] [datetime] NULL,
     CONSTRAINT [PK_TblStrata] PRIMARY KEY CLUSTERED 
    (
        [SlNo] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblDrilling]') AND name = 'Remarks')
BEGIN
    ALTER TABLE [Trans].[TblDrilling] ADD [Remarks] NVARCHAR(MAX) NULL
END
