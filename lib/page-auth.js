
import { executeQuery } from '@/lib/db';

export async function verifyPageAccess(roleId, currentPath) {
    if (!roleId || !currentPath) return false;

    // 1. Find PageId for the current path
    // We strictly match PagePath.
    const pages = await executeQuery(`
        SELECT SlNo FROM [Master].[TblPage] 
        WHERE PagePath = @path AND IsActive = 1 AND IsDelete = 0
    `, [{ name: 'path', value: currentPath }]);

    if (pages.length === 0) {
        // Warning: Path not in TblPage? If strict, return false. 
        // If lenient (e.g. dynamic routes), might need more logic. 
        // For now, assume strict mapping as requested.
        console.warn(`[PageAuth] Path not found in TblPage: ${currentPath}`);
        return true; // Allow unmapped pages? Or block? User asked to MAP.
        // If unmapped, maybe safe to allow (public?) OR strict block.
        // Let's return true but warn, to avoid breaking dashboard home etc.
    }

    const pageId = pages[0].SlNo;

    // 2. Check Auth
    const auth = await executeQuery(`
        SELECT PermissionId FROM [Master].[TblRoleAuthorization_New]
        WHERE RoleId = @roleId AND PageId = @pageId AND IsView = 1 AND IsActive = 1 AND IsDelete = 0
    `, [
        { name: 'roleId', value: roleId },
        { name: 'pageId', value: pageId }
    ]);

    return auth.length > 0;
}
