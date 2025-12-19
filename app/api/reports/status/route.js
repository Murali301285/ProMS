import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        // In a real app, filter by User ID from Session. 
        // For now, fetching all recently generated reports.
        const query = `
            SELECT TOP 50 
                SlNo, ReportType, Criteria, Status, ArtifactPath, 
                FORMAT(RequestedDate, 'dd-MMM-yyyy HH:mm:ss') as RequestedDate,
                CompletedDate, ErrorMessage
            FROM [Trans].[TblReportRequest]
            WHERE IsDelete = 0
            ORDER BY RequestedDate DESC
        `;

        const data = await executeQuery(query);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
