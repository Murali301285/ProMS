import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ message: 'Username and Password are required' }, { status: 400 });
        }

        const user = await verifyUser(username, password);

        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT Token
        const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, roleId: user.roleId },
            SECRET,
            { expiresIn: '30m' } // 30 Minutes Session
        );

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60, // 30 minutes in seconds
            path: '/',
        });

        cookieStore.set('role_id', user.roleId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60,
            path: '/',
        });

        cookieStore.set('current_db', 'ProdMS_live', { // Default to live for now, or dynamic
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60,
            path: '/',
        });

        // Time Verification Logic
        let timeMismatch = false;
        let serverTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        let actualTime = null;
        let diffMinutes = 0;

        try {
            const timeRes = await fetch('http://worldtimeapi.org/api/timezone/Asia/Kolkata', { signal: AbortSignal.timeout(3000) }); // 3s timeout
            if (timeRes.ok) {
                const timeData = await timeRes.json();
                actualTime = new Date(timeData.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

                const apiDate = new Date(timeData.datetime);
                const serverDate = new Date();

                const diffMs = Math.abs(serverDate - apiDate);
                diffMinutes = Math.floor(diffMs / 60000);

                if (diffMinutes > 5) {
                    timeMismatch = true;
                }
            }
        } catch (e) {
            console.warn("Time API check failed, skipping verification", e.message);
        }

        return NextResponse.json({
            message: 'Login successful',
            user,
            timeCheck: {
                mismatch: timeMismatch,
                serverTime,
                actualTime: actualTime || "Could not fetch",
                diffMinutes
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
