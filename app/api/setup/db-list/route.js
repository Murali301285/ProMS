
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const query = `
            SELECT SlNo, DbName, DisplayName, Environment, Remarks 
            FROM [Master].[TblDbConfig] 
            WHERE IsActive = 1 AND IsDelete = 0
            ORDER BY SlNo DESC
        `;
        const dbs = await executeQuery(query);
        return NextResponse.json(dbs);
    } catch (error) {
        console.error("Error fetching DB config:", error);
        return NextResponse.json({ message: 'Error fetching database configurations' }, { status: 500 });
    }
}
