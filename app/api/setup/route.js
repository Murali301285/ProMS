
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export async function GET() {
    try {
        const pool = await getDbConnection();

        // Check if Admin role exists
        const roleCheck = await pool.request()
            .query("SELECT SlNo FROM [Master].[TblRole] WHERE RoleName = 'Admin'");

        let roleId;
        if (roleCheck.recordset.length === 0) {
            const roleInsert = await pool.request()
                .query("INSERT INTO [Master].[TblRole] (RoleName) OUTPUT INSERTED.SlNo VALUES ('Admin')");
            roleId = roleInsert.recordset[0].SlNo;
        } else {
            roleId = roleCheck.recordset[0].SlNo;
        }

        // Check if Admin user exists
        const userCheck = await pool.request()
            .query("SELECT UserName, Password FROM [Master].[TblUser] WHERE UserName = 'admin'");

        if (userCheck.recordset.length > 0) {
            const u = userCheck.recordset[0];
            return NextResponse.json({
                message: 'User already exists',
                credentials: { username: u.UserName, password: u.Password }
            });
        }

        // Create Admin User
        await pool.request()
            .input('RoleId', roleId)
            .query(`
                INSERT INTO [Master].[TblUser] (UserName, Password, RoleId, IsDelete, Active)
                VALUES ('admin', 'admin123', @RoleId, 0, 1)
            `);

        return NextResponse.json({
            message: 'Default admin created',
            credentials: { username: 'admin', password: 'admin123' }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
