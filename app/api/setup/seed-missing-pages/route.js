
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const logs = [];

        // 1. Ensure Modules exist
        const modules = [
            { name: 'Dashboard', icon: 'Home', sort: 1 },
            { name: 'Authorization', icon: 'ShieldCheck', sort: 3 }, // Adjusted sort
            { name: 'Settings', icon: 'Settings', sort: 99 }
        ];

        for (const m of modules) {
            const exists = await executeQuery("SELECT SlNo FROM [Master].[TblModule] WHERE ModuleName = @name", [{ name: 'name', value: m.name }]);
            if (exists.length === 0) {
                await executeQuery("INSERT INTO [Master].[TblModule] (ModuleName, Icon, SortOrder, IsActive, IsDelete, CreatedBy) VALUES (@name, @icon, @sort, 1, 0, 'System')",
                    [{ name: 'name', value: m.name }, { name: 'icon', value: m.icon }, { name: 'sort', value: m.sort }]);
                logs.push(`Created Module: ${m.name}`);
            }
        }

        // Refetch Modules to get IDs
        const allModules = await executeQuery("SELECT SlNo, ModuleName FROM [Master].[TblModule]");
        const findModId = (name) => allModules.find(m => m.ModuleName === name)?.SlNo;

        // 2. Ensure Pages exist
        const pages = [
            { name: 'Home', path: '/dashboard', module: 'Dashboard' },

            { name: 'Authorization', path: '/dashboard/settings/user-management/authorization', module: 'Authorization' },
            { name: 'Role', path: '/dashboard/settings/user-management/role', module: 'Authorization' },
            { name: 'User', path: '/dashboard/settings/user-management/user', module: 'Authorization' },

            { name: 'Menu Allocation', path: '/dashboard/settings/menu-allocation', module: 'Settings' },
            { name: 'Menus', path: '/dashboard/settings/menus', module: 'Settings' },
            { name: 'Sub Menus', path: '/dashboard/settings/sub-menus', module: 'Settings' },
            { name: 'DB Config', path: '/dashboard/settings/db-config', module: 'Settings' },
            { name: 'Audit Logs', path: '/dashboard/settings/audit-logs', module: 'Settings' },
            { name: 'System Logs', path: '/dashboard/settings/system-logs', module: 'Settings' }
        ];

        for (const p of pages) {
            const pageExists = await executeQuery("SELECT SlNo FROM [Master].[TblPage] WHERE PagePath = @path", [{ name: 'path', value: p.path }]);
            let pageId;

            if (pageExists.length === 0) {
                await executeQuery("INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete, CreatedBy) VALUES (@name, @path, 1, 0, 'System')",
                    [{ name: 'name', value: p.name }, { name: 'path', value: p.path }]);
                logs.push(`Created Page: ${p.name}`);

                // Get the ID
                const newPage = await executeQuery("SELECT SlNo FROM [Master].[TblPage] WHERE PagePath = @path", [{ name: 'path', value: p.path }]);
                pageId = newPage[0].SlNo;
            } else {
                pageId = pageExists[0].SlNo;
            }

            // 3. Ensure Allocation
            const modId = findModId(p.module);
            if (modId) {
                const allocExists = await executeQuery("SELECT SlNo FROM [Master].[TblMenuAllocation] WHERE PageId = @pageId", [{ name: 'pageId', value: pageId }]);
                if (allocExists.length === 0) {
                    await executeQuery("INSERT INTO [Master].[TblMenuAllocation] (ModuleId, PageId, SortOrder, IsActive, IsDelete, CreatedBy) VALUES (@modId, @pageId, 0, 1, 0, 'System')",
                        [{ name: 'modId', value: modId }, { name: 'pageId', value: pageId }]);
                    logs.push(`Allocated Page: ${p.name} to ${p.module}`);
                }
            }
        }

        return NextResponse.json({ message: "Seed Missing Menus Complete", logs });
    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 200 });
    }
}
