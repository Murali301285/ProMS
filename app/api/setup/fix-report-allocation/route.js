import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get 'Reports' Module ID
        const modRes = await executeQuery(`SELECT SlNo, ModuleName FROM [Master].[TblModule] WHERE ModuleName = 'Reports'`);
        if (modRes.length === 0) return NextResponse.json({ message: 'Reports module not found' });

        const reportsModuleId = modRes[0].SlNo;
        console.log('Reports Module ID:', reportsModuleId);

        // 2. Move Page 54 to Reports Module
        const pageId = 54;

        await executeQuery(`
            UPDATE [Master].[TblMenuAllocation]
            SET ModuleId = @mid, UpdatedDate = GETDATE()
            WHERE PageId = @pid
        `, [
            { name: 'mid', type: 'Int', value: reportsModuleId },
            { name: 'pid', type: 'Int', value: pageId }
        ]);

        return NextResponse.json({
            success: true,
            message: `Moved Page ID ${pageId} to Module ID ${reportsModuleId} (Reports)`
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
