import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check Function
        const funcCheck = await executeQuery(`
            SELECT OBJECT_ID('dbo.GetOperatorName') as FuncID
        `);

        // Check Activity 4
        const actCheck = await executeQuery(`
            SELECT * FROM [Master].[TblActivity] WHERE SlNo = 4
        `);

        return NextResponse.json({
            hasFunction: funcCheck[0]?.FuncID !== null,
            activity4: actCheck[0]
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
