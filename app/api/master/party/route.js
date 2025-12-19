import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const query = `
            SELECT SlNo, PartyName 
            FROM [Master].[tblParty] 
            WHERE IsActive = 1 AND IsDelete = 0 
            ORDER BY PartyName ASC
        `;
        const result = await executeQuery(query);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    return NextResponse.json({ message: 'Use generic CRUD API for mutations' }, { status: 405 });
}

export async function PUT(req) {
    return NextResponse.json({ message: 'Use generic CRUD API for mutations' }, { status: 405 });
}

export async function DELETE(req) {
    return NextResponse.json({ message: 'Use generic CRUD API for mutations' }, { status: 405 });
}
