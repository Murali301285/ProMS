'use client';

import { useState, useEffect, useMemo } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ProductionTsmplTable from './ProductionTsmplTable';
import { toast } from 'sonner';
import pageStyles from '../tentative-production/TentativePage.module.css';

export default function ProductionTsmplPage() {
    const [filter, setFilter] = useState({
        reportType: 'ProductionTsmpl',
        date: '',
        shiftId: ''
    });

    // Time Breakdown Inputs
    const [breakdown, setBreakdown] = useState({
        shiftChange: 0,
        breakTime: 0,
        blasting: 0,
        others: 0
    });

    const [shifts, setShifts] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Shifts
    useEffect(() => {
        const fetchShifts = async () => {
            const res = await fetch('/api/reports/production-tsmpl?type=shifts');
            const result = await res.json();
            if (result.success) setShifts(result.data);
        };
        fetchShifts();
    }, []);

    // Helper: Handle Input Change (Mins)
    const handleBreakdownChange = (field, val) => {
        setBreakdown(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
    };

    // Calculate Totals for Preview (Optional, but good UX)
    const calculatedStats = useMemo(() => {
        const totalMins = breakdown.shiftChange + breakdown.breakTime + breakdown.blasting + breakdown.others;
        const totalHrs = totalMins / 60;
        const workingHrs = 8 - totalHrs; // Assumption: 8hr shift
        return { totalMins, totalHrs: totalHrs.toFixed(1), workingHrs: workingHrs.toFixed(1) };
    }, [breakdown]);


    const handleGenerate = async () => {
        if (!filter.date) return toast.error('Please select a date');
        if (!filter.shiftId) return toast.error('Please select a shift');

        setLoading(true);
        setData(null);

        try {
            const payload = {
                date: filter.date,
                shiftId: filter.shiftId,
                ...breakdown // pass breakdown values
            };

            const res = await fetch('/api/reports/production-tsmpl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success('Report Generated');
            } else {
                toast.error(result.message || 'Failed to fetch');
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
            <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-10 print:hidden overflow-y-auto max-h-[40vh]">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-slate-800">Production TSMPL</h1>
                    <p className="text-slate-500 text-xs">Production, Rehandling, Crusher with Time Breakdown</p>
                </div>

                <div className="flex flex-col gap-6">

                    {/* Top Row: Date & Shift */}
                    <ReportFilter
                        reportType={filter.reportType}
                        setReportType={() => { }}
                        reportOptions={[{ value: 'ProductionTsmpl', label: 'Production TSMPL' }]}
                        fromDate={filter.date}
                        setFromDate={(val) => setFilter({ ...filter, date: val })}
                        singleDate={true}
                        onGenerate={handleGenerate}
                        loading={loading}
                        showReportType={false}
                    >
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

                    {/* Breakdown Input Table */}
                    <div className="max-w-5xl mx-auto mt-6 shadow-xl rounded-xl overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:shadow-2xl">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
                            <div className="flex flex-col">
                                <span className="font-bold text-lg tracking-wide">Time Breakdown Analysis</span>
                                <span className="text-slate-400 text-xs uppercase font-semibold tracking-wider">Enter duration in minutes</span>
                            </div>
                            <div className="bg-white/10 px-3 py-1 rounded text-xs font-medium text-slate-200 backdrop-blur-sm border border-white/10">
                                Auto-Calculated
                            </div>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-sm text-center border-collapse">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 text-left border-b border-r border-slate-100 w-32">Metric</th>
                                        <th className="px-4 py-4 border-b border-r border-slate-100">Shift Change</th>
                                        <th className="px-4 py-4 border-b border-r border-slate-100">Break/Tea</th>
                                        <th className="px-4 py-4 border-b border-r border-slate-100">Blasting</th>
                                        <th className="px-4 py-4 border-b border-r border-slate-100">Others</th>
                                        <th className="px-4 py-4 bg-slate-100 text-slate-700 border-b border-slate-200">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-left font-bold text-slate-700 border-r border-slate-100">
                                            Mins Input
                                        </td>
                                        <td className="px-2 py-3 border-r border-slate-100 relative">
                                            <input type="number"
                                                className="block w-full text-center px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 font-semibold hover:border-blue-300"
                                                placeholder="0"
                                                value={breakdown.shiftChange}
                                                onChange={e => handleBreakdownChange('shiftChange', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-slate-100">
                                            <input type="number"
                                                className="block w-full text-center px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 font-semibold hover:border-blue-300"
                                                placeholder="0"
                                                value={breakdown.breakTime}
                                                onChange={e => handleBreakdownChange('breakTime', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-slate-100">
                                            <input type="number"
                                                className="block w-full text-center px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 font-semibold hover:border-blue-300"
                                                placeholder="0"
                                                value={breakdown.blasting}
                                                onChange={e => handleBreakdownChange('blasting', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 border-r border-slate-100">
                                            <input type="number"
                                                className="block w-full text-center px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-slate-700 font-semibold hover:border-blue-300"
                                                placeholder="0"
                                                value={breakdown.others}
                                                onChange={e => handleBreakdownChange('others', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 bg-slate-50 font-bold text-center text-slate-800 text-lg">
                                            {calculatedStats.totalMins} <span className="text-xs font-normal text-slate-500">min</span>
                                        </td>
                                    </tr>
                                    <tr className="bg-slate-50/50 text-slate-500">
                                        <td className="px-6 py-3 text-left font-medium text-slate-500 border-r border-slate-100">Hrs (Converted)</td>
                                        <td className="px-4 py-3 border-r border-slate-100">{(breakdown.shiftChange / 60).toFixed(1)} <span className="text-[10px]">hr</span></td>
                                        <td className="px-4 py-3 border-r border-slate-100">{(breakdown.breakTime / 60).toFixed(1)} <span className="text-[10px]">hr</span></td>
                                        <td className="px-4 py-3 border-r border-slate-100">{(breakdown.blasting / 60).toFixed(1)} <span className="text-[10px]">hr</span></td>
                                        <td className="px-4 py-3 border-r border-slate-100">{(breakdown.others / 60).toFixed(1)} <span className="text-[10px]">hr</span></td>
                                        <td className="px-4 py-3 bg-slate-100 text-slate-800 font-bold border-t border-slate-200">
                                            {calculatedStats.totalHrs} <span className="text-xs font-normal text-slate-500">hr</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                            <div className="text-xs text-slate-400 font-medium">
                                * Total Lost Hours are subtracted from standard 8-hour shift.
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-slate-500 text-sm font-bold uppercase tracking-wide">Net Working Hours</span>
                                <div className={`flex items-baseline px-4 py-1.5 rounded-lg border ${parseFloat(calculatedStats.workingHrs) < 6 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'} shadow-sm`}>
                                    <span className="text-2xl font-extrabold tracking-tight mr-1">{calculatedStats.workingHrs}</span>
                                    <span className="text-sm font-bold opacity-80">Hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4 print:p-0 print:bg-white">
                <ProductionTsmplTable data={data} loading={loading} />
            </div>
        </div>
    );
}
