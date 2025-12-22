
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

            // 1. Uniqueness Check
            const existing = await executeQuery(
                `SELECT TOP 1 1 FROM [Master].[TblSubGroup] WHERE ModuleId = @moduleId AND SubGroupName = @name AND IsDelete = 0`,
                [
                    { name: 'moduleId', type: 'Int', value: moduleId },
                    { name: 'name', type: 'NVarChar', value: name }
                ]
            );

            if (existing.length > 0) {
                return NextResponse.json({ message: 'SubGroup name already exists in this module.' }, { status: 400 });
            }

            // 2. Insert
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
            const { pageId, moduleId, subGroupId, sortOrder } = body;
            console.log("API: allocate_page called", { pageId, moduleId, subGroupId, sortOrder });

            // 1. Delete old
            await executeQuery(`DELETE FROM [Master].[TblMenuAllocation] WHERE PageId = @pageId`,
                [{ name: 'pageId', type: 'Int', value: pageId }]
            );

            // 2. Insert new
            // Default SortOrder to 0 if not provided
            const order = sortOrder ? parseInt(sortOrder) : 0;

            // Handle subGroupId: ensure it's null if falsy (but careful with 0 if 0 is valid, usually it's not)
            const sgId = subGroupId ? parseInt(subGroupId) : null;

            await executeQuery(
                `INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, CreatedBy) VALUES (@moduleId, @subGroupId, @pageId, @sortOrder, 'Admin')`,
                [
                    { name: 'moduleId', type: 'Int', value: moduleId },
                    { name: 'subGroupId', type: 'Int', value: sgId },
                    { name: 'pageId', type: 'Int', value: pageId },
                    { name: 'sortOrder', type: 'Int', value: order }
                ]
            );
            console.log("API: allocate_page success");
            return NextResponse.json({ success: true });
        }

        if (action === 'update_order') {
            const { pageId, sortOrder } = body;
            await executeQuery(
                `UPDATE [Master].[TblMenuAllocation] SET SortOrder = @sortOrder WHERE PageId = @pageId`,
                [
                    { name: 'pageId', type: 'Int', value: pageId },
                    { name: 'sortOrder', type: 'Int', value: sortOrder }
                ]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'update_all_orders') {
            const { updates } = body; // Array of { pageId, sortOrder }

            // Note: Efficient bulk update in SQL Server typically involves XML/JSON or specific TVP, 
            // but for a menu size loop is acceptable or a large CASE statement.
            // Let's use loop for simplicity as menu items < 100 usually. 
            // Better: Transaction.

            // We will construct a single big query or loop.
            // Given msnodesqlv8/mssql limit, let's just loop sequentially or parallel promise all.
            // Parallel is fine for ~20 items.

            const promises = updates.map(u =>
                executeQuery(
                    `UPDATE [Master].[TblMenuAllocation] SET SortOrder = @sortOrder WHERE PageId = @pageId`,
                    [
                        { name: 'pageId', type: 'Int', value: u.pageId },
                        { name: 'sortOrder', type: 'Int', value: u.sortOrder }
                    ]
                )
            );

            await Promise.all(promises);
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
            // Uniqueness check for rename
            if (name) {
                // Get current module id first to check
                // For safely, let's just assume we need to check against other subgroups in same module. 
                // But we don't know module ID easily without fetching.
                // Let's Skip rigorous UNIQUE check on rename for now unless requested strictly, or fetch it.
                // Strictly speaking: "Adding New Subgroup Name -> should be unique". Rename is arguably adding a name.
                // Let's implement it for safety.
                const current = await executeQuery(`SELECT ModuleId FROM [Master].[TblSubGroup] WHERE SlNo = @id`, [{ name: 'id', value: id }]);
                if (current.length > 0) {
                    const modId = current[0].ModuleId;
                    const existing = await executeQuery(
                        `SELECT TOP 1 1 FROM [Master].[TblSubGroup] WHERE ModuleId = @modId AND SubGroupName = @name AND SlNo != @id AND IsDelete = 0`,
                        [
                            { name: 'modId', value: modId },
                            { name: 'name', value: name },
                            { name: 'id', value: id }
                        ]
                    );
                    if (existing.length > 0) return NextResponse.json({ message: 'SubGroup name already exists.' }, { status: 400 });
                }
            }

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
