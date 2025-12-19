import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const roleId = 1; // Admin
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
            ORDER BY M.SortOrder, SG.SortOrder, MA.SortOrder
        `;

        const data = await executeQuery(query, [{ name: 'roleId', value: roleId }]);

        // Filter for our report
        const report = data.filter(r => r.PageName.includes('Rehandling'));

        return NextResponse.json({
            foundCount: report.length,
            rows: report
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
