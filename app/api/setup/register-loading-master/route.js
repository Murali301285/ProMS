import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pagePath = '/dashboard/reports/loading-master';
        const pageName = 'Loading Master Report';

        // 1. Insert/Get Page
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

        // 2. Get Reports Module
        const modRes = await executeQuery(`SELECT SlNo FROM [Master].[TblModule] WHERE ModuleName = 'Reports'`);
        if (modRes.length === 0) return NextResponse.json({ message: 'Reports module not found' });
        const reportsModuleId = modRes[0].SlNo;

        // 3. Allocate
        const check = await executeQuery(`SELECT SlNo FROM [Master].[TblMenuAllocation] WHERE PageId = @pid`, [{ name: 'pid', type: 'Int', value: pageId }]);

        if (check.length === 0) {
            await executeQuery(`
                INSERT INTO [Master].[TblMenuAllocation] (ModuleId, PageId, CreatedBy)
                VALUES (@mid, @pid, 'System')
            `, [
                { name: 'mid', type: 'Int', value: reportsModuleId },
                { name: 'pid', type: 'Int', value: pageId }
            ]);
            return NextResponse.json({ success: true, message: 'Registered and Allocated Loading Master Report' });
        } else {
            return NextResponse.json({ success: true, message: 'Already registered' });
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
