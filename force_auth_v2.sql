
DECLARE @DrillPageId INT;
DECLARE @CrushPageId INT;

SELECT @DrillPageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/drilling-blasting';
SELECT @CrushPageId = SlNo FROM [Master].[TblPage] WHERE PagePath = '/dashboard/crushing';

PRINT 'Drill Page: ' + CAST(@DrillPageId AS VARCHAR);

-- Force Insert for Role 1 (Admin) first to test
INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
VALUES (1, @DrillPageId, 1, 1, 1, 1, 1);

INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
VALUES (1, @CrushPageId, 1, 1, 1, 1, 1);

-- Force Insert for ALL other roles
INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @DrillPageId, 1, 1, 1, 1, 1
FROM [Master].[TblRole_New] AS R
WHERE R.SlNo <> 1 AND IsActive = 1;

INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive)
SELECT SlNo, @CrushPageId, 1, 1, 1, 1, 1
FROM [Master].[TblRole_New] AS R
WHERE R.SlNo <> 1 AND IsActive = 1;

SELECT count(*) as NewAuthCount FROM [Master].[TblRoleAuthorization_New] WHERE PageId IN (@DrillPageId, @CrushPageId);
