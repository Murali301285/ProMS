
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { encryptPassword } from '@/lib/auth';


const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,20}$/;

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
        const decoded = jwt.verify(token, SECRET);
        return decoded.id; // Assuming token has 'id'
    } catch (e) {
        return null;
    }
}

export async function GET(req) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const pool = await getDbConnection();
        const result = await pool.request()
            .input('UserId', userId)
            .query(`SELECT EmpName, UserName, ProfileImage FROM [Master].[TblUser_New] WHERE SlNo = @UserId`);

        if (result.recordset.length === 0) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        return NextResponse.json({ success: true, user: result.recordset[0] });
    } catch (error) {
        console.error("Profile GET Error", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { empName, profileImage, oldPassword, newPassword } = body;

        const pool = await getDbConnection();
        const request = pool.request().input('UserId', userId);

        let updates = [];

        // 1. Update Basic Info
        if (empName) {
            updates.push("EmpName = @EmpName");
            request.input('EmpName', empName);
        }
        if (profileImage !== undefined) {
            // profileImage can be null/empty string to remove, or base64
            updates.push("ProfileImage = @ProfileImage");
            request.input('ProfileImage', sql.NVarChar(sql.MAX), profileImage);
        }

        // 2. Password Update
        if (newPassword) {
            if (!oldPassword) {
                return NextResponse.json({ message: 'Old password is required to set a new password' }, { status: 400 });
            }

            // Verify Old Password
            const userCheck = await pool.request()
                .input('UserId', userId)
                .query(`SELECT Password FROM [Master].[TblUser_New] WHERE SlNo = @UserId`);

            if (userCheck.recordset.length === 0) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }

            const dbPassword = userCheck.recordset[0].Password;
            const encryptedOldPass = encryptPassword(oldPassword);
            const isValid = (dbPassword === encryptedOldPass) || (dbPassword === oldPassword);

            if (!isValid) {
                return NextResponse.json({ message: 'Incorrect old password' }, { status: 400 });
            }

            // Validate New Password Policy
            if (!PASSWORD_REGEX.test(newPassword)) {
                return NextResponse.json({ message: 'Password does not meet policy requirements' }, { status: 400 });
            }

            updates.push("Password = @NewPassword");
            request.input('NewPassword', encryptPassword(newPassword));
        }


        if (updates.length > 0) {
            updates.push("UpdatedDate = GETDATE()");

            const query = `UPDATE [Master].[TblUser_New] SET ${updates.join(', ')} WHERE SlNo = @UserId`;
            await request.query(query);
        }

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });

    } catch (error) {
        console.error("Profile PUT Error", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
