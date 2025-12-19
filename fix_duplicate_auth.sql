DELETE FROM [Master].TblRoleAuthorization_New 
WHERE RoleId = 1 AND MenuId = 61 AND (PageId IS NULL OR PageId = 0);
PRINT 'Duplicate permission deleted.';
