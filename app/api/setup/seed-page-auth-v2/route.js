
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get All Pages
        const pages = await executeQuery("SELECT SlNo, PageName FROM [Master].[TblPage] WHERE IsDelete = 0");
        let results = [];

        for (const page of pages) {
            // Check if Auth exists for Role 1 and PageId
            const check = await executeQuery(
                "SELECT PermissionId FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = 1 AND PageId = @pageId",
                [{ name: 'pageId', value: page.SlNo }]
            );

            if (check.length === 0) {
                // Insert
                await executeQuery(`
                    INSERT INTO [Master].[TblRoleAuthorization_New] 
                    (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate, UpdatedDate)
                    VALUES 
                    (1, @pageId, 1, 1, 1, 1, 1, 0, GETDATE(), GETDATE())
                `, [{ name: 'pageId', value: page.SlNo }]);
                results.push(`Added Auth for Page: ${page.PageName} (ID: ${page.SlNo})`);
            } else {
                results.push(`Auth exists for Page: ${page.PageName}`);
            }
        }

        return NextResponse.json({ message: "Seed Complete", logs: results });
    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 200 });
    }
}
