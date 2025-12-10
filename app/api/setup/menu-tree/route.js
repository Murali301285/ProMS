
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Fetch Modules
        const modules = await executeQuery(`
            SELECT SlNo, ModuleName, Icon, SortOrder 
            FROM [Master].[TblModule] 
            WHERE IsActive = 1 AND IsDelete = 0
            ORDER BY SortOrder
        `);

        // Fetch SubGroups
        const subGroups = await executeQuery(`
            SELECT SlNo, SubGroupName, ModuleId 
            FROM [Master].[TblSubGroup] 
            WHERE IsActive = 1 AND IsDelete = 0
            ORDER BY SortOrder
        `);

        // Fetch Allocation (Pages)
        const allocations = await executeQuery(`
            SELECT ma.ModuleId, ma.SubGroupId, p.PageName, p.PagePath 
            FROM [Master].[TblMenuAllocation] ma
            JOIN [Master].[TblPage] p ON ma.PageId = p.SlNo
            WHERE p.IsActive = 1 AND p.IsDelete = 0 AND ma.IsDelete = 0
            ORDER BY ma.SortOrder
        `);

        // Build Tree Structure
        const menuTree = modules.map(mod => {
            const modSubGroups = subGroups.filter(sg => sg.ModuleId === mod.SlNo);
            const modPages = allocations.filter(a => a.ModuleId === mod.SlNo && !a.SubGroupId);

            // Format SubGroups with their pages
            const formattedSubItems = modSubGroups.map(sg => {
                const subPages = allocations.filter(a => a.SubGroupId === sg.SlNo);
                return {
                    name: sg.SubGroupName,
                    path: '#', // Subgroups are expandable folders
                    subItems: subPages.map(p => ({
                        name: p.PageName,
                        path: p.PagePath
                    }))
                };
            });

            // Direct pages
            const directPages = modPages.map(p => ({
                name: p.PageName,
                path: p.PagePath
            }));

            // If a module has no children, logic for direct link? (Usually dashboard)
            let path = '#';
            if (mod.ModuleName === 'Dashboard') path = '/dashboard';

            return {
                name: mod.ModuleName,
                icon: mod.Icon,
                path: path,
                subItems: [...formattedSubItems, ...directPages]
            };
        });

        return NextResponse.json(menuTree);
    } catch (error) {
        console.error("Error fetching menu tree:", error);
        return NextResponse.json({ message: 'Error fetching menu' }, { status: 500 });
    }
}
