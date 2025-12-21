import { getDbConnection } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'ProMS2_SPReportCHPPSSProduction.sql');
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        const pool = await getDbConnection();
        // Split by GO if necessary, but typically for CREATE PROCEDURE, we execute one block.
        // However, standard MSSQL drivers might want GO removed.
        // The file content I wrote does NOT contain GO. It is a single CREATE OR ALTER.

        await pool.request().query(sqlContent);

        return NextResponse.json({ success: true, message: 'SP Deployed Successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
