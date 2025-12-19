'use client';

import { useState } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportTable from '@/components/reports/ReportTable';
import { toast } from 'sonner';

export default function LoadingMasterReportPage() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // State for Filter
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Columns based on User Request
    // Channels columns to match SQL Aliases exactly
    // Note: The SQL returns column names with spaces like "Operator's Name". 
    // The DataTable/ReportTable usually expects accessors to match data keys.
    const columns = [
        { header: 'Sl.No', accessor: 'SlNo' },
        { header: 'Cost Center', accessor: 'CostCenter' },
        { header: 'PMS Code', accessor: 'PMSCode' },
        { header: 'Year', accessor: 'Year' },
        { header: 'Month', accessor: 'Month' },
        { header: 'Date', accessor: 'Date' },
        { header: "Operator's Name", accessor: "Operator's Name" },
        { header: 'Shift', accessor: 'Shift' },
        { header: 'Loading Machine', accessor: 'Loading Machine' },
        { header: 'Loading Model', accessor: 'Loading Model' },
        { header: 'Relay', accessor: 'Relay' },
        { header: 'OHMR', accessor: 'OHMR' },
        { header: 'CHMR', accessor: 'CHMR' },
        { header: 'Net HMR', accessor: 'Net HMR' },
        { header: 'Total Working Hr', accessor: 'Total Working Hr' },
        { header: 'Coal Hrs', accessor: 'Coal Hrs' },
        { header: 'OB Hrs', accessor: 'OB Hrs' },
        { header: 'Coal Rehandling Hrs', accessor: 'Coal Rehandling Hrs' },
        { header: 'OB Rehandling Hrs', accessor: 'OB Rehandling Hrs' },
        { header: 'OB Trips', accessor: 'OB Trips' },
        { header: 'Quantity (BCM)', accessor: 'Quantity (BCM)' },
        { header: 'Coal Trips', accessor: 'Coal Trips' },
        { header: 'Quantity (MT)', accessor: 'Quantity (MT)' },
        { header: 'Trip/Hrs', accessor: 'Trip/Hrs' },
        { header: 'BCM/Hrs', accessor: 'BCM/Hrs' },
        { header: 'Development Hr (Mining)', accessor: 'Development Hr (Mining)' },
        { header: 'Face Marching Hr', accessor: 'Face Marching Hr' },
        { header: 'Development Hr (Non-Mining)', accessor: 'Development Hr (Non-Mining)' },
        { header: 'Blasting Marching Hr', accessor: 'Blasting Marching Hr' },
        { header: 'Running BD/Maintenance Hr', accessor: 'Running BD/Maintenance Hr' },
        { header: 'BD Hr.', accessor: 'BD Hr.' },
        { header: 'Maintenance Hr.', accessor: 'Maintenance Hr.' },
        { header: 'Coal Rehandling Trips', accessor: 'Coal Rehandling Trips' },
        { header: 'OB Rehandling Trips', accessor: 'OB Rehandling Trips' },
        { header: 'Other Rehandling Trips', accessor: 'Other Rehandling Trips' },
        { header: 'Sector', accessor: 'Sector' },
        { header: 'Patch', accessor: 'Patch' },
        { header: 'Method', accessor: 'Method' },
        { header: 'Remarks', accessor: 'Remarks' }
    ];

    const generateReport = async () => {
        setLoading(true);
        setReportData([]);

        const filters = { fromDate, toDate };

        try {
            const res = await fetch('/api/reports/loading-master', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.message) {
                    toast.success(data.message);
                } else {
                    setReportData(data);
                    if (data.length === 0) toast.info("No data found for selected range");
                }
            } else {
                toast.error(data.message || "Failed to generate report");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Loading Master Report</h1>

            <ReportFilter
                onGenerate={generateReport}
                loading={loading}
                showReportType={false}
                reportType="LoadingMaster"
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            <div className="mt-8">
                <ReportTable
                    columns={columns}
                    data={reportData}
                    generated={true}
                    reportName="Loading Master Report"
                    fromDate={fromDate}
                    toDate={toDate}
                />
            </div>
        </div>
    );
}
