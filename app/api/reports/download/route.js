
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
        return NextResponse.json({ message: 'File name is required' }, { status: 400 });
    }

    // Security: Prevent Directory Traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(process.cwd(), 'reports', safeName);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Return as JSON
        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        console.error("Error serving report:", error);
        return NextResponse.json({ message: 'Error reading file' }, { status: 500 });
    }
}
