'use client';

import { useState } from 'react';
import ReportTable from '@/components/reports/ReportTable';
import ReportFilter from '@/components/reports/ReportFilter';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function EquipmentPerformanceReportPage() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // State for Single Date Filter
    const [date, setDate] = useState('');

    const columns = [
        { header: 'Sl.No', accessor: 'SlNo' },
        { header: 'PMS Code', accessor: 'PMSCode' },
        { header: 'Cost Center', accessor: 'CostCenter' },
        { header: 'Equipment', accessor: 'Equipment' },
        { header: 'Activity', accessor: 'Activity' },

        // Shift A
        { header: 'Shift ATotal Trips', accessor: 'Shift ATotal Trips' },
        { header: 'Shift ATotal Qty', accessor: 'Shift ATotal Qty' },
        { header: 'Shift ATotal Hrs', accessor: 'Shift ATotal Hrs' },
        { header: 'Shift ATotal Kms', accessor: 'Shift ATotal Kms' },
        { header: 'Shift ATrips Per Hr', accessor: 'Shift ATrips Per Hr' },
        { header: 'Shift AQty Per Hr', accessor: 'Shift AQty Per Hr' },

        // Shift B
        { header: 'Shift BTotal Trips', accessor: 'Shift BTotal Trips' },
        { header: 'Shift BTotal Qty', accessor: 'Shift BTotal Qty' },
        { header: 'Shift BTotal Hrs', accessor: 'Shift BTotal Hrs' },
        { header: 'Shift BTotal Kms', accessor: 'Shift BTotal Kms' },
        { header: 'Shift BTrips Per Hr', accessor: 'Shift BTrips Per Hr' },
        { header: 'Shift BQty Per Hr', accessor: 'Shift BQty Per Hr' },

        // Shift C
        { header: 'Shift CTotal Trips', accessor: 'Shift CTotal Trips' },
        { header: 'Shift CTotal Qty', accessor: 'Shift CTotal Qty' },
        { header: 'Shift CTotal Hrs', accessor: 'Shift CTotal Hrs' },
        { header: 'Shift CTotal Kms', accessor: 'Shift CTotal Kms' },
        { header: 'Shift CTrips Per Hr', accessor: 'Shift CTrips Per Hr' },
        { header: 'Shift CQty Per Hr', accessor: 'Shift CQty Per Hr' },

        // FTD (For The Day)
        { header: 'FTDTotal Trips', accessor: 'FTDTotal Trips' },
        { header: 'FTDTotal Qty', accessor: 'FTDTotal Qty' },
        { header: 'FTDTotal Hrs', accessor: 'FTDTotal Hrs' },
        { header: 'FTDTotal Kms', accessor: 'FTDTotal Kms' },
        { header: 'FTDTotal Fuel', accessor: 'FTDTotal Fuel' },
        { header: 'FTDTrips Per Hr', accessor: 'FTDTrips Per Hr' },
        { header: 'FTDQty Per Hr', accessor: 'FTDQty Per Hr' },
        { header: 'FTDFuel Per Hr', accessor: 'FTDFuel Per Hr' },
        { header: 'FTDKMPL', accessor: 'FTDKMPL' },

        // MTD (Month To Date)
        { header: 'MTDTotal Trips', accessor: 'MTDTotal Trips' },
        { header: 'MTDTotal Qty', accessor: 'MTDTotal Qty' },
        { header: 'MTDTotal Hrs', accessor: 'MTDTotal Hrs' },
        { header: 'MTDTotal Kms', accessor: 'MTDTotal Kms' },
        { header: 'MTDTotal Fuel', accessor: 'MTDTotal Fuel' },
        { header: 'MTDTrips Per Hr', accessor: 'MTDTrips Per Hr' },
        { header: 'MTDQty Per Hr', accessor: 'MTDQty Per Hr' },
        { header: 'MTDFuel Per Hr', accessor: 'MTDFuel Per Hr' },
        { header: 'MTDKMPL', accessor: 'MTDKMPL' },

        { header: 'Remarks', accessor: 'Remarks' }
    ];

    const generateReport = async () => {
        // Validation handled by ReportFilter component effectively, 
        // but we keep this check if needed for other logic
        if (!date) {
            // Toast handled by ReportFilter usually, but redundant check doesn't hurt
            // We rely on component since it calls onGenerate
        }

        setLoading(true);
        setReportData([]);

        try {
            const res = await fetch('/api/reports/equipment-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.message) {
                    toast.success(data.message);
                } else {
                    setReportData(data);
                    if (data.length === 0) toast.info("No data found for selected date");
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Equipment Performance Report</h1>

            <ReportFilter
                onGenerate={generateReport}
                loading={loading}
                showReportType={false}
                reportType="EquipmentPerformance"
                fromDate={date}
                setFromDate={setDate}
                singleDate={true}
            />

            <div className="mt-8">
                <ReportTable
                    columns={columns}
                    data={reportData}
                    generated={true}
                    reportName="Equipment Performance Report"
                    fromDate={date}
                    toDate={date}
                />
            </div>
        </div>
    );
}
