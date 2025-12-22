DECLARE @ParentMenuID INT
DECLARE @MenuName NVARCHAR(100) = 'Drilling Agency'
DECLARE @MenuRouterLink NVARCHAR(100) = '/dashboard/master/drilling-agency'
DECLARE @MenuIcon NVARCHAR(50) = 'User' -- Generic User icon like Party

-- Get the Parent Menu ID for 'Master'
SELECT @ParentMenuID = MenuId FROM Master.TblMenuMaster WHERE Menuname = 'Masters'

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
    PRINT 'Parent Menu "Masters" not found.'
END
