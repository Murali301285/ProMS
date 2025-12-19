DECLARE @ModuleId INT = 5; -- Reports
DECLARE @PageName NVARCHAR(100) = 'Reports Dashboard';
DECLARE @PagePath NVARCHAR(255) = '/dashboard/reports';
DECLARE @RoleId INT = 1; -- Admin/SuperUser default

DECLARE @PageId INT;

-- 1. Ensure Page Exists
IF NOT EXISTS (SELECT 1 FROM [Master].TblPage WHERE PagePath = @PagePath)
BEGIN
    INSERT INTO [Master].TblPage (PageName, PagePath, IsActive, IsDelete, CreatedDate, CreatedBy)
    VALUES (@PageName, @PagePath, 1, 0, GETDATE(), 1);
    SET @PageId = SCOPE_IDENTITY();
    PRINT 'Page inserted with ID: ' + CAST(@PageId AS VARCHAR);
END
ELSE
BEGIN
    SELECT @PageId = SlNo FROM [Master].TblPage WHERE PagePath = @PagePath;
    PRINT 'Page already exists with ID: ' + CAST(@PageId AS VARCHAR);
END

-- 2. Allocate to Module
IF NOT EXISTS (SELECT 1 FROM [Master].TblMenuAllocation WHERE PageId = @PageId AND ModuleId = @ModuleId)
BEGIN
    INSERT INTO [Master].TblMenuAllocation (ModuleId, SubGroupId, PageId, SortOrder, IsActive, IsDelete, CreatedBy, CreatedDate)
    VALUES (@ModuleId, NULL, @PageId, 1, 1, 0, '1', GETDATE());
    PRINT 'Menu Allocation created.';
END
ELSE
BEGIN
    PRINT 'Menu Allocation already exists.';
END

-- 3. Authorize Role
IF NOT EXISTS (SELECT 1 FROM [Master].TblRoleAuthorization_New WHERE RoleId = @RoleId AND PageId = @PageId)
BEGIN
    INSERT INTO [Master].TblRoleAuthorization_New (RoleId, PageId, MenuId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
    VALUES (@RoleId, @PageId, 61, 1, 1, 1, 1, 1, 0, GETDATE());
    PRINT 'Role Authorization granted.';
END
ELSE
BEGIN
    PRINT 'Role Authorization already exists.';
END
