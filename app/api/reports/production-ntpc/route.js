import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import sql from 'mssql';

// Force Rebuild Comment - Timestamp: 2025-12-19

// GET: Fetch Shifts for Dropdown
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        // Use getDbConnection
        const pool = await getDbConnection();

        if (type === 'shifts') {
            const result = await pool.request().query("SELECT SlNo, ShiftName FROM Master.TblShift WHERE IsActive = 1 ORDER BY SlNo");
            return NextResponse.json({ success: true, data: result.recordset });
        }

        return NextResponse.json({ success: false, message: "Invalid Request" });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST: Generate Report Data
export async function POST(request) {
    try {
        const { date, shiftId } = await request.json();

        if (!date || !shiftId) {
            return NextResponse.json({ success: false, message: "Date and Shift are required" }, { status: 400 });
        }

        const pool = await getDbConnection();

        const result = await pool.request()
            .input('Date', sql.Date, date)
            .input('ShiftId', sql.Int, shiftId)
            .execute('SPReportProductionNTPC');

        // Map Result Sets
        const summaryData = result.recordsets[0]?.[0] || {};
        const crusherDetails = result.recordsets[1] || [];
        const headerInfo = result.recordsets[2]?.[0] || {};

        return NextResponse.json({
            success: true,
            data: {
                summary: summaryData,
                crusher: crusherDetails,
                headerInfo: headerInfo
            }
        });

    } catch (error) {
        console.error("Report Generation Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
