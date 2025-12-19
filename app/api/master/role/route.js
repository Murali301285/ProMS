import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT SlNo, RoleName, Remarks, IsActive, CreatedDate 
            FROM [Master].[TblRole_New] 
            WHERE IsDelete = 0 
            ORDER BY RoleName ASC
        `;
        const result = await executeQuery(query);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { action, id, name, remarks, isActive } = body;

        if (action === 'create') {
            await executeQuery(
                `INSERT INTO [Master].[TblRole_New] (RoleName, Remarks, IsActive, IsDelete, CreatedDate) VALUES (@name, @remarks, @isActive, 0, GETDATE())`,
                [{ name: 'name', value: name }, { name: 'remarks', value: remarks }, { name: 'isActive', value: isActive ?? 1 }]
            );
            return NextResponse.json({ success: true, message: 'Role Created' });
        }

        if (action === 'update') {
            await executeQuery(
                `UPDATE [Master].[TblRole_New] SET RoleName = @name, Remarks = @remarks, IsActive = @isActive, UpdatedDate = GETDATE() WHERE SlNo = @id`,
                [{ name: 'name', value: name }, { name: 'remarks', value: remarks }, { name: 'isActive', value: isActive }, { name: 'id', value: id }]
            );
            return NextResponse.json({ success: true, message: 'Role Updated' });
        }

        if (action === 'delete') {
            await executeQuery(
                `UPDATE [Master].[TblRole_New] SET IsDelete = 1, UpdatedDate = GETDATE() WHERE SlNo = @id`,
                [{ name: 'id', value: id }]
            );
            return NextResponse.json({ success: true, message: 'Role Deleted' });
        }

        return NextResponse.json({ message: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
