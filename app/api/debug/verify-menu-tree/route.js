
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const roleId = 1; // Hardcoded Admin

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
            SELECT 
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
                AND RA.IsActive = 1 AND RA.IsDelete = 0
            ORDER BY MA.SortOrder
        `, [{ name: 'roleId', value: roleId }]);

        // 3. Construct Tree
        const menuTree = modules.map(module => {
            const moduleSubGroups = subGroups
                .filter(sg => sg.ModuleId === module.SlNo)
                .map(sg => {
                    const sgPages = authorizedPages.filter(p => p.SubGroupId === sg.SlNo && p.ModuleId === module.SlNo);
                    return {
                        id: sg.SlNo,
                        title: sg.SubGroupName,
                        type: 'subgroup',
                        children: sgPages.map(p => ({
                            id: p.PageId,
                            title: p.PageName,
                            url: p.Url,
                            type: 'page'
                        }))
                    };
                })
                .filter(sg => sg.children.length > 0);

            const directPages = authorizedPages
                .filter(p => p.ModuleId === module.SlNo && !p.SubGroupId)
                .map(p => ({
                    id: p.PageId,
                    title: p.PageName,
                    url: p.Url,
                    type: 'page'
                }));

            const children = [...moduleSubGroups, ...directPages];

            return {
                id: module.SlNo,
                title: module.ModuleName,
                icon: module.Icon,
                type: 'module',
                children: children
            };
        }).filter(m => m.children.length > 0);

        // DEBUG: Return raw data to see what's wrong
        return NextResponse.json({
            modules,
            subGroups,
            authorizedPagesCount: authorizedPages.length,
            authorizedPagesSample: authorizedPages.slice(0, 5),
            tree: menuTree
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
