
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoading'
        `;
        const res = await executeQuery(query);
        return NextResponse.json({ success: true, columns: res.map(x => x.COLUMN_NAME) });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
