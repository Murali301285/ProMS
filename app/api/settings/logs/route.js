
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
    try {
        const logDir = path.join(process.cwd(), 'logs');
        const errorLogPath = path.join(logDir, 'error.log');

        if (!fs.existsSync(errorLogPath)) {
            return NextResponse.json({ logs: 'No error logs found.' });
        }

        const stats = fs.statSync(errorLogPath);
        // If file is too huge, read only last 50KB or so. For now, read all (assuming rotation keeps it manageable or it's small)
        // Let's read the file.
        const content = fs.readFileSync(errorLogPath, 'utf8');

        // Maybe split by newlines and reverse to show latest first?
        const lines = content.trim().split('\n').reverse().join('\n');

        return NextResponse.json({ logs: lines });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
