
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const modules = await executeQuery("SELECT * FROM [Master].[TblModule] ORDER BY SortOrder");
        const subGroups = await executeQuery("SELECT * FROM [Master].[TblSubGroup] ORDER BY SortOrder");
        const pages = await executeQuery("SELECT TOP 20 * FROM [Master].[TblPage]");
        const allocations = await executeQuery("SELECT TOP 50 * FROM [Master].[TblMenuAllocation] ORDER BY ModuleId, SortOrder");

        return NextResponse.json({
            modules,
            subGroups,
            pagesCount: pages.length,
            samplePages: pages,
            allocations
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 200 }); // 200 to see error
    }
}
