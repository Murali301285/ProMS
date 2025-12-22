
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cookieStore = await cookies();
        let roleId = cookieStore.get('role_id')?.value;
        const authToken = cookieStore.get('auth_token')?.value;

        // Fallback: Extract RoleId from JWT if cookie is missing
        if (!roleId && authToken) {
            try {
                const decoded = jwt.decode(authToken);
                if (decoded && decoded.roleId) {
                    roleId = decoded.roleId;
                }
            } catch (e) {
                console.error("[GlobalSearch] Failed to decode token", e);
            }
        }

        if (!roleId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch ALL Pages (Active) + Permission Status for current Role
        // Left Join generic permission table? 
        // Or simply: TblPage LEFT JOIN TblRoleAuthorization on PageId & RoleId

        const query = `
            SELECT 
                P.SlNo as PageId,
                P.PageName,
                P.PagePath,
                M.ModuleName,
                SG.SubGroupName,
                ISNULL(RA.IsView, 0) as IsView
            FROM [Master].[TblPage] P
            INNER JOIN [Master].[TblMenuAllocation] MA ON MA.PageId = P.SlNo
            INNER JOIN [Master].[TblModule] M ON MA.ModuleId = M.SlNo
            LEFT JOIN [Master].[TblSubGroup] SG ON MA.SubGroupId = SG.SlNo
            LEFT JOIN [Master].[TblRoleAuthorization_New] RA 
                ON P.SlNo = RA.PageId AND RA.RoleId = @roleId AND RA.IsActive = 1 AND (RA.IsDeleted IS NULL OR RA.IsDeleted = 0)
            WHERE 
                P.IsActive = 1 AND P.IsDelete = 0
                AND MA.IsActive = 1 AND MA.IsDelete = 0
            ORDER BY P.PageName
        `;

        const pages = await executeQuery(query, [{ name: 'roleId', value: roleId }]);

        const result = pages.map(p => ({
            id: p.PageId,
            name: p.PageName,
            path: p.PagePath,
            module: p.ModuleName,
            subGroup: p.SubGroupName,
            isAuthorized: !!p.IsView // Boolean conversion
        }));

        return NextResponse.json(result);

    } catch (error) {
        console.error("Global Search API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
