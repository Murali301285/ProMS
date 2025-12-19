
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const tableNames = ['TblPage', 'TblModule', 'TblMenuAllocation', 'TblSubGroup'];
        const schemaInfo = {};

        for (const tableName of tableNames) {
            const cols = await executeQuery(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = @tableName AND TABLE_SCHEMA = 'Master'
            `, [{ name: 'tableName', value: tableName }]);

            schemaInfo[tableName] = cols.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`);
        }

        return NextResponse.json({ schema: schemaInfo });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}
