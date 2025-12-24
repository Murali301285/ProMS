
DECLARE @ModuleId INT;
DECLARE @PageId INT;
DECLARE @SortOrder INT;

-- 1. Get Module ID for 'Reports' (Assuming it exists, if not, find closest match or create?)
SELECT TOP 1 @ModuleId = SlNo FROM [Master].[TblModule] WHERE ModuleName LIKE '%Report%' OR ModuleName = 'Reports';

IF @ModuleId IS NULL
BEGIN
    PRINT 'Reports Module Not Found. Skipping Menu Allocation.';
    RETURN;
END

-- 2. Insert Page
IF NOT EXISTS (SELECT 1 FROM [Master].[TblPage] WHERE PagePath = '/dashboard/reports/water-tanker-entry')
BEGIN
    INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete)
    VALUES ('Water Tanker Entry Report', '/dashboard/reports/water-tanker-entry', 1, 0);
    
    SET @PageId = SCOPE_IDENTITY();
    PRINT 'Inserted Page ID: ' + CAST(@PageId as VARCHAR);
END
ELSE
BEGIN
    SELECT @PageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/reports/water-tanker-entry';
    PRINT 'Page already exists, ID: ' + CAST(@PageId as VARCHAR);
END

-- 3. Menu Allocation
IF NOT EXISTS (SELECT 1 FROM [Master].[TblMenuAllocation] WHERE PageId = @PageId AND ModuleId = @ModuleId)
BEGIN
    SELECT @SortOrder = ISNULL(MAX(SortOrder), 0) + 1 FROM [Master].[TblMenuAllocation] WHERE ModuleId = @ModuleId;
    
    INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, IsActive, IsDelete)
    VALUES (@ModuleId, NULL, @PageId, @SortOrder, 1, 0);
    PRINT 'Inserted Menu Allocation';
END

-- 4. Authorization (Grant View Access to All Active Roles)
INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @PageId, 1, 0, 0, 0, 1
FROM [Master].[TblRole_New] AS R
WHERE R.IsActive = 1
AND NOT EXISTS (
    SELECT 1 FROM [Master].[TblRoleAuthorization_New] 
    WHERE RoleId = R.SlNo AND PageId = @PageId
);
PRINT 'Granted Authorization to Roles';
