import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pages = await executeQuery(`SELECT * FROM [Master].[TblPage] WHERE PageName LIKE '%Rehandling%'`);
        return NextResponse.json({ debugVersion: 'V6', pages });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
