import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // Ensure verifyToken helper exists or implement logic
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
        try {
            const decoded = jwt.verify(token, SECRET);
            return NextResponse.json({
                user: {
                    id: decoded.id,
                    username: decoded.username,
                    role: decoded.role,
                    roleId: decoded.roleId
                }
            });
        } catch (e) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
