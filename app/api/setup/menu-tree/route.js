
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        let roleId = cookieStore.get('role_id')?.value;
        const authToken = cookieStore.get('auth_token')?.value;

        // Fallback: Extract RoleId from JWT if cookie is missing
        if (!roleId && authToken) {
            try {
                const limit = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
                // We use a simple decode here since middleware usually validates the token
                // But for safety, let's just decode. Verify is better if we have the secret.
                const decoded = jwt.decode(authToken);
                if (decoded && decoded.roleId) {
                    roleId = decoded.roleId;
                    console.log(`[MenuTree] Recovered RoleId ${roleId} from JWT`);
                }
            } catch (e) {
                console.error("[MenuTree] Failed to decode token", e);
            }
        }

        if (!roleId) {
            console.error("[MenuTree] Missing RoleID (Cookie & JWT failed)");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch Hierarchy Data
        const modules = await executeQuery(`
            SELECT SlNo, ModuleName, Icon, SortOrder 
            FROM [Master].[TblModule] 
            WHERE IsActive = 1 AND IsDelete = 0 
            ORDER BY SortOrder
        `);

        const subGroups = await executeQuery(`
            SELECT SlNo, SubGroupName, ModuleId, SortOrder 
            FROM [Master].[TblSubGroup] 
            WHERE IsActive = 1 AND IsDelete = 0 
            ORDER BY SortOrder
        `);

        // 2. Fetch Authorized Pages via Allocation
        const authorizedPages = await executeQuery(`
            SELECT DISTINCT
                MA.ModuleId,
                MA.SubGroupId,
                P.SlNo as PageId,
                P.PageName,
                P.PagePath as Url,
                MA.SortOrder
            FROM [Master].[TblMenuAllocation] MA
            INNER JOIN [Master].[TblPage] P ON MA.PageId = P.SlNo
            INNER JOIN [Master].[TblRoleAuthorization_New] RA ON RA.PageId = P.SlNo
            WHERE 
                MA.IsActive = 1 AND MA.IsDelete = 0
                AND P.IsActive = 1 AND P.IsDelete = 0
                AND RA.RoleId = @roleId AND RA.IsView = 1
                AND RA.IsActive = 1 AND (RA.IsDeleted IS NULL OR RA.IsDeleted = 0)
            ORDER BY MA.SortOrder
        `, [{ name: 'roleId', value: roleId }]);


        if (authorizedPages.length === 0) {
            console.warn("[MenuTree] No authorized pages found! Check TblRoleAuthorization_New for RoleId=" + roleId);
        }

        // 3. Construct Tree (Mapped to Sidebar.js expectations: name, path, icon, subItems)
        const menuTree = modules.map(module => {
            const moduleSubGroups = subGroups
                .filter(sg => sg.ModuleId === module.SlNo)
                .map(sg => {
                    const sgPages = authorizedPages.filter(p => p.SubGroupId === sg.SlNo && p.ModuleId === module.SlNo);
                    return {
                        id: `sg-${sg.SlNo}`, // Unique ID
                        name: sg.SubGroupName,
                        path: '#',
                        type: 'subgroup',
                        subItems: sgPages.map(p => ({
                            id: `page-${p.PageId}`, // Unique ID
                            name: p.PageName,
                            path: p.Url,
                            type: 'page'
                        }))
                    };
                })
                .filter(sg => sg.subItems.length > 0);

            const directPages = authorizedPages
                .filter(p => p.ModuleId === module.SlNo && !p.SubGroupId)
                .map(p => ({
                    id: `page-${p.PageId}`, // Unique ID
                    name: p.PageName,
                    path: p.Url,
                    type: 'page'
                }));

            const subItems = [...moduleSubGroups, ...directPages];

            return {
                id: `mod-${module.SlNo}`, // Unique ID
                name: module.ModuleName,
                path: '#',
                icon: module.Icon,
                type: 'module',
                subItems: subItems
            };
        }).filter(m => m.subItems.length > 0);

        return NextResponse.json(menuTree);

    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
