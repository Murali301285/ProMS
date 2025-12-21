import React, { useMemo } from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function EqGroupPerformanceTable({ data, date }) {
    if (!data) return null;

    // derived constants
    const dateObj = new Date(date);
    const monthName = dateObj.toLocaleString('default', { month: 'short' }) + '-' + dateObj.getFullYear().toString().slice(-2);

    // Format helpers
    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDec3 = (val) => val != null ? Number(val).toFixed(3) : '0.000';

    // Group Data by Activity
    const groupedData = useMemo(() => {
        const groups = {};
        data.forEach(row => {
            const activity = row.ActivityName || 'Unknown';
            if (!groups[activity]) groups[activity] = [];

            // Calculate Metrics
            const ftdEqRn = row.FTD_NoOfEqRn || 0;
            const ftdHrs = row.FTD_TotalHrs || 0;
            const ftdTrips = row.FTD_TotalTrips || 0;
            const ftdQty = row.FTD_TotalQty || 0;

            const ftmHrs = row.FTM_TotalHrs || 0;
            const ftmTrips = row.FTM_TotalTrips || 0;
            const ftmQty = row.FTM_TotalQty || 0;

            const rnHrsEq = ftdEqRn > 0 ? ftdHrs / ftdEqRn : 0;
            const ftdTripsHr = ftdHrs > 0 ? ftdTrips / ftdHrs : 0;
            const ftdBCMHr = ftdHrs > 0 ? ftdQty / ftdHrs : 0;

            const ftmTripsHr = ftmHrs > 0 ? ftmTrips / ftmHrs : 0;
            const ftmBCMHr = ftmHrs > 0 ? ftmQty / ftmHrs : 0;

            groups[activity].push({
                ...row,
                metrics: {
                    rnHrsEq,
                    ftdTripsHr,
                    ftdBCMHr,
                    ftmTripsHr,
                    ftmBCMHr
                },
                raw: { ftdEqRn, ftdHrs, ftdTrips, ftdQty, ftmHrs, ftmTrips, ftmQty }
            });
        });
        return groups;
    }, [data]);

    const activities = Object.keys(groupedData).sort();

    const handlePrint = () => window.print();

    // Export Logic Skipped for brevity (UI Focus)
    const handleExportExcel = () => {
        // ... existing export placeholder ...
        alert("Excel Export update needed for new columns - verifying UI first.");
    };

    return (
        <div className={styles.container}>
            <div className="flex justify-end gap-2 mb-4 no-print">
                <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1 bg-slate-100 border rounded cursor-pointer">
                    <Printer size={16} /> Print
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded cursor-pointer">
                    <Download size={16} /> Excel
                </button>
            </div>

            <div className={styles.reportSheet}>
                <div className="text-center mb-6 uppercase font-bold text-slate-800">
                    <h1 className="text-xl">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                    <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4">EQUIPMENT MODEL-WISE PERFORMANCE AND EFFICIENCY REPORT</h3>
                    <div className="mt-2 text-sm text-slate-600">Date: {date}</div>
                </div>

                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr className="bg-orange-100 text-slate-800">
                                <th rowSpan="2" className="w-40 bg-white border-none"></th>
                                <th colSpan="10" className="bg-rose-100 text-center border font-bold">F. T. D ({date})</th>
                                <th colSpan="4" className="bg-amber-100 text-center border font-bold">F. T. M : {monthName}</th>
                            </tr>

                            <tr className="bg-slate-100 text-xs font-bold text-slate-700 text-center">
                                <th className="bg-white border text-left px-2">ACTIVITY</th>

                                {/* FTD Columns (10) */}
                                <th className="w-20">No Of Eq. Rn</th>
                                <th className="w-20">Rn. Hrs./ Eq.</th>
                                <th className="w-20">Target Trip/Hr</th>
                                <th className="w-20">TRIPS / Hr.</th>
                                <th className="w-24">Target BCM/Hr</th>
                                <th className="w-24">BCM/Hr.</th>
                                <th className="w-24">Target HSD/BCM</th>
                                <th className="w-24">HSD/BCM</th>
                                <th className="w-24">Target HSD/Hr</th>
                                <th className="w-24">HSD/Hr</th>

                                {/* FTM Columns (4) */}
                                <th className="w-20">Trip / Hr.</th>
                                <th className="w-24">BCM(MT) / Hr.</th>
                                <th className="w-24">HSD/BCM</th>
                                <th className="w-24">HSD/Hr</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act, idx) => {
                                const rows = groupedData[act];

                                // Calculate Subtotals
                                const sub = rows.reduce((acc, r) => ({
                                    ftdEqRn: acc.ftdEqRn + r.raw.ftdEqRn,
                                    ftdHrs: acc.ftdHrs + r.raw.ftdHrs,
                                    ftdTrips: acc.ftdTrips + r.raw.ftdTrips,
                                    ftdQty: acc.ftdQty + r.raw.ftdQty,
                                    ftmHrs: acc.ftmHrs + r.raw.ftmHrs,
                                    ftmTrips: acc.ftmTrips + r.raw.ftmTrips,
                                    ftmQty: acc.ftmQty + r.raw.ftmQty,
                                }), { ftdEqRn: 0, ftdHrs: 0, ftdTrips: 0, ftdQty: 0, ftmHrs: 0, ftmTrips: 0, ftmQty: 0 });

                                // Subtotal Metrics
                                const subRnHrsEq = sub.ftdEqRn > 0 ? sub.ftdHrs / sub.ftdEqRn : 0;
                                const subFtdTripsHr = sub.ftdHrs > 0 ? sub.ftdTrips / sub.ftdHrs : 0;
                                const subFtdBCMHr = sub.ftdHrs > 0 ? sub.ftdQty / sub.ftdHrs : 0;
                                const subFtmTripsHr = sub.ftmHrs > 0 ? sub.ftmTrips / sub.ftmHrs : 0;
                                const subFtmBCMHr = sub.ftmHrs > 0 ? sub.ftmQty / sub.ftmHrs : 0;

                                return (
                                    <React.Fragment key={act}>
                                        {/* Activity Header - Inline Styled */}
                                        <tr style={{ backgroundColor: '#C7D2FE', borderBottom: '1px solid #818CF8' }}>
                                            <td colSpan="15" className="pl-4 py-1" style={{ fontWeight: '800', color: '#1E1B4B', fontSize: '1.05rem', textTransform: 'uppercase' }}>
                                                {act}
                                            </td>
                                        </tr>

                                        {rows.map((r, rIdx) => (
                                            <tr key={idx + '-' + rIdx} className="bg-white hover:bg-blue-50 border-b text-center text-sm">
                                                <td className="text-left pl-4 font-medium border-r">{r.EquipmentGroupName}</td>

                                                {/* FTD */}
                                                <td className="font-bold">{r.FTD_NoOfEqRn}</td>
                                                <td>{fmtDec2(r.metrics.rnHrsEq)}</td>
                                                <td>-</td>
                                                <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdTripsHr)}</td>
                                                <td>-</td>
                                                <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdBCMHr)}</td>
                                                <td>-</td>
                                                <td>-</td>
                                                <td>-</td>
                                                <td>-</td>

                                                {/* FTM */}
                                                <td className="bg-amber-50 font-bold">{fmtDec2(r.metrics.ftmTripsHr)}</td>
                                                <td className="bg-amber-50 font-bold">{fmtDec2(r.metrics.ftmBCMHr)}</td>
                                                <td className="bg-amber-50">-</td>
                                                <td className="bg-amber-50">-</td>
                                            </tr>
                                        ))}

                                        {/* Activity Total - Inline Styled */}
                                        <tr style={{ backgroundColor: '#FDE047', borderTop: '2px solid #CA8A04' }}>
                                            <td className="text-right pr-4 font-extrabold" style={{ color: '#000' }}>Total</td>

                                            {/* FTD Totals */}
                                            <td className="font-bold" style={{ color: '#000' }}>{sub.ftdEqRn}</td>
                                            <td className="font-bold" style={{ color: '#000' }}>{fmtDec2(subRnHrsEq)}</td>
                                            <td>-</td>
                                            <td className="font-bold" style={{ color: '#000' }}>{fmtDec2(subFtdTripsHr)}</td>
                                            <td>-</td>
                                            <td className="font-bold" style={{ color: '#000' }}>{fmtDec2(subFtdBCMHr)}</td>
                                            <td>-</td>
                                            <td>-</td>
                                            <td>-</td>
                                            <td>-</td>

                                            {/* FTM Totals */}
                                            <td className="font-bold" style={{ color: '#000' }}>{fmtDec2(subFtmTripsHr)}</td>
                                            <td className="font-bold" style={{ color: '#000' }}>{fmtDec2(subFtmBCMHr)}</td>
                                            <td>-</td>
                                            <td>-</td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
