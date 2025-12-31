
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
    try {
        const query = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblMaterialRehandling]') AND name = 'ShiftInchargeId')
            BEGIN
                ALTER TABLE [Trans].[TblMaterialRehandling] ADD ShiftInchargeId INT NULL;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblMaterialRehandling]') AND name = 'MidScaleInchargeId')
            BEGIN
                ALTER TABLE [Trans].[TblMaterialRehandling] ADD MidScaleInchargeId INT NULL;
            END
        `;
        await executeQuery(query);
        return NextResponse.json({ success: true, message: 'Schema Updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
