import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { roleId, permissions } = await req.json();

        if (!roleId || !Array.isArray(permissions)) {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
        }

        // We will process updates in a loop or bulk. 
        // For MSSQL, bulk merge is better, but loop is simpler for now.
        // We will utilize a transaction if possible, or just sequential updates.
        // Since we are using simple executeQuery, we'll do sequential upserts.

        for (const p of permissions) {
            if (p.Permissionid > 0) {
                // Update
                const updateQuery = `
                    UPDATE [Master].[TblRoleAuthorization_New]
                    SET IsView = @IsView, IsAdd = @IsAdd, IsEdit = @IsEdit, IsDelete = @IsDelete, UpdatedDate = GETDATE()
                    WHERE Permissionid = @Permissionid
                `;
                await executeQuery(updateQuery, [
                    { name: 'IsView', value: p.IsView },
                    { name: 'IsAdd', value: p.IsAdd },
                    { name: 'IsEdit', value: p.IsEdit },
                    { name: 'IsDelete', value: p.IsDelete },
                    { name: 'Permissionid', value: p.Permissionid }
                ]);
            } else {
                // Insert New Permission
                const insertQuery = `
                    INSERT INTO [Master].[TblRoleAuthorization_New] 
                    (RoleId, MenuId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
                    VALUES 
                    (@RoleId, NULL, @PageId, @IsView, @IsAdd, @IsEdit, @IsDelete, 1, 0, GETDATE())
                `;
                await executeQuery(insertQuery, [
                    { name: 'RoleId', value: roleId },
                    { name: 'PageId', value: p.PageId },
                    { name: 'IsView', value: p.IsView },
                    { name: 'IsAdd', value: p.IsAdd },
                    { name: 'IsEdit', value: p.IsEdit },
                    { name: 'IsDelete', value: p.IsDelete }
                ]);
            }
        }

        return NextResponse.json({ success: true, message: 'Permissions updated successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
