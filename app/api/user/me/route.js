import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function GET(req) {
    try {
        const user = await authenticateUser(req);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: true, user: { name: user.name, username: user.username, role: user.role } });
    } catch (error) {
        console.error("API /user/me Error:", error);
        return NextResponse.json({ success: false, message: error.message || "Internal Error" }, { status: 500 });
    }
}
