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
            { id: user.id, username: user.username, role: user.role },
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

        return NextResponse.json({ message: 'Login successful', user });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
