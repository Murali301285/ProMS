DECLARE @ParentMenuID INT
DECLARE @MenuName NVARCHAR(100) = 'Production TSMPL'
DECLARE @MenuRouterLink NVARCHAR(100) = '/dashboard/reports/production-tsmpl'
DECLARE @MenuIcon NVARCHAR(50) = 'FileText'

-- Get the Parent Menu ID for 'Reports'
SELECT @ParentMenuID = MenuId FROM Master.TblMenuMaster WHERE Menuname = 'Reports'

IF @ParentMenuID IS NOT NULL
BEGIN
    -- Check if the menu item already exists
    IF NOT EXISTS (SELECT 1 FROM Master.TblMenuMaster WHERE Menuname = @MenuName AND Parentid = @ParentMenuID)
    BEGIN
        INSERT INTO Master.TblMenuMaster (Menuname, Url, Icon, Parentid, Ismenu, Sortby, IsDelete, IsMobile)
        VALUES (@MenuName, @MenuRouterLink, @MenuIcon, @ParentMenuID, 1, 
               (SELECT ISNULL(MAX(Sortby), 0) + 1 FROM Master.TblMenuMaster WHERE Parentid = @ParentMenuID), 0, 0)
        
        PRINT 'Menu item added successfully.'
    END
    ELSE
    BEGIN
        PRINT 'Menu item already exists.'
    END
END
ELSE
BEGIN
    PRINT 'Parent Menu "Reports" not found.'
END
