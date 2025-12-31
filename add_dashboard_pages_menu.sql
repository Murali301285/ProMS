
DECLARE @ModuleId INT;
DECLARE @DrillPageId INT;
DECLARE @CrushPageId INT;
DECLARE @SortOrder INT;

-- 1. Find 'Dashboard' Module
-- If not found, fall back to 'Reports' or first available? 
-- User said "Under Dashboard". 'Dashboard' usually is a module or just the home.
-- Let's check for 'Dashboard' module.
SELECT TOP 1 @ModuleId = SlNo FROM [Master].[TblModule] WHERE ModuleName = 'Dashboard';

-- If 'Dashboard' module doesn't exist, maybe it's treated differently?
-- But Sidebar.js iterates menuItems which come from menu-tree.
-- Let's assume there is a Dashboard module or we need to find the Main one.
-- Check if 'Dashboard' exists.
IF @ModuleId IS NULL
BEGIN
    SELECT TOP 1 @ModuleId = SlNo FROM [Master].[TblModule] WHERE ModuleName LIKE '%Dash%';
END

IF @ModuleId IS NULL
BEGIN
    PRINT 'Dashboard Module Not Found. Aborting.';
    RETURN;
END

PRINT 'Using Module ID: ' + CAST(@ModuleId AS VARCHAR);

-- 2. Insert Pages
-- Drilling
IF NOT EXISTS (SELECT 1 FROM [Master].[TblPage] WHERE PagePath = '/dashboard/drilling-blasting')
BEGIN
    INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete)
    VALUES ('Drilling & Blasting', '/dashboard/drilling-blasting', 1, 0);
    SET @DrillPageId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @DrillPageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/drilling-blasting';
END

-- Crushing
IF NOT EXISTS (SELECT 1 FROM [Master].[TblPage] WHERE PagePath = '/dashboard/crushing')
BEGIN
    INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete)
    VALUES ('Crushing', '/dashboard/crushing', 1, 0);
    SET @CrushPageId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CrushPageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/crushing';
END

-- 3. Menu Allocation
-- Get Max Sort Order
SELECT @SortOrder = ISNULL(MAX(SortOrder), 0) FROM [Master].[TblMenuAllocation] WHERE ModuleId = @ModuleId;

-- Allocate Drilling
IF NOT EXISTS (SELECT 1 FROM [Master].[TblMenuAllocation] WHERE PageId = @DrillPageId AND ModuleId = @ModuleId)
BEGIN
    SET @SortOrder = @SortOrder + 1;
    INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, IsActive, IsDelete)
    VALUES (@ModuleId, NULL, @DrillPageId, @SortOrder, 1, 0);
    PRINT 'Allocated Drilling';
END

-- Allocate Crushing
IF NOT EXISTS (SELECT 1 FROM [Master].[TblMenuAllocation] WHERE PageId = @CrushPageId AND ModuleId = @ModuleId)
BEGIN
    SET @SortOrder = @SortOrder + 1;
    INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, IsActive, IsDelete)
    VALUES (@ModuleId, NULL, @CrushPageId, @SortOrder, 1, 0);
    PRINT 'Allocated Crushing';
END

-- 4. Authorization (Grant ALL for now to ensure visibility)
INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @DrillPageId, 1, 1, 1, 1, 1
FROM [Master].[TblRole_New] AS R
WHERE R.IsActive = 1
AND NOT EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = R.SlNo AND PageId = @DrillPageId);

INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @CrushPageId, 1, 1, 1, 1, 1
FROM [Master].[TblRole_New] AS R
WHERE R.IsActive = 1
AND NOT EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = R.SlNo AND PageId = @CrushPageId);

PRINT 'Done.';
