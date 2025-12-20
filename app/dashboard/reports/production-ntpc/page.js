'use client';

import { useState, useEffect } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ProductionNtpcTable from './ProductionNtpcTable';
import { toast } from 'sonner';
import pageStyles from '../tentative-production/TentativePage.module.css'; // Reusing styles

export default function ProductionNtpcPage() {
    const [filter, setFilter] = useState({
        reportType: 'ProductionNtpc',
        date: '',
        shiftId: ''
    });

    const [shifts, setShifts] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Shifts on Load
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch('/api/reports/production-ntpc?type=shifts');
                const result = await res.json();
                if (result.success) {
                    setShifts(result.data);
                }
            } catch (error) {
                console.error("Failed to load shifts", error);
            }
        };
        fetchShifts();
    }, []);

    const handleGenerate = async () => {
        if (!filter.date) return toast.error('Please select a date');
        if (!filter.shiftId) return toast.error('Please select a shift');

        setLoading(true);
        setData(null);

        try {
            const res = await fetch('/api/reports/production-ntpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: filter.date, shiftId: filter.shiftId })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success('Report Generated');
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* Header / Filter Section */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 print:hidden">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Production NTPC</h1>
                    <p className="text-slate-500 text-xs">Coal and OB Production, WP-3, and Crusher Details</p>
                </div>

                <ReportFilter
                    reportType={filter.reportType}
                    setReportType={() => { }}
                    reportOptions={[{ value: 'ProductionNtpc', label: 'Production NTPC' }]}
                    fromDate={filter.date}
                    setFromDate={(val) => setFilter({ ...filter, date: val })}
                    singleDate={true}
                    onGenerate={handleGenerate}
                    loading={loading}
                    showReportType={false}
                >
                    {/* Inject Shift Dropdown */}
                    <div className={pageStyles.inputGroup}>
                        <label className={pageStyles.label}>Shift</label>
                        <select
                            className={pageStyles.select}
                            value={filter.shiftId}
                            onChange={(e) => setFilter({ ...filter, shiftId: e.target.value })}
                        >
                            <option value="">Select Shift</option>
                            {shifts.map(s => (
                                <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
                            ))}
                        </select>
                    </div>
                </ReportFilter>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4 print:p-0 print:bg-white">
                <ProductionNtpcTable data={data} loading={loading} />
            </div>
        </div>
    );
}
