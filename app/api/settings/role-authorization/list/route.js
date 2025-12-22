import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { roleId } = await req.json();

        if (!roleId) {
            return NextResponse.json({ message: 'Role ID required' }, { status: 400 });
        }

        // Fetch All Menus and existing permissions for the role
        // Fetch Menu Structure linked with Page Permissions
        const query = `
            SELECT 
                MA.SlNo as AllocationId,
                M.ModuleName,
                M.SlNo as ModuleId,
                SG.SubGroupName,
                SG.SlNo as SubGroupId,
                P.PageName,
                P.SlNo as PageId,
                ISNULL(RA.Permissionid, 0) as Permissionid,
                ISNULL(RA.IsView, 0) as IsView,
                ISNULL(RA.IsAdd, 0) as IsAdd,
                ISNULL(RA.IsEdit, 0) as IsEdit,
                ISNULL(RA.IsDelete, 0) as IsDelete
            FROM [Master].[TblMenuAllocation] MA
            JOIN [Master].[TblModule] M ON MA.ModuleId = M.SlNo
            LEFT JOIN [Master].[TblSubGroup] SG ON MA.SubGroupId = SG.SlNo
            JOIN [Master].[TblPage] P ON MA.PageId = P.SlNo
            LEFT JOIN [Master].[TblRoleAuthorization_New] RA 
                ON P.SlNo = RA.PageId AND RA.RoleId = @roleId AND RA.IsActive = 1 AND RA.IsDeleted = 0
            WHERE MA.IsActive = 1 AND MA.IsDelete = 0
            ORDER BY M.SortOrder, SG.SortOrder, MA.SortOrder, P.PageName ASC
        `;

        const data = await executeQuery(query, [{ name: 'roleId', value: roleId }]);

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
