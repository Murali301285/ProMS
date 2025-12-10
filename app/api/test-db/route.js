import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query('SELECT @@VERSION as version');
        return NextResponse.json({
            success: true,
            message: 'Connected successfully',
            version: result.recordset[0].version
        });
    } catch (error) {
        console.error('DB Connection Test Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Connection failed',
            error: error.message
        }, { status: 500 });
    }
}
