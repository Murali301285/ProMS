'use client';

import { useState } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportTable from '@/components/reports/ReportTable';
import { toast } from 'sonner';

/**
 * Material Rehandling Detailed Report
 */
export default function MaterialRehandlingReport() {
    const [filter, setFilter] = useState({
        reportType: 'MaterialRehandling',
        fromDate: '',
        toDate: ''
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Columns Configuration (Matched with SQL Aliases)
    const columns = [
        { header: 'Sl.No', accessor: 'SlNo', width: '60px' },
        { header: 'Cost Center Loading', accessor: 'CostCenterLoading', width: '120px' },
        { header: 'PMS Code Loading', accessor: 'ProdsysCodeLoading', width: '120px' },
        { header: 'Cost Center Hauling', accessor: 'CostCenterHauler', width: '120px' },
        { header: 'PMS Code Hauling', accessor: 'ProdsysCodeHauling', width: '120px' },
        { header: 'Year', accessor: 'Year', width: '60px' },
        { header: 'Month', accessor: 'Month', width: '100px' },
        { header: 'Date', accessor: 'Date', width: '100px' },
        { header: 'Shift', accessor: 'ShiftName', width: '80px' },
        { header: 'Source', accessor: 'SourceName', width: '120px' },
        { header: 'Destination', accessor: 'Destination', width: '120px' },
        { header: 'Hauler', accessor: 'HaulerEquipment', width: '120px' },
        { header: 'Loading Machine', accessor: 'LoadingMachine', width: '130px' },
        { header: 'Material', accessor: 'MaterialName', width: '120px' },
        { header: 'NTPC Qty/Trip', accessor: 'NtpcQtyTrip', width: '100px' },
        { header: 'Manag. Qty/Trip', accessor: 'ManagQtyTrip', width: '100px' },
        { header: 'Trip (NTPC)', accessor: 'TripNtpc', width: '90px' },
        { header: 'Trip (Management)', accessor: 'TripManagement', width: '120px' },
        { header: 'TotalQty', accessor: 'ManagTotalQty', width: '100px' }, // Displaying Management Total Qty as TotalQty per request context implies this is the main qty.
        { header: 'Loading Model', accessor: 'LoadingModel', width: '120px' },
        { header: 'Hauling Model', accessor: 'HaulingModel', width: '120px' },
        { header: 'Scale', accessor: 'ScaleName', width: '100px' },
        { header: 'Sector', accessor: 'Sector', width: '100px' },
        { header: 'Patch', accessor: 'Patch', width: '100px' },
        { header: 'Relay', accessor: 'Relay', width: '80px' },
        { header: 'Shift Incharge', accessor: 'ShiftIncharge', width: '150px' },
        { header: 'Remarks', accessor: 'Remarks', width: '200px' }
    ];

    const handleGenerate = async () => {
        if (!filter.fromDate || !filter.toDate) return toast.error('Please select date range');

        setLoading(true);
        setData([]);

        try {
            const res = await fetch('/api/reports/material-rehandling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromDate: filter.fromDate, toDate: filter.toDate })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success(`Loaded ${result.data.length} records`);
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
            setGenerated(true);
        }
    };

    return (
        <div className="p-6 h-screen flex flex-col bg-slate-50">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Material Rehandling Report</h1>
                <p className="text-slate-500 text-sm">Transaction logs for material rehandling</p>
            </div>

            <ReportFilter
                reportType={filter.reportType}
                setReportType={(val) => setFilter({ ...filter, reportType: val })}
                fromDate={filter.fromDate}
                setFromDate={(val) => setFilter({ ...filter, fromDate: val })}
                toDate={filter.toDate}
                setToDate={(val) => setFilter({ ...filter, toDate: val })}
                onGenerate={handleGenerate}
                onReset={() => setData([])}
                loading={loading}
                showReportType={false}
            />

            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                reportName="Material Rehandling"
                fromDate={filter.fromDate}
                toDate={filter.toDate}
                generated={generated}
            />
        </div>
    );
}
