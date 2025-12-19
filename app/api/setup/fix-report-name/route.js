import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pageId = 54; // We identified this as the Report Page ID
        const newName = 'Material Rehandling Report';

        await executeQuery(`
            UPDATE [Master].[TblPage] 
            SET PageName = @name, UpdatedDate = GETDATE()
            WHERE SlNo = @id
        `, [
            { name: 'name', value: newName },
            { name: 'id', type: 'Int', value: pageId }
        ]);

        return NextResponse.json({
            success: true,
            message: `Renamed Page ID ${pageId} to ${newName}`
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
