
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get all Pages
        const pages = await executeQuery("SELECT SlNo FROM [Master].[TblPage] WHERE IsDelete = 0");
        const roleId = 1; // Admin

        let count = 0;
        for (const page of pages) {
            // Check if exists
            const exists = await executeQuery(
                "SELECT PermissionId FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = @roleId AND PageId = @pageId",
                [{ name: 'roleId', value: roleId }, { name: 'pageId', value: page.SlNo }]
            );

            if (exists.length === 0) {
                await executeQuery(`
                    INSERT INTO [Master].[TblRoleAuthorization_New]
                    (RoleId, MenuId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate, UpdatedDate)
                    VALUES
                    (@roleId, NULL, @pageId, 1, 1, 1, 0, 1, 0, GETDATE(), GETDATE())
                `, [
                    { name: 'roleId', value: roleId },
                    { name: 'pageId', value: page.SlNo }
                ]);
                count++;
            }
        }

        return NextResponse.json({ message: "Admin Access Granted", new_allocations: count });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
