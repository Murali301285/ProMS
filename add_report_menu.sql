IF NOT EXISTS (SELECT 1 FROM [Master].TblMenuMaster WHERE Url = '/dashboard/reports')
BEGIN
    INSERT INTO [Master].TblMenuMaster (Menuname, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsActive, Icon, Module, Controller, Method, IsMobile)
    VALUES ('Reports', '/dashboard/reports', NULL, 1, 95, GETDATE(), 0, 1, 'FileText', 'Reports', 'Reports', 'Index', 0);
    PRINT 'Reports menu added successfully.';
END
ELSE
BEGIN
    PRINT 'Reports menu already exists.';
END
