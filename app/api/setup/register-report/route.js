import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 1. Insert Page if not exists
        const pagePath = '/dashboard/reports/material-rehandling';
        const pageName = 'Material Rehandling Report';

        // Check if exists
        let page = await executeQuery(`SELECT SlNo FROM [Master].[TblPage] WHERE PagePath = @path`, [{ name: 'path', value: pagePath }]);

        let pageId;
        if (page.length === 0) {
            const insertPage = await executeQuery(`
                INSERT INTO [Master].[TblPage] (PageName, PagePath, CreatedBy) 
                OUTPUT INSERTED.SlNo
                VALUES (@name, @path, 'System')
            `, [
                { name: 'name', value: pageName },
                { name: 'path', value: pagePath }
            ]);
            pageId = insertPage[0].SlNo;
        } else {
            pageId = page[0].SlNo;
        }

        // 2. Find Reports Module
        const module = await executeQuery(`SELECT SlNo FROM [Master].[TblModule] WHERE ModuleName = 'Reports'`);
        if (module.length === 0) {
            return NextResponse.json({ message: 'Reports module not found' });
        }
        const moduleId = module[0].SlNo;

        // 3. Allocate (Check availability first)
        const allocation = await executeQuery(`SELECT SlNo FROM [Master].[TblMenuAllocation] WHERE PageId = @pageId`,
            [{ name: 'pageId', type: 'Int', value: pageId }]
        );

        if (allocation.length === 0) {
            await executeQuery(`
                INSERT INTO [Master].[TblMenuAllocation] (ModuleId, PageId, CreatedBy)
                VALUES (@moduleId, @pageId, 'System')
            `, [
                { name: 'moduleId', type: 'Int', value: moduleId },
                { name: 'pageId', type: 'Int', value: pageId }
            ]);
            return NextResponse.json({ success: true, message: 'Page Registered and Allocated to Reports' });
        } else {
            return NextResponse.json({ success: true, message: 'Page already allocated' });
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
