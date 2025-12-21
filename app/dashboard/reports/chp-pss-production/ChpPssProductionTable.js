import React, { useMemo } from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function ChpPssProductionTable({ production, stoppages, allReasons, month }) {
    if (!production || !stoppages) return null;

    const monthObj = new Date(month + "-01");
    const monthName = monthObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDec3 = (val) => val != null ? Number(val).toFixed(3) : '0.000';
    const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    // 1. Pivot Logic: Use Master List if available
    const distinctReasons = useMemo(() => {
        if (allReasons && allReasons.length > 0) {
            return allReasons.map(r => r.BDReasonName);
        }
        // Fallback
        const reasons = new Set();
        stoppages.forEach(s => {
            if (s.ReasonName) reasons.add(s.ReasonName);
        });
        return Array.from(reasons).sort();
    }, [stoppages, allReasons]);

    // 2. Merge Data by Date
    const mergedData = useMemo(() => {
        const daysInMonth = new Date(monthObj.getFullYear(), monthObj.getMonth() + 1, 0).getDate();
        const rows = [];

        for (let i = 1; i <= daysInMonth; i++) {
            // Create date string YYYY-MM-DD (local) - Careful with timezone, better strict construction
            const d = new Date(monthObj.getFullYear(), monthObj.getMonth(), i);
            // Match helper:
            const matchDate = (dataRow) => {
                const rowDate = new Date(dataRow.WorkDate);
                return rowDate.getDate() === i && rowDate.getMonth() === monthObj.getMonth();
            };

            const prodRow = production.find(matchDate) || {};
            const stopRows = stoppages.filter(matchDate);

            // Pivot Stoppages
            const stopMap = {};
            let totalStopHrs = 0;
            let stoppageRemarks = [];

            distinctReasons.forEach(r => {
                const entry = stopRows.find(s => s.ReasonName === r);
                const hrs = entry ? entry.StoppageHours : 0;
                stopMap[r] = hrs;
                totalStopHrs += hrs;
                if (entry && entry.StoppageRemarks) stoppageRemarks.push(`${r}: ${entry.StoppageRemarks} `);
            });

            // Calculations
            // Total Day Hour = running + stoppage? Or Fixed 24? Screenshot says "Total Day Hour" is 24:00 mostly.
            // If Run + Stop != 24, there is Idle? No, screenshot has "Total Idle Hour".
            // Let's assume Total Day = 24.
            // Total Idle = 24 - (Run + Stop).
            const runHr = prodRow.RunningHr || 0;
            const totalDay = 24.00;
            const idleHr = Math.max(0, totalDay - (runHr + totalStopHrs));

            // Combine Remarks (Prod + Stoppages)
            const combinedRemarks = [
                prodRow.CrusherRemarks,
                ...stoppages.map(s => s.StoppageRemarks ? `${s.ReasonName}: ${s.StoppageRemarks}` : null)
            ].filter(Boolean).join('\n'); // Join everything with Newline first

            // Clean up: Split by newline to get individual lines for numbering
            // Since we joined by \n, and SQL aggregates by CHAR(10), we can split safely
            const finalRemarksList = combinedRemarks.split(/\r?\n/).filter(s => s.trim().length > 0);

            rows.push({
                date: d,
                prod: prodRow.ProductionQty || 0,
                tph: prodRow.TPH_Calculated || 0,
                runHr: runHr,
                stopMap,
                totalStopHrs,
                idleHr,
                totalDay,
                units: prodRow.PowerKWH || 0,
                remarksList: finalRemarksList // Pass list instead of string
            });
        }
        return rows;
    }, [production, stoppages, distinctReasons, monthObj]);

    // 3. Grand Totals
    const grand = mergedData.reduce((acc, r) => {
        acc.prod += r.prod;
        acc.tph = 0; // Avg? Or Sum? Column usually Sum or Avg. Screenshot TPH Total is ~1000, daily ~1000. It's likely Avg? Or Plant Total?
        // Screenshot: Plant Total Prod = 503502. TPH = 1027. (Sum of TPH? No. Avg? No. Maybe Plant Capacity?)
        // Let's just Sum it if requested, but TPH is rate. AVG makes sense.
        // User asked "Add Total at end". Usually Sum.
        // BUT TPH Sum is meaningless. Let's do Avg for TPH or recalculate (Total Prod / Total Run)?
        // Re-calc: Total Prod / 18.9 is likely the global formula user gave?
        // User said: "sum([ProductionQty]) /18.9 as TPH". So it applies to group too.

        acc.runHr += r.runHr;
        acc.totalStopHrs += r.totalStopHrs;
        acc.idleHr += r.idleHr;
        acc.totalDay += r.totalDay;
        acc.units += r.units;

        distinctReasons.forEach(reason => {
            acc.stopMap[reason] = (acc.stopMap[reason] || 0) + (r.stopMap[reason] || 0);
        });

        return acc;
    }, { prod: 0, runHr: 0, totalStopHrs: 0, idleHr: 0, totalDay: 0, units: 0, stopMap: {} });

    grand.tph = grand.prod / 18.9; // Global TPH

    const handlePrint = () => window.print();
    const handleExportExcel = () => alert("Excel Export pending UI verification.");

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
                    <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4">CHP PSS PRODUCTION REPORT</h3>
                    <div className="mt-2 text-sm text-slate-600">Month: {monthName}</div>
                </div>

                <div className="overflow-x-auto">
                    <table className={styles.table}>
                        <thead>
                            <tr className="bg-slate-100 text-xs font-bold text-slate-700 text-center">
                                <th className="bg-blue-200 border px-2 w-24">Date</th>
                                <th className="bg-blue-300 border px-1 w-24 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Plant Total Production</th>
                                <th className="bg-blue-300 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>TPH (Plant Running Based)</th>
                                <th className="bg-blue-300 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Running Hours</th>

                                {/* Dynamic Reasons */}
                                {distinctReasons.map(r => (
                                    <th key={r} className="bg-red-200 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>{r}</th>
                                ))}

                                <th className="bg-orange-300 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Total Breakdown Hrs</th>
                                <th className="bg-green-200 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Total Idle Hour</th>
                                <th className="bg-purple-300 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Total Stoppage (Non R.Hr)</th>
                                <th className="bg-yellow-200 border px-1 w-20 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Total Day Hour</th>
                                <th className="bg-yellow-200 border px-1 w-24 transform -rotate-90 h-32 align-bottom text-left p-2 origin-bottom-left" style={{ writingMode: 'vertical-rl' }}>Total Unit Consumption (KWH)</th>
                                <th className="bg-white border px-4 w-64">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mergedData.map((r, idx) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50 border-b text-center text-xs">
                                    <td className="border-r">{fmtDate(r.date)}</td>
                                    <td className="font-bold border-r">{fmt(r.prod)}</td>
                                    <td className="border-r">{fmtDec0(r.tph)}</td>
                                    <td className="border-r font-bold">{fmtDec2(r.runHr)}</td>

                                    {/* Reasons */}
                                    {distinctReasons.map(reason => (
                                        <td key={reason} className="border-r text-red-600">{fmtDec2(r.stopMap[reason] || 0)}</td>
                                    ))}

                                    <td className="border-r font-bold bg-orange-50">{fmtDec2(r.totalStopHrs)}</td>
                                    <td className="border-r bg-green-50">{fmtDec2(r.idleHr)}</td>
                                    <td className="border-r bg-purple-50">{fmtDec2(r.totalStopHrs)}</td>
                                    <td className="border-r font-bold bg-yellow-50">{fmtDec2(r.totalDay)}</td>
                                    <td className="border-r font-bold">{fmt(r.units)}</td>
                                    <td className="text-left px-2 text-[10px] align-top py-1">
                                        {r.remarksList.map((rem, i) => (
                                            <div key={i}>
                                                <span className="font-semibold">{i + 1}.</span> {rem}
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            ))}

                            {/* Grand Total */}
                            <tr style={{ backgroundColor: '#FACC15', fontWeight: 'bold' }}>
                                <td className="text-center border-r text-black">Total</td>
                                <td className="border-r text-black">{fmt(grand.prod)}</td>
                                <td className="border-r text-black">{fmtDec0(grand.tph)}</td>
                                <td className="border-r text-black">{fmtDec2(grand.runHr)}</td>

                                {distinctReasons.map(reason => (
                                    <td key={reason} className="border-r text-black">{fmtDec2(grand.stopMap[reason])}</td>
                                ))}

                                <td className="border-r text-black">{fmtDec2(grand.totalStopHrs)}</td>
                                <td className="border-r text-black">{fmtDec2(grand.idleHr)}</td>
                                <td className="border-r text-black">{fmtDec2(grand.totalStopHrs)}</td>
                                <td className="border-r text-black">{fmtDec2(grand.totalDay)}</td>
                                <td className="border-r text-black">{fmt(grand.units)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
