
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const modules = await executeQuery(`SELECT * FROM [Master].[TblModule] WHERE IsDelete = 0 ORDER BY SortOrder`);
        const subGroups = await executeQuery(`SELECT * FROM [Master].[TblSubGroup] WHERE IsDelete = 0 ORDER BY SortOrder`);
        const pages = await executeQuery(`SELECT * FROM [Master].[TblPage] WHERE IsDelete = 0`);
        const allocations = await executeQuery(`SELECT * FROM [Master].[TblMenuAllocation] WHERE IsDelete = 0 ORDER BY SortOrder`);

        return NextResponse.json({ modules, subGroups, pages, allocations });
    } catch (error) {
        console.error("Error fetching menu data:", error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'create_subgroup') {
            const { moduleId, name } = body;
            await executeQuery(
                `INSERT INTO [Master].[TblSubGroup] (SubGroupName, ModuleId, CreatedBy) VALUES (@name, @moduleId, 'Admin')`,
                [
                    { name: 'name', type: 'NVarChar', value: name },
                    { name: 'moduleId', type: 'Int', value: moduleId }
                ]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'allocate_page') {
            const { pageId, moduleId, subGroupId } = body;

            // Check if allocation exists, update it, else insert
            // Actually, a page should strictly be in ONE place? Usually yes.
            // Let's delete old allocation for this page and insert new.

            // 1. Delete old
            await executeQuery(`DELETE FROM [Master].[TblMenuAllocation] WHERE PageId = @pageId`,
                [{ name: 'pageId', type: 'Int', value: pageId }]
            );

            // 2. Insert new
            await executeQuery(
                `INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, CreatedBy) VALUES (@moduleId, @subGroupId, @pageId, 'Admin')`,
                [
                    { name: 'moduleId', type: 'Int', value: moduleId },
                    { name: 'subGroupId', type: 'Int', value: subGroupId || null },
                    { name: 'pageId', type: 'Int', value: pageId }
                ]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'remove_allocation') {
            const { pageId } = body;
            await executeQuery(`DELETE FROM [Master].[TblMenuAllocation] WHERE PageId = @pageId`,
                [{ name: 'pageId', type: 'Int', value: pageId }]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'update_subgroup') {
            const { id, name, isActive } = body;
            // Build dynamic query depending on what's provided
            let query = `UPDATE [Master].[TblSubGroup] SET UpdatedDate = GETDATE()`;
            const params = [{ name: 'id', type: 'Int', value: id }];

            if (name) {
                query += `, SubGroupName = @name`;
                params.push({ name: 'name', type: 'NVarChar', value: name });
            }
            if (typeof isActive !== 'undefined') {
                query += `, IsActive = @isActive`;
                params.push({ name: 'isActive', type: 'Bit', value: isActive });
            }

            query += ` WHERE SlNo = @id`;
            await executeQuery(query, params);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete_subgroup') {
            const { id } = body;

            // Check if pages are assigned to this subgroup
            const check = await executeQuery(`SELECT TOP 1 1 FROM [Master].[TblMenuAllocation] WHERE SubGroupId = @id`,
                [{ name: 'id', type: 'Int', value: id }]
            );

            if (check.length > 0) {
                return NextResponse.json({ message: 'Cannot delete SubGroup: Pages are assigned to it.' }, { status: 400 });
            }

            // Soft Delete
            await executeQuery(`UPDATE [Master].[TblSubGroup] SET IsDelete = 1, UpdatedDate = GETDATE() WHERE SlNo = @id`,
                [{ name: 'id', type: 'Int', value: id }]
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error("Error in menu settings:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
