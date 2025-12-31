
DECLARE @DrillPageId INT;
DECLARE @CrushPageId INT;

SELECT @DrillPageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/drilling-blasting';
SELECT @CrushPageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/crushing';

PRINT 'Drilling Page ID: ' + CAST(@DrillPageId AS VARCHAR);
PRINT 'Crushing Page ID: ' + CAST(@CrushPageId AS VARCHAR);

-- Check Roles
DECLARE @RoleCount INT;
SELECT @RoleCount = COUNT(*) FROM [Master].[TblRole_New] WHERE IsActive = 1;
PRINT 'Active Roles Found: ' + CAST(@RoleCount AS VARCHAR);

-- Force Insert for Drilling
INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @DrillPageId, 1, 1, 1, 1, 1
FROM [Master].[TblRole_New]
WHERE IsActive = 1
AND NOT EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = [Master].[TblRole_New].SlNo AND PageId = @DrillPageId);

PRINT 'inserted drilling auth rows: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- Force Insert for Crushing
INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @CrushPageId, 1, 1, 1, 1, 1
FROM [Master].[TblRole_New]
WHERE IsActive = 1
AND NOT EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = [Master].[TblRole_New].SlNo AND PageId = @CrushPageId);

PRINT 'inserted crushing auth rows: ' + CAST(@@ROWCOUNT AS VARCHAR);
