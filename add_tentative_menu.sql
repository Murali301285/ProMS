
DECLARE @ParentId INT;
SELECT @ParentId = SlNo FROM [Master].TblMenuMaster WHERE Menuname = 'Reports' OR Url = '/dashboard/reports';

IF @ParentId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Master].TblMenuMaster WHERE Url = '/dashboard/reports/tentative-production')
    BEGIN
        INSERT INTO [Master].TblMenuMaster (Menuname, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsActive, Icon, Module, Controller, Method, IsMobile)
        VALUES ('Tentative Production Qty', '/dashboard/reports/tentative-production', @ParentId, 1, 100, GETDATE(), 0, 1, 'FileText', 'Reports', 'TentativeProduction', 'Index', 0);
        PRINT 'Tentative Production Qty menu added.';
    END
    ELSE
    BEGIN
        PRINT 'Menu already exists.';
    END
END
ELSE
BEGIN
    PRINT 'Parent Menu Reports not found.';
END
