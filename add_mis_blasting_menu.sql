-- Add MIS Blasting to Menu if not exists
-- Using TblMenu (Assuming it works, else manual fix needed as per previous step)
IF NOT EXISTS (SELECT * FROM [Master].[TblMenu] WHERE MenuName = 'MIS Blasting')
BEGIN
    INSERT INTO [Master].[TblMenu] (MenuName, Link, Icon, ParentId, IsActive, Sequence)
    VALUES ('MIS Blasting', '/dashboard/reports/mis-blasting', 'FileText', 
           (SELECT SlNo FROM [Master].[TblMenu] WHERE MenuName = 'Reports'), 
           1, 16);
    PRINT 'Added MIS Blasting Menu';
END
ELSE
BEGIN
    PRINT 'MIS Blasting Menu already exists';
END
