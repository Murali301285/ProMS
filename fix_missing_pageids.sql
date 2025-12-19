UPDATE RA
SET RA.PageId = P.SlNo
FROM [Master].[TblRoleAuthorization_New] RA
INNER JOIN [Master].[TblMenuMaster] M ON RA.MenuId = M.MenuId
INNER JOIN [Master].[TblPage] P ON P.PagePath = M.Url
WHERE (RA.PageId IS NULL OR RA.PageId = 0);

PRINT 'Fixed missing PageIds.';
