
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dups = await executeQuery(`
            SELECT UserName, COUNT(*) as Cnt 
            FROM [Master].[TblUser_New] 
            WHERE IsDelete = 0 
            GROUP BY UserName 
            HAVING COUNT(*) > 1
        `);

        return NextResponse.json({
            duplicates: dups,
            message: dups.length > 0 ? "Duplicates Found" : "No Duplicates"
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
