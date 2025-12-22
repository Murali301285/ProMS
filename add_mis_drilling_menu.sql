-- Add MIS Drilling to Menu if not exists
IF NOT EXISTS (SELECT * FROM [Master].[TblMenu] WHERE MenuName = 'MIS Drilling')
BEGIN
    INSERT INTO [Master].[TblMenu] (MenuName, Link, Icon, ParentId, IsActive, Sequence)
    VALUES ('MIS Drilling', '/dashboard/reports/mis-drilling', 'FileText', 
           (SELECT SlNo FROM [Master].[TblMenu] WHERE MenuName = 'Reports'), 
           1, 15); -- Adjust sequence as needed
    PRINT 'Added MIS Drilling Menu';
END
ELSE
BEGIN
    PRINT 'MIS Drilling Menu already exists';
END
